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
    auctionInterfaceRef
) => {
    // Sell player logic - Modified to return success/failure status and send WhatsApp notification
    const sellPlayer = (teamName, price) => {
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
        
        // Send WhatsApp notification for sold player
        sendWhatsAppNotification(auction.currentPlayer, teamName, price, tournamentName, false);
        
        return true; // Sale successful
    };

    // Mark as Sold - Modified to only process player if sale is successful and trigger animation
    const handleMarkSold = (teamName, price) => {
        if (!auction.currentPlayer) return;
        
        // Attempt to sell the player
        const saleSuccessful = sellPlayer(teamName, price);
        
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
    const handleMarkUnsold = () => {
        if (!auction.currentPlayer) return;
        
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