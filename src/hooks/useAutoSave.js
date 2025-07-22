import { useEffect, useRef } from 'react';

export const useAutoSave = (
    players,
    teams,
    tournamentName,
    isTournamentNameSet,
    whatsappSettings,
    auction,
    persistence
) => {
    // Auto-save interval ref
    const autoSaveIntervalRef = useRef(null);

    // Auto-save functionality - save state every 3 minutes
    useEffect(() => {
        const startAutoSave = () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
            
            autoSaveIntervalRef.current = setInterval(() => {
                // Only auto-save if there's meaningful progress (not just uploaded files)
                const hasProgress = isTournamentNameSet && 
                    (players.length > 0 || Object.keys(teams).length > 0) &&
                    (auction.auctionStarted || players.some(p => p.sold || p.soldTo === "Unsold"));
                
                if (hasProgress) {
                    const currentState = {
                        players,
                        teams,
                        tournamentName,
                        isTournamentNameSet,
                        whatsappSettings,
                        auctionStarted: auction.auctionStarted,
                        selectedCategory: auction.selectedCategory,
                        completedCategories: Array.from(auction.completedCategories || [])
                    };
                    
                    persistence.autoSave(currentState);
                }
            }, 3 * 60 * 1000); // Every 3 minutes
        };

        startAutoSave();

        // Cleanup interval on component unmount
        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
        };
    }, [players, teams, tournamentName, isTournamentNameSet, whatsappSettings, auction.auctionStarted, auction.selectedCategory, auction.completedCategories, persistence]);

    // Save on page unload/close
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            // Only prompt to save if there's meaningful progress (auction started or players sold/unsold)
            const hasProgress = isTournamentNameSet && 
                (players.length > 0 || Object.keys(teams).length > 0) &&
                (auction.auctionStarted || players.some(p => p.sold || p.soldTo === "Unsold"));
                
            if (hasProgress) {
                const currentState = {
                    players,
                    teams,
                    tournamentName,
                    isTournamentNameSet,
                    whatsappSettings,
                    auctionStarted: auction.auctionStarted,
                    selectedCategory: auction.selectedCategory,
                    completedCategories: Array.from(auction.completedCategories || [])
                };
                
                // Force save without toast notification (browser closing)
                persistence.saveState(currentState);
                
                // Show browser confirmation dialog
                e.preventDefault();
                e.returnValue = 'Your auction progress will be saved. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [players, teams, tournamentName, isTournamentNameSet, whatsappSettings, auction.auctionStarted, auction.selectedCategory, auction.completedCategories, persistence]);

    return {
        // This hook only handles auto-save, no return values needed
    };
};