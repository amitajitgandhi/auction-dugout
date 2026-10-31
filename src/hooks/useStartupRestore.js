import { useState, useEffect, useRef } from 'react';
import { TOAST_STYLES, EMOJIS } from '../utils/constants';

export const useStartupRestore = (persistence, showManagedToast, user = null) => {
    const [showStartupRestore, setShowStartupRestore] = useState(false);
    const [startupRestoreData, setStartupRestoreData] = useState(null);
    const [hasCheckedStartupRestore, setHasCheckedStartupRestore] = useState(false);

    // Load cloud state once for each authenticated account.
    useEffect(() => {
        let cancelled = false;
        const checkForStartupRestore = async () => {
            if (!hasCheckedStartupRestore && user?.id) {
                const requestedUserId = user.id;
                console.log('[STARTUP_RESTORE] Checking cloud data for account:', requestedUserId);
                try {
                    const savedState = await persistence.loadState();
                    if (cancelled || user?.id !== requestedUserId) return;
                    if (savedState && (savedState.players?.length > 0 || Object.keys(savedState.teams || {}).length > 0)) {
                        // Ensure we have valid timestamp data
                        const processedData = {
                            ...savedState,
                            timestamp: savedState.timestamp || savedState.updated_at || new Date().toISOString(),
                            tournamentName: savedState.tournamentName || 'Unknown Tournament',
                            players: savedState.players || [],
                            teams: savedState.teams || {},
                            categoryConfigs: savedState.categoryConfigs || {} // Include category configurations
                        };
                        
                        console.log('? Found saved auction data for startup restore:', {
                            players: processedData.players?.length || 0,
                            teams: Object.keys(processedData.teams || {}).length,
                            tournament: processedData.tournamentName,
                            categoryConfigs: Object.keys(processedData.categoryConfigs || {}).length,
                            source: processedData.source
                        });
                        
                        setStartupRestoreData(processedData);
                        setShowStartupRestore(true);
                    } else {
                        console.log('?? No valid saved auction data found for restore');
                    }
                } catch (error) {
                    console.error('? Error loading startup restore data:', error);
                    showManagedToast('error', 'Could not load your auction from the cloud. Please refresh and retry; saved data has not been deleted.', {
                        style: TOAST_STYLES.error,
                        icon: EMOJIS.CROSS_MARK,
                        duration: 7000,
                    });
                }
                if (!cancelled && user?.id === requestedUserId) {
                    setHasCheckedStartupRestore(true);
                }
            }
        };
        if (user?.id && !hasCheckedStartupRestore) checkForStartupRestore();
        return () => { cancelled = true; };
    }, [persistence, hasCheckedStartupRestore, user?.id]);

    const previousUserIdRef = useRef(user?.id || null);
    useEffect(() => {
        if (previousUserIdRef.current !== (user?.id || null)) {
            previousUserIdRef.current = user?.id || null;
            setHasCheckedStartupRestore(false);
            setShowStartupRestore(false);
            setStartupRestoreData(null);
        }
    }, [user?.id]);

    // Handle startup restore confirmation
    const handleStartupRestoreConfirm = async (setPlayers, setTeams, setTournamentName, setIsTournamentNameSet, setSponsorName = null, setTickerDetails = null, setWhatsappSettings, whatsappSettings, setCategoryConfigs, setBoosterPointsPerBooster = null) => {
        if (startupRestoreData) {
            try {
                // Restore state
                setPlayers(startupRestoreData.players || []);
                setTeams(startupRestoreData.teams || {});
                setTournamentName(startupRestoreData.tournamentName || '');
                setIsTournamentNameSet(startupRestoreData.isTournamentNameSet || false);
                setSponsorName?.(startupRestoreData.sponsorName || '');
                setTickerDetails?.(startupRestoreData.tickerDetails || '');
                setWhatsappSettings(startupRestoreData.whatsappSettings || whatsappSettings);
                setCategoryConfigs(startupRestoreData.categoryConfigs || {}); // Restore category configurations
                setBoosterPointsPerBooster?.(startupRestoreData.boosterPointsPerBooster ?? 10); // Restore tournament-wide points-per-booster

                console.log('? Auction data restored successfully:', {
                    players: startupRestoreData.players?.length || 0,
                    teams: Object.keys(startupRestoreData.teams || {}).length,
                    tournament: startupRestoreData.tournamentName,
                    categoryConfigs: Object.keys(startupRestoreData.categoryConfigs || {}).length
                });
                
                // Enhanced toast message to include category config info
                const categoryConfigCount = Object.keys(startupRestoreData.categoryConfigs || {}).length;
                const toastMessage = `Auction data restored! ${startupRestoreData.players?.length || 0} players, ${Object.keys(startupRestoreData.teams || {}).length} teams${categoryConfigCount > 0 ? `, ${categoryConfigCount} category configs` : ''}`;
                
                showManagedToast('success', toastMessage, {
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

    // Dismissing the restore prompt must never delete the saved cloud auction.
    const handleStartupRestoreCancel = () => {
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