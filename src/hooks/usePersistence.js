import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { buildViewerPayload } from '../utils/viewerPayload';
import {
    saveAuctionState,
    loadAuctionState,
    clearSavedState,
    shouldAutoBackup,
    exportAuctionBackup,
    getSavedStateInfo,
    TOAST_STYLES,
    EMOJIS
} from '../utils/constants';

export const usePersistence = (showManagedToast, user = null) => {
    const [lastSaveTime, setLastSaveTime] = useState(null);
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
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

    // Get localStorage key based on user email
    const getLocalStorageKey = useCallback((userEmail) => {
        return userEmail ? `auction_${userEmail}` : 'cricketAuction_state';
    }, []);

    // A successful authenticated save means Supabase has acknowledged the write.
    // Only then update the local confirmed snapshot. Failed writes never replace it.
    const saveState = useCallback((stateData) => {
        const saveOperation = async () => {
            const now = new Date().toISOString();
            const dataToSave = { ...stateData, timestamp: now, revision: ++revisionRef.current, version: '3.0' };
            let cloudSuccess = false;

            if (user?.id && user?.email) {
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
            } else if (user?.id) {
                // Authenticated transactions may never be treated as saved without cloud confirmation.
                return false;
            }

            // Keep localStorage as a backup of the last confirmed state, not a queue
            // of uncommitted transactions. Never replace it when the cloud write fails.
            let localSuccess = false;
            if (user?.email) {
                try {
                    const key = getLocalStorageKey(user.email);
                    const previous = localStorage.getItem(key);
                    if (previous) localStorage.setItem(`${key}__backup`, previous);
                    localStorage.setItem(key, JSON.stringify(dataToSave));
                    localSuccess = true;
                } catch (error) {
                    console.error('Cloud save succeeded, but local backup failed:', error);
                }
            } else {
                localSuccess = saveAuctionState(dataToSave);
            }

            if (cloudSuccess || localSuccess) setLastSaveTime(now);
            return user?.id ? cloudSuccess : localSuccess;
        };

        const queuedSave = saveQueueRef.current.then(saveOperation, saveOperation);
        saveQueueRef.current = queuedSave.catch(error => {
            console.error('Unexpected persistence queue failure:', error);
        });
        return queuedSave;
    }, [user, getLocalStorageKey]);

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
    
    // Helper function to load from localStorage
    const loadFromLocalStorage = useCallback(async () => {
        if (user?.email) {
            try {
                const savedData = localStorage.getItem(getLocalStorageKey(user.email));
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    console.log('?? Auction state loaded from localStorage', {
                        timestamp: parsedData.timestamp,
                        playersCount: parsedData.players?.length || 0,
                        teamsCount: Object.keys(parsedData.teams || {}).length
                    });
                    return {
                        ...parsedData,
                        source: 'localStorage'
                    };
                }
            } catch (error) {
                console.error('? Failed to load from localStorage:', error);
            }
        }

        // Final fallback to old method
        const fallbackData = loadAuctionState();
        return fallbackData ? { ...fallbackData, source: 'fallback' } : null;
    }, [user, getLocalStorageKey]);

    // Clear saved state from both localStorage and Supabase, with an audit trail.
    const clearState = useCallback(async (resetContext = {}) => {
        const resetId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : 'reset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
        const startedAt = new Date().toISOString();
        let localSuccess = false;
        let auctionDeleteSuccess = false;
        let viewerDeleteSuccess = false;
        let localError = null;
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

        // Clear localStorage and record any failure.
        if (user?.email) {
            try {
                const key = getLocalStorageKey(user.email);
                localStorage.removeItem(key);
                localStorage.removeItem(`${key}__backup`);
                localSuccess = true;
            } catch (error) {
                localError = error.message;
                console.error('[AUCTION_AUDIT] Failed to clear localStorage:', error);
            }
        } else {
            try {
                localSuccess = clearSavedState();
            } catch (error) {
                localError = error.message;
            }
        }

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
        const overallSuccess = localSuccess && (!user?.id || (auctionDeleteSuccess && viewerDeleteSuccess));
        const auditDetails = {
            reset_id: resetId,
            started_at: startedAt,
            completed_at: completedAt,
            duration_ms: Date.parse(completedAt) - Date.parse(startedAt),
            local_storage_cleared: localSuccess,
            local_storage_error: localError,
            auction_data_deleted: auctionDeleteSuccess,
            auction_data_error: auctionDeleteError,
            auction_viewer_data_deleted: viewerDeleteSuccess,
            auction_viewer_data_error: viewerDeleteError
        };

        await logAuditEvent('auction_reset_completed', overallSuccess ? 'success' : 'partial_failure', auditDetails);

        if (localSuccess || auctionDeleteSuccess || viewerDeleteSuccess) {
            setLastSaveTime(null);
        }

        return overallSuccess;
    }, [user, getLocalStorageKey, logAuditEvent]);

    // Export backup file
    const exportBackup = useCallback((auctionData, tournamentName) => {
        const success = exportAuctionBackup(auctionData, tournamentName);
        return success;
    }, []);

    // Get info about saved state
    const getSavedInfo = useCallback(async () => {
        // Try Supabase first
        if (user?.id) {
            try {
                const { data, error } = await supabase
                    .from('auction_data')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();

                if (!error && data?.data) {
                    return {
                        timestamp: data.updated_at,
                        tournamentName: data.tournament_name,
                        playersCount: data.data.players?.length || 0,
                        teamsCount: Object.keys(data.data.teams || {}).length,
                        hasAuctionStarted: data.data.auctionStarted || false,
                        selectedCategory: data.data.selectedCategory || null,
                        source: 'supabase'
                    };
                }
            } catch (error) {
                console.log('No Supabase data found');
            }
        }

        // Fallback to localStorage
        if (user?.email) {
            try {
                const savedData = localStorage.getItem(getLocalStorageKey(user.email));
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    return {
                        timestamp: parsedData.timestamp,
                        tournamentName: parsedData.tournamentName,
                        playersCount: parsedData.players?.length || 0,
                        teamsCount: Object.keys(parsedData.teams || {}).length,
                        hasAuctionStarted: parsedData.auctionStarted || false,
                        selectedCategory: parsedData.selectedCategory || null,
                        source: 'localStorage'
                    };
                }
            } catch (error) {
                console.error('Failed to get localStorage info:', error);
            }
        }

        // Final fallback
        const info = getSavedStateInfo();
        return info ? { ...info, source: 'fallback' } : null;
    }, [user, getLocalStorageKey]);

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
        
        // Check if we should auto-save (every 2-3 minutes)
        const lastBackup = localStorage.getItem(`lastAutoSave_${user.email}`);
        const now = Date.now();
        const autoSaveInterval = 2 * 60 * 1000; // 2 minutes
        
        if (lastBackup && (now - parseInt(lastBackup, 10)) < autoSaveInterval) {
            console.log('?? Auto-save skipped: too soon since last save');
            return false; // Too soon for auto-save
        }

        try {
            console.log('?? Executing auto-save...');
            const success = await saveState(stateData);
            if (success) {
                localStorage.setItem(`lastAutoSave_${user.email}`, now.toString());
                if (showManagedToast) {
                    showManagedToast('success', 'Auto-saved to cloud & local storage', {
                        style: TOAST_STYLES.success,
                        icon: EMOJIS.BACKUP,
                        duration: 5000,
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