import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
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

    // Get localStorage key based on user email
    const getLocalStorageKey = useCallback((userEmail) => {
        return userEmail ? `auction_${userEmail}` : 'cricketAuction_state';
    }, []);

    // Save auction state to both localStorage and Supabase
    const saveState = useCallback(async (stateData) => {
        let localSuccess = false;
        let supabaseSuccess = false;

        console.log('?? Starting save operation for user:', user?.email);

        // Always save to localStorage first (immediate feedback)
        if (user?.email) {
            try {
                const dataToSave = {
                    ...stateData,
                    timestamp: new Date().toISOString(),
                    version: '1.0'
                };
                localStorage.setItem(getLocalStorageKey(user.email), JSON.stringify(dataToSave));
                localSuccess = true;
                console.log('?? Auction state saved to localStorage');
            } catch (error) {
                console.error('? Failed to save to localStorage:', error);
            }
        } else {
            // Fallback to old method if no user
            localSuccess = saveAuctionState(stateData);
        }

        // Save to Supabase if user is authenticated
        if (user?.id && user?.email) {
            try {
                console.log('?? Attempting to save to Supabase...', {
                    userId: user.id,
                    userEmail: user.email,
                    tournamentName: stateData.tournamentName || 'Untitled Tournament',
                    hasPlayers: (stateData.players?.length || 0) > 0,
                    hasTeams: Object.keys(stateData.teams || {}).length > 0
                });

                const payloadToSave = {
                    user_id: user.id,
                    user_email: user.email,
                    tournament_name: stateData.tournamentName || 'Untitled Tournament',
                    data: stateData,
                    updated_at: new Date().toISOString()
                };

                const { data, error } = await supabase
                    .from('auction_data')
                    .upsert(payloadToSave, {
                        onConflict: 'user_id'
                    })
                    .select();

                if (error) {
                    console.error('? Failed to save to Supabase:', error);
                    console.error('? Error details:', {
                        message: error.message,
                        details: error.details,
                        hint: error.hint,
                        code: error.code
                    });
                } else {
                    supabaseSuccess = true;
                    console.log('?? Auction state saved to Supabase successfully:', data);
                }
            } catch (error) {
                console.error('? Supabase save error (exception):', error);
            }
        } else {
            console.log('?? Skipping Supabase save - user not properly authenticated:', {
                hasUserId: !!user?.id,
                hasUserEmail: !!user?.email
            });
        }

        if (localSuccess || supabaseSuccess) {
            setLastSaveTime(new Date().toISOString());
        }

        return localSuccess || supabaseSuccess;
    }, [user, getLocalStorageKey]);

    // Load auction state from Supabase first, then localStorage as fallback
    const loadState = useCallback(async () => {
        // Try Supabase first if user is authenticated
        if (user?.id) {
            try {
                console.log('?? Attempting to load from Supabase for user:', user.id);
                
                const { data, error } = await supabase
                    .from('auction_data')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();

                if (error) {
                    console.log('?? Supabase load error:', error.message);
                } else if (data?.data) {
                    console.log('?? Auction state loaded from Supabase', {
                        timestamp: data.updated_at,
                        playersCount: data.data.players?.length || 0,
                        teamsCount: Object.keys(data.data.teams || {}).length
                    });
                    return {
                        ...data.data,
                        source: 'supabase',
                        updated_at: data.updated_at
                    };
                }
            } catch (error) {
                console.log('?? No Supabase data found, falling back to localStorage:', error.message);
            }
        }

        // Fallback to localStorage
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

    // Clear saved state from both localStorage and Supabase
    const clearState = useCallback(async () => {
        let localSuccess = false;
        let supabaseSuccess = false;

        // Clear localStorage
        if (user?.email) {
            try {
                localStorage.removeItem(getLocalStorageKey(user.email));
                localSuccess = true;
                console.log('??? Cleared localStorage data');
            } catch (error) {
                console.error('? Failed to clear localStorage:', error);
            }
        } else {
            localSuccess = clearSavedState();
        }

        // Clear Supabase data
        if (user?.id) {
            try {
                const { error } = await supabase
                    .from('auction_data')
                    .delete()
                    .eq('user_id', user.id);

                if (!error) {
                    supabaseSuccess = true;
                    console.log('?? Cleared Supabase data');
                } else {
                    console.error('? Failed to clear Supabase data:', error);
                }
            } catch (error) {
                console.error('? Failed to clear Supabase data:', error);
            }
        }

        if (localSuccess || supabaseSuccess) {
            setLastSaveTime(null);
        }

        return localSuccess || supabaseSuccess;
    }, [user, getLocalStorageKey]);

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
                    showManagedToast('success', '?? Auto-saved to cloud & local storage', {
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
        exportBackup,
        getSavedInfo,
        autoSave: conditionalAutoSave,
        lastSaveTime,
        autoBackupEnabled,
        setAutoBackupEnabled
    };
};