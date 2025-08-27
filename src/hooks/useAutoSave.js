import { useEffect, useRef } from 'react';

export const useAutoSave = (
    players,
    teams,
    tournamentName,
    isTournamentNameSet,
    whatsappSettings,
    auction,
    persistence,
    user = null,
    categoryConfigs = {} // Add categoryConfigs parameter
) => {
    // Auto-save interval ref
    const autoSaveIntervalRef = useRef(null);

    // Auto-save functionality - save state every 2-3 minutes after tournament is created
    useEffect(() => {
        const startAutoSave = () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
            
            // Only start auto-save if user is authenticated and tournament is set
            if (!user?.id || !isTournamentNameSet) {
                console.log('?? Auto-save not started: waiting for authentication and tournament setup');
                return;
            }
            
            console.log('?? Starting auto-save for authenticated user:', user.email);
            
            autoSaveIntervalRef.current = setInterval(async () => {
                // Only auto-save if there's meaningful progress
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
                        categoryConfigs, // Include category configurations
                        auctionStarted: auction.auctionStarted,
                        selectedCategory: auction.selectedCategory,
                        completedCategories: Array.from(auction.completedCategories || [])
                    };
                    
                    try {
                        await persistence.autoSave(currentState);
                        console.log('? Auto-save completed successfully');
                    } catch (error) {
                        console.error('? Auto-save failed:', error);
                    }
                } else {
                    console.log('?? Skipping auto-save: no meaningful progress to save');
                }
            }, 2 * 60 * 1000); // Every 2 minutes
        };

        startAutoSave();

        // Cleanup interval on component unmount or dependency change
        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
                console.log('?? Auto-save interval cleared');
            }
        };
    }, [
        // Only restart auto-save when these essential conditions change
        user?.id,                    // User authentication changes
        isTournamentNameSet,         // Tournament setup changes
        // Remove frequently changing dependencies to prevent restart loops
    ]);

    // Save on page unload/close
    useEffect(() => {
        const handleBeforeUnload = async (e) => {
            // Only save if user is authenticated and there's meaningful progress
            const hasProgress = user?.id && isTournamentNameSet && 
                (players.length > 0 || Object.keys(teams).length > 0) &&
                (auction.auctionStarted || players.some(p => p.sold || p.soldTo === "Unsold"));
                
            if (hasProgress) {
                const currentState = {
                    players,
                    teams,
                    tournamentName,
                    isTournamentNameSet,
                    whatsappSettings,
                    categoryConfigs, // Include category configurations
                    auctionStarted: auction.auctionStarted,
                    selectedCategory: auction.selectedCategory,
                    completedCategories: Array.from(auction.completedCategories || [])
                };
                
                try {
                    // Force save without toast notification (browser closing)
                    await persistence.saveState(currentState);
                    console.log('?? Final save completed before page unload');
                } catch (error) {
                    console.error('? Failed to save on page unload:', error);
                }
                
                // Show browser confirmation dialog
                e.preventDefault();
                e.returnValue = 'Your auction progress will be auto-saved to the cloud. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [
        players, 
        teams, 
        tournamentName, 
        isTournamentNameSet, 
        whatsappSettings, 
        categoryConfigs, // Add categoryConfigs to dependencies
        auction.auctionStarted, 
        auction.selectedCategory, 
        auction.completedCategories, 
        persistence, 
        user?.id
    ]);

    return {
        // This hook only handles auto-save, no return values needed
    };
};