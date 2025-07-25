import { useRef, useEffect } from 'react';

export const useAuctionBusinessLogic = (
    players, 
    setPlayers, 
    teams, 
    setTeams, 
    auction, 
    showFancyError, 
    sendWhatsAppNotification, 
    tournamentName,
    auctionInterfaceRef,
    persistence = null,
    authUser = null,
    isTournamentNameSet = false,
    whatsappSettings = {}
) => {
    // Helper function to trigger immediate save after auction actions
    const triggerAuctionSave = async (actionType, playerName, teamName = null, price = null) => {
        if (!persistence || !authUser?.id || !isTournamentNameSet) {
            console.log('?? Skipping auction save - conditions not met:', {
                hasPersistence: !!persistence,
                hasUser: !!authUser?.id,
                tournamentSet: isTournamentNameSet
            });
            return;
        }

        try {
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

            console.log(`?? Triggering immediate save after ${actionType}:`, {
                player: playerName,
                team: teamName,
                price: price
            });

            const success = await persistence.saveState(currentState);
            
            if (success) {
                console.log(`? Auction progress saved after ${actionType}`);
            } else {
                console.error(`? Failed to save auction progress after ${actionType}`);
            }
        } catch (error) {
            console.error(`? Error saving auction progress after ${actionType}:`, error);
        }
    };

    // Sell player logic - Modified to return success/failure status and send WhatsApp notification
    const sellPlayer = async (teamName, price) => {
        if (!auction.currentPlayer) return false;
        if (!teamName || isNaN(price) || price <= 0) {
            showFancyError("Please enter a valid team name and bid amount.");
            return false;
        }
        const team = teams[teamName];
        if (!team) {
            showFancyError("Team not found.");
            return false;
        }
        if (price > team.purse) {
            showFancyError("Bid exceeds team's purse.");
            return false;
        }
        if (team.playersToBuy <= 0) {
            showFancyError("This team cannot buy more players. Player limit reached. Please select a different team.");
            return false;
        }
        
        const playerName = auction.currentPlayer.name;
        
        const updated = players.map((p) =>
            p.id === auction.currentPlayer.id
                ? { ...p, sold: true, soldTo: teamName, soldPrice: price }
                : p
        );
        setPlayers(updated);
        
        setTeams(teams => {
            const team = teams[teamName];
            if (!team) return teams;
            const newPurse = team.purse - price;
            // Prevent duplicate players in team
            const alreadyInTeam = team.players.some(p => p.id === auction.currentPlayer.id);
            return {
                ...teams,
                [teamName]: {
                    ...team,
                    purse: newPurse,
                    playersToBuy: team.playersToBuy - 1,
                    players: alreadyInTeam
                        ? team.players
                        : [...team.players, { ...auction.currentPlayer, soldPrice: price }],
                },
            };
        });
        
        auction.setTeamNameInput("");
        auction.setBidAmountInput("");
        auction.setShowConfetti(true);
        setTimeout(() => auction.setShowConfetti(false), 4000);
        
        // Add toast notification for sale announcement
        showManagedToast('success', 
            `${currentPlayer.name} sold to ${teamName} for ?${price.toLocaleString()}!`, {
            style: {
                border: '2px solid #10b981',
                padding: '16px',
                color: '#047857',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                background: 'linear-gradient(90deg, #d1fae5 0%, #ecfdf5 100%)',
                boxShadow: '0 4px 24px 0 #10b981',
            },
            icon: EMOJIS.PARTY,
            duration: 4000,
        });
        
        // Send WhatsApp notification for sold player
        sendWhatsAppNotification(auction.currentPlayer, teamName, price, tournamentName, false);
        
        // Trigger immediate save after successful sale
        setTimeout(async () => {
            await triggerAuctionSave('SOLD', playerName, teamName, price);
        }, 100); // Small delay to ensure state updates are reflected
        
        return true; // Sale successful
    };

    // Mark as Sold - Modified to only process player if sale is successful and trigger animation
    const handleMarkSold = async (teamName, price) => {
        if (!auction.currentPlayer) return;
        
        // Attempt to sell the player
        const saleSuccessful = await sellPlayer(teamName, price);
        
        // Only proceed with processing if the sale was successful
        if (saleSuccessful) {
            // Trigger SOLD stamp animation after successful validation
            if (auctionInterfaceRef.current) {
                auctionInterfaceRef.current.triggerSoldStamp();
            }
            
            auction.setSoldQueue(q => new Set(q).add(auction.currentPlayer.id));
            if (auction.isUnsoldRound) {
                auction.setUnsoldQueue(q => {
                    const newSet = new Set(q);
                    newSet.delete(auction.currentPlayer.id);
                    return newSet;
                });
            }
            // Mark player as ready for next - but don't auto-load next player
            auction.setPlayerProcessed(true);
            auction.setCurrentQueuePointer(ptr => ptr + 1);
            
            // Check if category is complete after selling this player
            setTimeout(() => {
                // Only check completion if we're not in an unsold round, or if we are,
                // make sure to account for remaining players in the unsold queue
                if (auction.checkCategoryCompletion()) {
                    console.log("Category completed! Finishing category...");
                    auction.finishCategory();
                }
            }, 200); // Increased delay to ensure state updates are processed
        }
        // If sale failed, do nothing - no animation, player remains in auction
    };

    // Mark as Unsold - Modified to trigger animation after processing and send WhatsApp notification
    const handleMarkUnsold = async () => {
        if (!auction.currentPlayer) return;
        
        const playerName = auction.currentPlayer.name;
        
        // Trigger UNSOLD stamp animation
        if (auctionInterfaceRef.current) {
            auctionInterfaceRef.current.triggerUnsoldStamp();
        }
        
        setPlayers(prevPlayers => {
            const updated = prevPlayers.map((p) =>
                p.id === auction.currentPlayer.id
                    ? { ...p, sold: false, soldTo: "Unsold", soldPrice: 0 }
                    : p
            );
            return updated;
        });
        auction.markUnsoldPlayerWithoutNext();
        // Do NOT show confetti for unsold - the sad animation is handled in AuctionInterface
        
        // Send WhatsApp notification for unsold player
        sendWhatsAppNotification(auction.currentPlayer, '', 0, tournamentName, true);
        
        // Trigger immediate save after marking as unsold
        setTimeout(async () => {
            await triggerAuctionSave('UNSOLD', playerName);
        }, 100); // Small delay to ensure state updates are reflected
        
        // Check if category is complete after marking this player as unsold
        setTimeout(() => {
            // Only check completion if we're not in an unsold round, or if we are,
            // make sure to account for remaining players in the unsold queue
            if (auction.checkCategoryCompletion()) {
                console.log("Category completed! Finishing category...");
                auction.finishCategory();
            }
        }, 200); // Increased delay to ensure state updates are processed
    };

    return {
        sellPlayer,
        handleMarkSold,
        handleMarkUnsold
    };
};