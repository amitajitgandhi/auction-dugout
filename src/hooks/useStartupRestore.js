import { useState, useEffect } from 'react';
import { TOAST_STYLES, EMOJIS } from '../utils/constants';

export const useStartupRestore = (persistence, showManagedToast) => {
    const [showStartupRestore, setShowStartupRestore] = useState(false);
    const [startupRestoreData, setStartupRestoreData] = useState(null);
    const [hasCheckedStartupRestore, setHasCheckedStartupRestore] = useState(false);

    // Load saved state on app start - only run once
    useEffect(() => {
        // Only check for startup restore once per session
        if (!hasCheckedStartupRestore) {
            const savedState = persistence.loadState();
            if (savedState) {
                setStartupRestoreData(savedState);
                setShowStartupRestore(true);
            }
            setHasCheckedStartupRestore(true);
        }
    }, []); // Empty dependency array to only run once on mount

    // Handle startup restore confirmation
    const handleStartupRestoreConfirm = (setPlayers, setTeams, setTournamentName, setIsTournamentNameSet, setWhatsappSettings, whatsappSettings) => {
        if (startupRestoreData) {
            // Restore state
            setPlayers(startupRestoreData.players || []);
            setTeams(startupRestoreData.teams || {});
            setTournamentName(startupRestoreData.tournamentName || '');
            setIsTournamentNameSet(startupRestoreData.isTournamentNameSet || false);
            setWhatsappSettings(startupRestoreData.whatsappSettings || whatsappSettings);
            
            showManagedToast('success', 'Auction data restored successfully!', {
                style: TOAST_STYLES.success,
                icon: EMOJIS.CHECK_MARK,
                duration: 4000,
            });
        }
        setShowStartupRestore(false);
        setStartupRestoreData(null);
        // Ensure we don't show the dialog again in this session
        setHasCheckedStartupRestore(true);
    };

    // Handle startup restore cancellation
    const handleStartupRestoreCancel = () => {
        // Clear saved state if user doesn't want to restore
        persistence.clearState();
        setShowStartupRestore(false);
        setStartupRestoreData(null);
        // Ensure we don't show the dialog again in this session
        setHasCheckedStartupRestore(true);
    };

    return {
        showStartupRestore,
        startupRestoreData,
        handleStartupRestoreConfirm,
        handleStartupRestoreCancel
    };
};