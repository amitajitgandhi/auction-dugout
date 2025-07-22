import { useState, useEffect, useCallback } from 'react';
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

export const usePersistence = (showManagedToast) => {
    const [lastSaveTime, setLastSaveTime] = useState(null);
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

    // Save auction state to localStorage
    const saveState = useCallback((stateData) => {
        const success = saveAuctionState(stateData);
        if (success) {
            setLastSaveTime(new Date().toISOString());
        }
        return success;
    }, []);

    // Load auction state from localStorage
    const loadState = useCallback(() => {
        return loadAuctionState();
    }, []);

    // Clear saved state
    const clearState = useCallback(() => {
        const success = clearSavedState();
        if (success) {
            setLastSaveTime(null);
        }
        return success;
    }, []);

    // Export backup file
    const exportBackup = useCallback((auctionData, tournamentName) => {
        const success = exportAuctionBackup(auctionData, tournamentName);
        // Note: Toast message is handled by the calling component (App.js) for better control over the message content
        return success;
    }, []);

    // Get info about saved state
    const getSavedInfo = useCallback(() => {
        return getSavedStateInfo();
    }, []);

    // Auto-save functionality
    const autoSave = useCallback((stateData) => {
        if (!autoBackupEnabled) return false;
        
        if (shouldAutoBackup()) {
            const success = saveState(stateData);
            if (success && showManagedToast) {
                showManagedToast('success', 'Auto backup saved!', {
                    style: TOAST_STYLES.success,
                    icon: EMOJIS.BACKUP,
                    duration: 3000,
                });
            }
            return success;
        }
        return false;
    }, [autoBackupEnabled, saveState, showManagedToast]);

    return {
        saveState,
        loadState,
        clearState,
        exportBackup,
        getSavedInfo,
        autoSave,
        lastSaveTime,
        autoBackupEnabled,
        setAutoBackupEnabled
    };
};