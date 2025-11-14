import { useState, useCallback } from 'react';
import { 
    processPlayerPurchase, 
    processPlayerTransfer, 
    getTeamInfo, 
    updateTeamInitialPurse // ✅ UPDATED: Import the new function for initial purse updates
} from '../utils/centralizedTeamData';
import { EMOJIS } from '../utils/constants';

export const useAuctionBusinessLogic = (
    players, 
    setPlayers, 
    teams, 
    setTeams, 
    auction, 
    showFancyError, 
    showManagedToast,
    sendWhatsAppNotification, 
    tournamentName,
    auctionInterfaceRef,
    persistence = null,
    authUser = null,
    isTournamentNameSet = false,
    whatsappSettings = {},
    categoryConfigs = {}
) => {
    const [isSaving, setIsSaving] = useState(false);

    // ✅ CENTRALIZED: Function to save auction progress with enhanced error handling
    const triggerAuctionSaveWithState = async (action, description, teamName, bidAmount, updatedPlayers = null, updatedTeams = null) => {
        if (!authUser?.id || !isTournamentNameSet || isSaving) {
            return;
        }

        try {
            setIsSaving(true);
            
            const currentState = {
                players: updatedPlayers || players,
                teams: updatedTeams || teams,
                tournamentName,
                isTournamentNameSet,
                whatsappSettings,
                categoryConfigs,
                auctionStarted: auction.auctionStarted,
                selectedCategory: auction.selectedCategory,
                completedCategories: Array.from(auction.completedCategories || [])
            };
            
            await persistence.saveState(currentState);
            console.log(`🔄 ${action} - Progress saved:`, description);
            
        } catch (error) {
            console.error('❌ Failed to save progress:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // ✅ CENTRALIZED: Function to handle player sales using centralized team data management
    const sellPlayer = useCallback(async (playerName, teamName, bidAmount) => {
        const playerObj = players.find(p => p.name === playerName);
        if (!playerObj) {
            return { success: false, message: `Player ${playerName} not found.` };
        }
        const updatedTeams = processPlayerPurchase(teams, teamName, playerObj, bidAmount);
        if (!updatedTeams) {
            return { 
                success: false,
                message: "Failed to process purchase. Please check team budget and player limits."
            };
        }

        // ✅ FIXED: Update players state to mark as sold with sold: true property
        const updatedPlayers = players.map(player =>
            player.name === playerName 
                ? { ...player, soldTo: teamName, soldPrice: bidAmount, sold: true }
                : player
        );

        setPlayers(updatedPlayers);
        setTeams(updatedTeams);
        
        // Trigger autosave after successful sale
        await triggerAuctionSaveWithState('PLAYER_SOLD', `${playerName} sold to ${teamName}`, teamName, bidAmount, updatedPlayers, updatedTeams);

        return { 
            success: true, 
            message: `${playerName} successfully sold to ${teamName} for ${bidAmount.toLocaleString()}!`,
            updatedTeams,
            updatedPlayers
        };
    }, [players, teams, setPlayers, setTeams, triggerAuctionSaveWithState]);

    // ✅ CENTRALIZED: Enhanced handleMarkSold with better error handling
    const handleMarkSold = async () => {
        if (!auction.currentPlayer) {
            showFancyError("No current player selected for auction.");
            return;
        }

        if (!auction.teamNameInput?.trim()) {
            showFancyError("Please enter the team name that bought the player.");
            return;
        }

        if (!auction.bidAmountInput || auction.bidAmountInput <= 0) {
            showFancyError("Please enter a valid bid amount.");
            return;
        }

        const bidAmount = parseInt(auction.bidAmountInput);
        const teamName = auction.teamNameInput.trim();

        // Check if team exists
        if (!teams[teamName]) {
            showFancyError(`Team "${teamName}" does not exist. Please check the team name and try again.`);
            return;
        }

        // Validate purchase using centralized logic
        const teamInfo = getTeamInfo(teams[teamName], teamName);
        if (bidAmount > teamInfo.currentPurse) {
            showFancyError(`${teamName} has insufficient funds. Available: ${teamInfo.currentPurse.toLocaleString()}, Required: ${bidAmount.toLocaleString()}`);
            return;
        }

        if (teamInfo.playersLeft <= 0) {
            showFancyError(`${teamName} has reached the maximum player limit.`);
            return;
        }

        // Process the sale
        const saleResult = await sellPlayer(auction.currentPlayer.name, teamName, bidAmount);
        
        if (saleResult.success) {
            showManagedToast('success', saleResult.message, {
                style: {
                    border: '2px solid #10b981',
                    padding: '16px',
                    color: '#065f46',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
                    boxShadow: '0 4px 24px 0 #10b981',
                },
                icon: '🏏',
                duration: 4000,
            });

            // Send WhatsApp notification if configured
            if (whatsappSettings.enabled && whatsappSettings.sendPlayerUpdates) {
                sendWhatsAppNotification(
                    `🏏 PLAYER SOLD!\n\n` +
                    `Player: ${auction.currentPlayer.name}\n` +
                    `Team: ${teamName}\n` +
                    `Price: ₹${bidAmount.toLocaleString()}\n` +
                    `Category: ${auction.selectedCategory}\n\n` +
                    `Tournament: ${tournamentName}`
                );
            }

            // ✅ FIXED: Mark player as processed and add to sold queue, let UI show "Next Player" button
            auction.setSoldQueue(prev => new Set(prev).add(auction.currentPlayer.id));
            auction.setPlayerProcessed(true);
            
            // Clear inputs
            auction.setBidAmountInput('');
            auction.setTeamNameInput('');

            // Advance pointer and pick next player or finish
            auction.setCurrentQueuePointer(ptr => ptr + 1);
            const next = auction.isLastPlayerInQueue;
            if (next) {
                auction.finishCategory();
            }
        } else {
            showFancyError(saleResult.message);
        }
    };

    // ✅ CENTRALIZED: Enhanced handleMarkUnsold
    const handleMarkUnsold = async () => {
        if (!auction.currentPlayer) {
            showFancyError("No current player selected for auction.");
            return;
        }

        // Mark player as unsold with wasUnsold flag retained for later display
        const updatedPlayers = players.map(player =>
            player.name === auction.currentPlayer.name 
                ? { ...player, soldTo: 'Unsold', soldPrice: 0, sold: false, wasUnsold: true }
                : player
        );

        setPlayers(updatedPlayers);
        await triggerAuctionSaveWithState('PLAYER_UNSOLD', `${auction.currentPlayer.name} marked as unsold`, 'Unsold', 0, updatedPlayers);
        showManagedToast('info', `${auction.currentPlayer.name} marked as unsold.`, {
            style: {
                border: '2px solid #f59e42',
                padding: '16px',
                color: '#92400e',
                fontWeight: 'bold',
                fontSize: '1rem',
                background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
                boxShadow: '0 4px 24px 0 #fbbf24',
            },
            icon: '⏸️',
            duration: 3000,
        });
        auction.markUnsoldPlayerWithoutNext();
        auction.setBidAmountInput('');
        auction.setTeamNameInput('');
    };

    // Sell Unsold Player later (keep wasUnsold flag)
    const sellUnsoldPlayerLater = async (playerObj, teamName, bidAmount) => {
        const updatedTeams = processPlayerPurchase(teams, teamName, playerObj, bidAmount);
        if (!updatedTeams) return { success: false, message: 'Failed to process purchase. Budget or limit issue.' };
        const updatedPlayers = players.map(p => p.id === playerObj.id ? { ...p, soldTo: teamName, soldPrice: bidAmount, sold: true, wasUnsold: p.wasUnsold || true } : p);
        setPlayers(updatedPlayers);
        setTeams(updatedTeams);
        setTimeout(async () => { await triggerAuctionSaveWithState('UNSOLD_PLAYER_SOLD', `${playerObj.name} sold later to ${teamName}`, teamName, bidAmount, updatedPlayers, updatedTeams); }, 100);
        return { success: true };
    };

    // ✅ UPDATED: Use new updateTeamInitialPurse function for Edit Balance
    const handleUpdateTeamPurse = (teamName, newPurse) => {
        const updatedTeams = updateTeamInitialPurse(teams, teamName, newPurse);
        
        if (updatedTeams === teams) {
            showFancyError("Failed to update team purse. Please check the values and try again.");
            return false;
        }

        setTeams(updatedTeams);
        
        // Save the updated state
        setTimeout(async () => {
            await triggerAuctionSaveWithState('PURSE_UPDATE', `Team ${teamName} purse updated`, teamName, newPurse, null, updatedTeams);
        }, 100);

        return true;
    };

    // ✅ CENTRALIZED: Function to handle player transfers using centralized management
    const handlePlayerTransfer = (player, fromTeam, toTeam, newPrice) => {
        const updatedTeams = processPlayerTransfer(teams, player, fromTeam, toTeam, newPrice);
        
        if (!updatedTeams) {
            showFancyError("Failed to transfer player. Please check team budgets and try again.");
            return false;
        }

        // ✅ FIXED: Update players state with sold: true for transfers
        const updatedPlayers = players.map(p => 
            (p.id === player.id || p.name === player.name) 
                ? { ...p, soldTo: toTeam, soldPrice: newPrice, sold: true }
                : p
        );

        setPlayers(updatedPlayers);
        setTeams(updatedTeams);
        
        // Save the updated state
        setTimeout(async () => {
            await triggerAuctionSaveWithState('PLAYER_TRANSFER', `${player.name} transferred from ${fromTeam} to ${toTeam}`, toTeam, newPrice, updatedPlayers, updatedTeams);
        }, 100);

        return true;
    };

    // ✅ CENTRALIZED: Get team budget info using centralized calculations
    const getTeamBudgetInfo = (teamName) => {
        const team = teams[teamName];
        if (!team) return null;
        
        return getTeamInfo(team, teamName);
    };

    return {
        sellPlayer,
        handleMarkSold,
        handleMarkUnsold,
        sellUnsoldPlayerLater, // new function
        handleUpdateTeamPurse,      // ✅ UPDATED: Now uses updateTeamInitialPurse for Edit Balance
        handlePlayerTransfer,       // ✅ CENTRALIZED: Player transfers
        getTeamBudgetInfo          // ✅ CENTRALIZED: Team budget calculations
    };
};