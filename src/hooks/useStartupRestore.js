import { useState, useEffect } from 'react';
import { TOAST_STYLES, EMOJIS } from '../utils/constants';

export const useStartupRestore = (persistence, showManagedToast, user = null) => {
    const [showStartupRestore, setShowStartupRestore] = useState(false);
    const [startupRestoreData, setStartupRestoreData] = useState(null);
    const [hasCheckedStartupRestore, setHasCheckedStartupRestore] = useState(false);

    // Load saved state on app start - only run once after user is authenticated
    useEffect(() => {
        const checkForStartupRestore = async () => {
            // Only check for startup restore once per session and only after user is authenticated
            if (!hasCheckedStartupRestore && user?.id) {
                console.log('?? Checking for startup restore data for user:', user.email);
                
                try {
                    const savedState = await persistence.loadState();
                    if (savedState && (savedState.players?.length > 0 || Object.keys(savedState.teams || {}).length > 0)) {
                        // Ensure we have valid timestamp data
                        const processedData = {
                            ...savedState,
                            timestamp: savedState.timestamp || savedState.updated_at || new Date().toISOString(),
                            tournamentName: savedState.tournamentName || 'Unknown Tournament',
                            players: savedState.players || [],
                            teams: savedState.teams || {}
                        };
                        
                        console.log('?? Found saved auction data for startup restore:', {
                            players: processedData.players?.length || 0,
                            teams: Object.keys(processedData.teams || {}).length,
                            tournament: processedData.tournamentName,
                            source: processedData.source
                        });
                        
                        setStartupRestoreData(processedData);
                        setShowStartupRestore(true);
                    } else {
                        console.log('?? No valid saved auction data found for restore');
                    }
                } catch (error) {
                    console.error('? Error loading startup restore data:', error);
                }
                setHasCheckedStartupRestore(true);
            }
        };

        // Only trigger when user is authenticated
        if (user?.id) {
            checkForStartupRestore();
        }
    }, [persistence, hasCheckedStartupRestore, user?.id]); // Depend on user.id

    // Reset check when user changes (for logout/login scenarios)
    useEffect(() => {
        if (!user?.id && hasCheckedStartupRestore) {
            setHasCheckedStartupRestore(false);
            setShowStartupRestore(false);
            setStartupRestoreData(null);
            console.log('?? Reset startup restore check for new user session');
        }
    }, [user?.id, hasCheckedStartupRestore]);

    // Handle startup restore confirmation
    const handleStartupRestoreConfirm = async (setPlayers, setTeams, setTournamentName, setIsTournamentNameSet, setWhatsappSettings, whatsappSettings) => {
        if (startupRestoreData) {
            try {
                // Restore state
                setPlayers(startupRestoreData.players || []);
                setTeams(startupRestoreData.teams || {});
                setTournamentName(startupRestoreData.tournamentName || '');
                setIsTournamentNameSet(startupRestoreData.isTournamentNameSet || false);
                setWhatsappSettings(startupRestoreData.whatsappSettings || whatsappSettings);
                
                console.log('? Auction data restored successfully:', {
                    players: startupRestoreData.players?.length || 0,
                    teams: Object.keys(startupRestoreData.teams || {}).length,
                    tournament: startupRestoreData.tournamentName
                });
                
                showManagedToast('success', `Auction data restored! ${startupRestoreData.players?.length || 0} players, ${Object.keys(startupRestoreData.teams || {}).length} teams`, {
                    style: TOAST_STYLES.success,
                    icon: EMOJIS.CHECK_MARK,
                    duration: 4000,
                });
            } catch (error) {
                console.error('? Error during restore:', error);
                showManagedToast('error', 'Failed to restore auction data', {
                    style: TOAST_STYLES.error,
                    icon: EMOJIS.CROSS_MARK,
                    duration: 4000,
                });
            }
        }
        setShowStartupRestore(false);
        setStartupRestoreData(null);
    };

    // Handle startup restore cancellation
    const handleStartupRestoreCancel = async () => {
        try {
            // Clear saved state if user doesn't want to restore
            await persistence.clearState();
            console.log('??? Startup restore cancelled, saved data cleared');
        } catch (error) {
            console.error('? Error clearing saved state:', error);
        }
        
        setShowStartupRestore(false);
        setStartupRestoreData(null);
    };

    return {
        showStartupRestore,
        startupRestoreData,
        handleStartupRestoreConfirm,
        handleStartupRestoreCancel
    };
};