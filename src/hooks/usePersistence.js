import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { buildViewerPayload } from '../utils/viewerPayload';
import {
    exportAuctionBackup,
    TOAST_STYLES,
    EMOJIS
} from '../utils/constants';

export const usePersistence = (showManagedToast, user = null) => {
    const [lastSaveTime, setLastSaveTime] = useState(null);
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
    const lastAutoSaveAtRef = useRef(0);

    useEffect(() => {
        lastAutoSaveAtRef.current = 0;
        setLastSaveTime(null);
    }, [user?.id]);
    // Serialize writes so rapid auction actions cannot be dropped during another save.
    const saveQueueRef = useRef(Promise.resolve());
    const revisionRef = useRef(0);

    const createAuditContext = useCallback(() => ({
        actor_user_id: user?.id || null,
        actor_email: user?.email || null,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
        client_timestamp: new Date().toISOString()
    }), [user]);

    // Audit writes are best-effort and must never prevent a reset from completing.
    const logAuditEvent = useCallback(async (eventType, status = 'info', details = {}) => {
        if (!user?.id) {
            console.warn('[AUCTION_AUDIT] Skipped audit event: no authenticated user', { eventType, status });
            return false;
        }

        try {
            const { error } = await supabase.from('auction_audit_logs').insert([{
                user_id: user.id,
                event_type: eventType,
                status,
                details: { ...createAuditContext(), ...details }
            }]);
            if (error) throw error;
            console.info('[AUCTION_AUDIT] ' + eventType + ' [' + status + ']', details);
            return true;
        } catch (error) {
            console.error('[AUCTION_AUDIT] Failed to persist audit event:', {
                eventType, status, message: error.message
            });
            return false;
        }
    }, [user, createAuditContext]);

    // A successful authenticated save means Supabase has acknowledged the write.
    // Only then update the local confirmed snapshot. Failed writes never replace it.
    const saveState = useCallback((stateData) => {
        const saveOperation = async () => {
            const now = new Date().toISOString();
            const dataToSave = { ...stateData, timestamp: now, revision: ++revisionRef.current, version: '3.0' };
            let cloudSuccess = false;

            if (user?.id) {
                const payload = {
                    user_id: user.id,
                    user_email: user.email,
                    tournament_name: dataToSave.tournamentName || 'Untitled Tournament',
                    data: dataToSave,
                    updated_at: now
                };
                let lastError = null;
                for (let attempt = 0; attempt < 3; attempt += 1) {
                    try {
                        const { error } = await supabase.from('auction_data')
                            .upsert(payload, { onConflict: 'user_id' });
                        if (!error) {
                            cloudSuccess = true;
                            break;
                        }
                        lastError = error;
                    } catch (error) {
                        lastError = error;
                    }
                    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * (2 ** attempt)));
                }
                if (!cloudSuccess) {
                    console.error('Supabase save failed after retries:', lastError);
                    return false;
                }

                // Publish a compact, viewer-specific snapshot. Public viewers never need
                // the full auction backup JSON, so this dramatically reduces PostgREST egress.
                const viewerPayload = {
                    user_id: user.id,
                    data: buildViewerPayload(dataToSave),
                    updated_at: now
                };
                let viewerPublished = false;
                let viewerError = null;
                for (let attempt = 0; attempt < 3; attempt += 1) {
                    try {
                        const { error } = await supabase
                            .from('auction_viewer_data')
                            .upsert(viewerPayload, { onConflict: 'user_id' });
                        if (!error) {
                            viewerPublished = true;
                            break;
                        }
                        viewerError = error;
                    } catch (error) {
                        viewerError = error;
                    }
                    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * (2 ** attempt)));
                }
                if (!viewerPublished) {
                    // The private auction backup is already safely saved. Do not report the
                    // auction save itself as failed, but surface the stale-viewer risk clearly.
                    console.error('Viewer snapshot publish failed after retries:', viewerError);
                }
            }

            if (cloudSuccess) setLastSaveTime(now);
            return cloudSuccess;
        };

        const queuedSave = saveQueueRef.current.then(saveOperation, saveOperation);
        saveQueueRef.current = queuedSave.catch(error => {
            console.error('Unexpected persistence queue failure:', error);
        });
        return queuedSave;
    }, [user]);

    // Authenticated auction recovery is cloud-authoritative. Never silently restore
    // an older or unconfirmed local snapshot when cloud data is unavailable.
    const loadState = useCallback(async () => {
        if (!user?.id) return null;
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error(`Unable to verify your cloud session: ${sessionError.message}`);
        if (!sessionData?.session) throw new Error('Your cloud session is unavailable. Please sign in again and retry.');

        const { data, error } = await supabase
            .from('auction_data')
            .select('data, updated_at')
            .eq('user_id', user.id)
            .maybeSingle();
        if (error) throw new Error(`Unable to load auction data from cloud: ${error.message}`);
        if (!data?.data) return null;

        return {
            ...data.data,
            timestamp: data.data.timestamp || data.updated_at,
            source: 'supabase',
            updated_at: data.updated_at
        };
    }, [user]);
    
    // Clear authenticated cloud state only, with an audit trail.
    const clearState = useCallback(async (resetContext = {}) => {
        const resetId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : 'reset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
        const startedAt = new Date().toISOString();
        let auctionDeleteSuccess = false;
        let viewerDeleteSuccess = false;
        let auctionDeleteError = null;
        let viewerDeleteError = null;

        await logAuditEvent('auction_reset_started', 'started', {
            reset_id: resetId,
            tournament_name: resetContext.tournamentName || null,
            players_count: Number(resetContext.playersCount || 0),
            teams_count: Number(resetContext.teamsCount || 0),
            current_page: resetContext.currentPage || null,
            trigger: 'reset_confirmation'
        });

        // Delete both cloud rows separately so each outcome is observable.
        if (user?.id) {
            try {
                const { error } = await supabase
                    .from('auction_data')
                    .delete()
                    .eq('user_id', user.id);
                if (error) throw error;
                auctionDeleteSuccess = true;
            } catch (error) {
                auctionDeleteError = error.message;
                console.error('[AUCTION_AUDIT] auction_data delete failed:', error);
            }

            try {
                const { error } = await supabase
                    .from('auction_viewer_data')
                    .delete()
                    .eq('user_id', user.id);
                if (error) throw error;
                viewerDeleteSuccess = true;
            } catch (error) {
                viewerDeleteError = error.message;
                console.error('[AUCTION_AUDIT] auction_viewer_data delete failed:', error);
            }
        }

        const completedAt = new Date().toISOString();
        const overallSuccess = !!user?.id && auctionDeleteSuccess && viewerDeleteSuccess;
        const auditDetails = {
            reset_id: resetId,
            started_at: startedAt,
            completed_at: completedAt,
            duration_ms: Date.parse(completedAt) - Date.parse(startedAt),
            auction_data_deleted: auctionDeleteSuccess,
            auction_data_error: auctionDeleteError,
            auction_viewer_data_deleted: viewerDeleteSuccess,
            auction_viewer_data_error: viewerDeleteError
        };

        await logAuditEvent('auction_reset_completed', overallSuccess ? 'success' : 'partial_failure', auditDetails);

        if (auctionDeleteSuccess || viewerDeleteSuccess) {
            setLastSaveTime(null);
        }

        return overallSuccess;
    }, [user, logAuditEvent]);

    // Export backup file
    const exportBackup = useCallback((auctionData, tournamentName) => {
        const success = exportAuctionBackup(auctionData, tournamentName);
        return success;
    }, []);

    // Get info about saved state
    const getSavedInfo = useCallback(async () => {
        if (!user?.id) return null;
        const { data, error } = await supabase
            .from('auction_data')
            .select('data, tournament_name, updated_at')
            .eq('user_id', user.id)
            .maybeSingle();
        if (error) throw new Error(`Unable to retrieve saved auction information: ${error.message}`);
        if (!data?.data) return null;
        return {
            timestamp: data.updated_at,
            tournamentName: data.tournament_name,
            playersCount: data.data.players?.length || 0,
            teamsCount: Object.keys(data.data.teams || {}).length,
            hasAuctionStarted: data.data.auctionStarted || false,
            selectedCategory: data.data.selectedCategory || null,
            source: 'supabase'
        };
    }, [user]);

    // Auto-save functionality with enhanced logic
    const autoSave = useCallback(async (stateData) => {
        if (!autoBackupEnabled || !user?.id) {
            console.log('?? Auto-save skipped:', {
                autoBackupEnabled,
                hasUser: !!user?.id,
                userEmail: user?.email
            });
            return false;
        }
        
        // Throttle periodic cloud backups in memory only.
        const now = Date.now();
        const autoSaveInterval = 2 * 60 * 1000;
        if (now - lastAutoSaveAtRef.current < autoSaveInterval) return false;

        try {
            console.log('[AUCTION_SAVE] Executing cloud auto-save...');
            const success = await saveState(stateData);
            if (success) {
                lastAutoSaveAtRef.current = now;
                if (showManagedToast) {
                    showManagedToast('success', 'Auction saved to cloud.', {
                        style: TOAST_STYLES.success,
                        icon: EMOJIS.BACKUP,
                        duration: 3000,
                    });
                }
            }
            return success;
        } catch (error) {
            console.error('Auto-save failed:', error);
            return false;
        }
    }, [autoBackupEnabled, user, saveState, showManagedToast]);

    // Enhanced auto-save that only triggers after tournament is created
    const conditionalAutoSave = useCallback(async (stateData) => {
        // Only auto-save if:
        // 1. User is authenticated
        // 2. Tournament has been created/selected
        // 3. Auto-backup is enabled
        if (!user?.id || !stateData.isTournamentNameSet || !autoBackupEnabled) {
            console.log('?? Conditional auto-save skipped:', {
                hasUser: !!user?.id,
                tournamentSet: stateData.isTournamentNameSet,
                autoBackupEnabled
            });
            return false;
        }

        return await autoSave(stateData);
    }, [user, autoBackupEnabled, autoSave]);

    return {
        saveState,
        loadState,
        clearState,
        logAuditEvent,
        exportBackup,
        getSavedInfo,
        autoSave: conditionalAutoSave,
        lastSaveTime,
        autoBackupEnabled,
        setAutoBackupEnabled
    };
};