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
    categoryConfigs = {}, // Removed boosterData parameter
    boosterPointsPerBooster = 10, // Tournament-wide points-per-booster value
    sponsorName = "",
    tickerDetails = ""
) => {
    // Keep the interval stable while always reading the latest React state.
    const autoSaveIntervalRef = useRef(null);
    const latestStateRef = useRef(null);
    latestStateRef.current = { players, teams, tournamentName, sponsorName, tickerDetails, isTournamentNameSet, whatsappSettings, auction, categoryConfigs, boosterPointsPerBooster };

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
                const latest = latestStateRef.current;
                const hasProgress = latest.isTournamentNameSet &&
                    (latest.players.length > 0 || Object.keys(latest.teams).length > 0) &&
                    (latest.auction.auctionStarted || latest.players.some(p => p.sold || p.soldTo === "Unsold"));

                if (hasProgress) {
                    const currentState = {
                        players: latest.players,
                        teams: latest.teams,
                        tournamentName: latest.tournamentName,
                        sponsorName: latest.sponsorName,
                        tickerDetails: latest.tickerDetails,
                        isTournamentNameSet: latest.isTournamentNameSet,
                        whatsappSettings: latest.whatsappSettings,
                        categoryConfigs: latest.categoryConfigs,
                        boosterPointsPerBooster: latest.boosterPointsPerBooster,
                        auctionStarted: latest.auction.auctionStarted,
                        selectedCategory: latest.auction.selectedCategory,
                        completedCategories: Array.from(latest.auction.completedCategories || []),
                        currentPlayerName: latest.auction.currentPlayer?.name || null
                    };
                    
                    try {
                        const saved = await persistence.autoSave(currentState);
                        if (saved) {
                            console.log('✓ Auto-save confirmed by cloud');
                        } else {
                            console.warn('⚠ Auto-save not confirmed by cloud; previous confirmed state remains intact');
                        }
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
                    sponsorName,
                    tickerDetails,
                    isTournamentNameSet,
                    whatsappSettings,
                    categoryConfigs, // Include category configurations
                    boosterPointsPerBooster,
                    auctionStarted: auction.auctionStarted,
                    selectedCategory: auction.selectedCategory,
                    completedCategories: Array.from(auction.completedCategories || []),
                    currentPlayerName: auction.currentPlayer?.name || null
                };

                try {
                    // Force save without toast notification (browser closing)
                    const saved = await persistence.saveState(currentState);
                    if (saved) console.log('✓ Final cloud save confirmed before page unload');
                    else console.warn('⚠ Final cloud save was not confirmed before page unload');
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
        sponsorName,
        tickerDetails,
        isTournamentNameSet, 
        whatsappSettings, 
        categoryConfigs, // Add categoryConfigs to dependencies
        boosterPointsPerBooster,
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