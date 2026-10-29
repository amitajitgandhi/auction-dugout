import { useState, useCallback, useRef } from 'react';
import {
    processPlayerPurchase,
    processPlayerTransfer,
    getTeamInfo,
    updateTeamInitialPurse,
    updatePlayerPriceInTeam,
    incrementTeamBooster,
    applyGlobalPointsPerBooster,
    retainPlayer,
    decrementTeamBooster
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
    categoryConfigs = {},
    boosterPointsPerBooster = 10,
    setBoosterPointsPerBooster = null
) => {
    const [isSaving, setIsSaving] = useState(false);
    // Tracks player ids currently mid-retention, so a fast double-click on
    // Submit can't race ahead of the players/teams state update and retain
    // (and double-deduct) the same player twice.
    const retainingPlayerIdsRef = useRef(new Set());
    // Prevent duplicate concurrent sale requests for the same player.
    const sellingPlayerIdsRef = useRef(new Set());

    // ✅ CENTRALIZED: Function to save auction progress with enhanced error handling
    const triggerAuctionSaveWithState = async (action, description, teamName, bidAmount, updatedPlayers = null, updatedTeams = null, overrides = {}) => {
        if (!authUser?.id || !isTournamentNameSet) {
            showManagedToast?.('error', 'Auction is locked: sign in and complete tournament setup before making changes.', { duration: 6000 });
            return false;
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
                boosterPointsPerBooster,
                auctionStarted: auction.auctionStarted,
                selectedCategory: auction.selectedCategory,
                completedCategories: Array.from(auction.completedCategories || []),
                currentPlayerName: auction.currentPlayer?.name || null,
                ...overrides
            };
            
            const saved = await persistence.saveState(currentState);
            if (!saved) {
                console.error(`❌ ${action} is saved locally but cloud confirmation is missing:`, description);
                showManagedToast?.('error', 'Transaction NOT completed. Unable to confirm the server save. Check your internet connection and retry.', { duration: 7000 });
                return false;
            } else {
                console.log(`🔄 ${action} - Progress saved to cloud:`, description);
                return true;
            }
            
        } catch (error) {
            console.error('❌ Failed to save progress:', error);
            showManagedToast?.('error', 'Transaction NOT completed. Server save failed. Check your connection and retry.', { duration: 7000 });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    // ✅ CENTRALIZED: Function to handle player sales using centralized team data management
    // IMPORTANT: Use player id when available to avoid duplicate-name bugs.
    const sellPlayer = useCallback(async (playerRef, teamName, bidAmount, selectedCategory = null) => {
        const playerObj = players.find(p =>
            (playerRef?.id !== undefined && playerRef?.id !== null)
                ? p.id === playerRef.id
                : p.name === playerRef?.name
        );
        if (!playerObj) {
            return { success: false, message: `Player not found.` };
        }
        if (playerObj.sold || (playerObj.soldTo && playerObj.soldTo !== 'Unsold')) {
            return { success: false, message: `${playerObj.name} has already been sold and cannot be sold again.` };
        }
        const playerKey = playerObj.id !== undefined && playerObj.id !== null ? String(playerObj.id) : `name:${playerObj.name}`;
        if (sellingPlayerIdsRef.current.has(playerKey)) {
            return { success: false, message: `${playerObj.name} is already being processed. Please wait.` };
        }
        sellingPlayerIdsRef.current.add(playerKey);
        const assignedCategory = selectedCategory || playerObj.category;
        if (!assignedCategory) {
            sellingPlayerIdsRef.current.delete(playerKey);
            return { success: false, message: 'Select a category before selling this player.' };
        }
        const updatedTeams = processPlayerPurchase(teams, teamName, { ...playerObj, category: assignedCategory }, bidAmount, assignedCategory, categoryConfigs);
        if (!updatedTeams) {
            sellingPlayerIdsRef.current.delete(playerKey);
            return {
                success: false,
                message: "Failed to process purchase. Please check team budget and player limits."
            };
        }

        // ✅ FIXED: Update players state to mark as sold with sold: true property
        const updatedPlayers = players.map(player =>
            (playerObj.id !== undefined && playerObj.id !== null)
                ? (player.id === playerObj.id ? { ...player, category: assignedCategory, soldTo: teamName, soldPrice: bidAmount, sold: true } : player)
                : (player.name === playerObj.name ? { ...player, category: assignedCategory, soldTo: teamName, soldPrice: bidAmount, sold: true } : player)
        );

        // Commit UI state only after Supabase confirms the proposed transaction.
        const saved = await triggerAuctionSaveWithState('PLAYER_SOLD', `${playerObj.name} sold to ${teamName}`, teamName, bidAmount, updatedPlayers, updatedTeams);
        if (!saved) {
            sellingPlayerIdsRef.current.delete(playerKey);
            return { success: false, message: 'Sale not completed because the server could not confirm the save. Please retry when connected.' };
        }
        setPlayers(updatedPlayers);
        setTeams(updatedTeams);
        sellingPlayerIdsRef.current.delete(playerKey);

        return { 
            success: true, 
            message: `${playerObj.name} successfully sold to ${teamName} for ${bidAmount.toLocaleString()}!`,
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

        // Process the sale (use id to avoid duplicate-name bugs)
        const saleResult = await sellPlayer(auction.currentPlayer, teamName, bidAmount);
        
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

            // ✅ FIX: Use autoSend flag and correct signature for WhatsApp notification
            if (whatsappSettings.enabled) {
                // sendWhatsAppNotification expects (player, teamName, price, tournamentName, isUnsold=false)
                try {
                    await sendWhatsAppNotification(
                        auction.currentPlayer,
                        teamName,
                        bidAmount,
                        tournamentName,
                        false
                    );
                } catch (e) {
                    console.error('WhatsApp sold notification error:', e);
                }
            }

            // ✅ FIXED: Mark player as processed and add to sold queue, let UI show "Next Player" button
            auction.setSoldQueue(prev => new Set(prev).add(auction.currentPlayer.id ?? `name:${auction.currentPlayer.name}`));
            auction.setPlayerProcessed(true);

            // Clear inputs
            auction.setBidAmountInput('');
            auction.setTeamNameInput('');

            // Advance pointer; let pickNextPlayer (via "Next Player" button) handle finishCategory
            auction.setCurrentQueuePointer(ptr => ptr + 1);
        } else {
            showFancyError(saleResult.message);
        }

        // Return the actual sale result so the UI can celebrate only confirmed sales.
        return saleResult;
    };

    // ✅ CENTRALIZED: Enhanced handleMarkUnsold
    const handleMarkUnsold = async () => {
        if (!auction.currentPlayer) {
            showFancyError("No current player selected for auction.");
            return;
        }

        // Mark player as unsold with wasUnsold flag retained for later display
        const updatedPlayers = players.map(player =>
            (auction.currentPlayer.id !== undefined && auction.currentPlayer.id !== null)
                ? (player.id === auction.currentPlayer.id ? { ...player, soldTo: 'Unsold', soldPrice: 0, sold: false, wasUnsold: true } : player)
                : (player.name === auction.currentPlayer.name ? { ...player, soldTo: 'Unsold', soldPrice: 0, sold: false, wasUnsold: true } : player)
        );

        const saved = await triggerAuctionSaveWithState('PLAYER_UNSOLD', `${auction.currentPlayer.name} marked as unsold`, 'Unsold', 0, updatedPlayers);
        if (!saved) return;
        setPlayers(updatedPlayers);
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

        // ✅ NEW: Auto-send unsold WhatsApp notification
        if (whatsappSettings.enabled) {
            try {
                await sendWhatsAppNotification(
                    auction.currentPlayer,
                    'Unsold',
                    0,
                    tournamentName,
                    true // isUnsold
                );
            } catch (e) {
                console.error('WhatsApp unsold notification error:', e);
            }
        }

        auction.markUnsoldPlayerWithoutNext();
        // Note: markUnsoldPlayerWithoutNext already clears bid/team inputs
    };

    // Sell Unsold Player later (keep wasUnsold flag)
    const sellUnsoldPlayerLater = async (playerObj, teamName, bidAmount, selectedCategory = null) => {
        const currentPlayer = players.find(p => (playerObj?.id !== undefined && playerObj?.id !== null) ? p.id === playerObj.id : p.name === playerObj?.name);
        if (!currentPlayer) return { success: false, message: 'Player not found.' };
        if (currentPlayer.sold || (currentPlayer.soldTo && currentPlayer.soldTo !== 'Unsold')) {
            return { success: false, message: `${currentPlayer.name} has already been sold.` };
        }
        if (!teams[teamName]) return { success: false, message: 'Selected team does not exist.' };
        const assignedCategory = selectedCategory || currentPlayer.category;
        if (!assignedCategory) return { success: false, message: 'Select a category before selling this player.' };
        const updatedTeams = processPlayerPurchase(teams, teamName, { ...playerObj, category: assignedCategory }, bidAmount, assignedCategory, categoryConfigs);
        if (!updatedTeams) return { success: false, message: 'Failed to process purchase. Budget or limit issue.' };
        const updatedPlayers = players.map(p => p.id === playerObj.id ? { ...p, category: assignedCategory, soldTo: teamName, soldPrice: bidAmount, sold: true, wasUnsold: p.wasUnsold || true } : p);
        const saved = await triggerAuctionSaveWithState('UNSOLD_PLAYER_SOLD', `${playerObj.name} sold later to ${teamName}`, teamName, bidAmount, updatedPlayers, updatedTeams);
        if (!saved) return { success: false, message: 'Sale not completed because the server save failed.' };
        setPlayers(updatedPlayers);
        setTeams(updatedTeams);
        return { success: true };
    };

    // ✅ Owner-player retention: a direct fixed-price assignment to a team,
    // NOT an auction bid. Reuses the exact same purse/roster/category-limit
    // plumbing as a normal purchase (via retainPlayer -> processPlayerPurchase),
    // so a retained player decrements playersToBuy and the relevant category's
    // remaining slots exactly like a bid-won player would, and is excluded
    // from bidding the same way any other sold player already is.
    const handleRetainPlayer = async (player, teamName, category, retentionAmount) => {
        if (!player || player.id === undefined || player.id === null) {
            showFancyError('Invalid player selected for retention.');
            return { success: false, message: 'Invalid player selected for retention.' };
        }

        // Guard against a fast double-click: the second click would otherwise
        // read the same (stale) players/teams state as the first and pass
        // every validation check before the first retention's state update
        // has landed.
        if (retainingPlayerIdsRef.current.has(player.id)) {
            return { success: false, message: 'Retention already in progress for this player.' };
        }

        // Always validate against the latest master record, not whatever
        // reference the page happened to pass in.
        const currentPlayer = players.find(p => p.id === player.id);
        if (!currentPlayer) {
            showFancyError('Player not found in the master player list.');
            return { success: false, message: 'Player not found.' };
        }

        if (currentPlayer.retentionSource === 'OWNER_RETENTION') {
            showFancyError(`${currentPlayer.name} has already been retained.`);
            return { success: false, message: 'Player already retained.' };
        }

        if (currentPlayer.sold && currentPlayer.soldTo !== 'Unsold') {
            showFancyError(`${currentPlayer.name} has already been sold and cannot be retained.`);
            return { success: false, message: 'Player already sold.' };
        }

        if (!teamName || !teams[teamName]) {
            showFancyError('Please select a valid team before submitting.');
            return { success: false, message: 'Invalid team.' };
        }

        if (!category || typeof category !== 'string' || !category.trim()) {
            showFancyError('Please select a valid category before submitting.');
            return { success: false, message: 'Invalid category.' };
        }

        const amount = Number(retentionAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            showFancyError('Please enter a valid retention amount (greater than 0).');
            return { success: false, message: 'Invalid retention amount.' };
        }

        const teamInfo = getTeamInfo(teams[teamName], teamName);
        if (amount > teamInfo.currentPurse) {
            showFancyError(`${teamName} has insufficient funds. Available: ${teamInfo.currentPurse.toLocaleString()}, Required: ${amount.toLocaleString()}`);
            return { success: false, message: 'Insufficient funds.' };
        }

        if (teamInfo.playersLeft <= 0) {
            showFancyError(`${teamName} has reached the maximum player limit.`);
            return { success: false, message: 'Team roster full.' };
        }

        // Category slot check — derived live from the roster, same as the
        // display logic, so it can never drift from what's actually there.
        const categoryConfig = categoryConfigs?.[category];
        const requiredForCategory = parseInt(categoryConfig?.playersPerCategory, 10) || 0;
        if (requiredForCategory > 0) {
            const filledForCategory = (teams[teamName].players || []).filter(p => p.category === category).length;
            if (filledForCategory >= requiredForCategory) {
                showFancyError(`${teamName} already has ${filledForCategory}/${requiredForCategory} ${category} players — no slot remaining.`);
                return { success: false, message: 'No category slot remaining.' };
            }
        }

        retainingPlayerIdsRef.current.add(player.id);
        try {
            const updatedTeams = retainPlayer(teams, teamName, currentPlayer, amount, category, categoryConfigs);
            if (!updatedTeams) {
                showFancyError('Failed to retain player. Please check the team, category and amount and try again.');
                return { success: false, message: 'Retention failed.' };
            }

            const updatedPlayers = players.map(p =>
                p.id === currentPlayer.id
                    ? { ...p, soldTo: teamName, soldPrice: amount, sold: true, category, retentionSource: 'OWNER_RETENTION' }
                    : p
            );

            const saved = await triggerAuctionSaveWithState(
                'OWNER_RETENTION',
                `${currentPlayer.name} retained by ${teamName} for ${amount} (${category})`,
                teamName,
                amount,
                updatedPlayers,
                updatedTeams
            );
            if (!saved) return { success: false, message: 'Retention not completed because the server save failed.' };
            setPlayers(updatedPlayers);
            setTeams(updatedTeams);

            return {
                success: true,
                message: `${currentPlayer.name} retained by ${teamName} for ₹${amount.toLocaleString()} (${category}).`
            };
        } finally {
            retainingPlayerIdsRef.current.delete(player.id);
        }
    };

    // ✅ UPDATED: Use new updateTeamInitialPurse function for Edit Balance
    const handleUpdateTeamPurse = async (teamName, newPurse) => {
        const updatedTeams = updateTeamInitialPurse(teams, teamName, newPurse);
        
        if (updatedTeams === teams) {
            showFancyError("Failed to update team purse. Please check the values and try again.");
            return false;
        }

        const saved = await triggerAuctionSaveWithState('PURSE_UPDATE', `Team ${teamName} purse updated`, teamName, newPurse, null, updatedTeams);
        if (!saved) return false;
        setTeams(updatedTeams);
        return true;
    };

    // ✅ Booster "+" button: bump one team's booster count by 1 using the
    // tournament-wide points-per-booster value (never a per-team value).
    const handleIncrementTeamBooster = async (teamName) => {
        const updatedTeams = incrementTeamBooster(teams, teamName, boosterPointsPerBooster);
        if (updatedTeams === teams) {
            showFancyError("Failed to add booster. Please check values and try again.");
            return false;
        }

        const newCount = updatedTeams[teamName]?.boosterCount ?? 0;
        const saved = await triggerAuctionSaveWithState(
            'BOOSTER_APPLIED',
            `Booster count for ${teamName} increased to ${newCount}`,
            teamName,
            newCount,
            null,
            updatedTeams
        );
        if (!saved) return false;
        setTeams(updatedTeams);
        return true;
    };
    
    // Booster "-" button: decrease one team's booster count by 1.
const handleDecrementTeamBooster = async (teamName) => {
    const currentCount = teams[teamName]?.boosterCount ?? 0;

    // Do not allow a negative booster count.
    if (currentCount <= 0) {
        showManagedToast('error', 'Booster count cannot be less than 0.', {
            icon: EMOJIS.WARNING,
            duration: 2500
        });
        return false;
    }

    const updatedTeams = decrementTeamBooster(
        teams,
        teamName,
        boosterPointsPerBooster
    );

    if (updatedTeams === teams) {
        showFancyError('Failed to remove booster. Please try again.');
        return false;
    }

    const newCount = updatedTeams[teamName]?.boosterCount ?? 0;

    const saved = await triggerAuctionSaveWithState(
        'BOOSTER_REMOVED',
        `Booster count for ${teamName} decreased to ${newCount}`,
        teamName,
        newCount,
        null,
        updatedTeams
    );
    if (!saved) return false;
    setTeams(updatedTeams);
    return true;
};

    // ✅ Update the single tournament-wide points-per-booster value and keep every
    // team's purse in sync with it.
    const handleUpdatePointsPerBooster = async (newPointsPerBooster) => {
        const updatedTeams = applyGlobalPointsPerBooster(teams, newPointsPerBooster);
        if (updatedTeams === teams) {
            showFancyError("Failed to update points per booster. Please enter a valid value.");
            return false;
        }

        const saved = await triggerAuctionSaveWithState(
            'BOOSTER_PPB_UPDATED',
            `Points per booster set to ${newPointsPerBooster} for all teams`,
            null,
            newPointsPerBooster,
            null,
            updatedTeams,
            { boosterPointsPerBooster: newPointsPerBooster }
        );
        if (!saved) return false;
        setTeams(updatedTeams);
        setBoosterPointsPerBooster?.(newPointsPerBooster);
        return true;
    };

    // ✅ CENTRALIZED: Function to handle player transfers using centralized management
    const handlePlayerTransfer = async (player, fromTeam, toTeam, newPrice) => {
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

        const saved = await triggerAuctionSaveWithState('PLAYER_TRANSFER', `${player.name} transferred from ${fromTeam} to ${toTeam}`, toTeam, newPrice, updatedPlayers, updatedTeams);
        if (!saved) return false;
        setPlayers(updatedPlayers);
        setTeams(updatedTeams);
        return true;
    };

    // Centralized edit for sold players from Teams page
    // Supports both transfers and same-team price edits and ensures viewer/cloud stays in sync.
    const handlePlayerEdit = async (player, currentTeam, newTeam, newPrice) => {
        if (!player || !currentTeam || !newTeam || typeof newPrice !== 'number' || newPrice <= 0) {
            showFancyError('Invalid player edit parameters.');
            return false;
        }

        const sameTeam = currentTeam === newTeam;
        const updatedTeams = sameTeam
            ? updatePlayerPriceInTeam(teams, player, currentTeam, newPrice)
            : processPlayerTransfer(teams, player, currentTeam, newTeam, newPrice);

        if (!updatedTeams) {
            showFancyError(
                sameTeam
                    ? 'Failed to update player price. Check team budget and try again.'
                    : 'Failed to transfer player. Please check team budgets and player limits.'
            );
            return false;
        }

        const updatedPlayers = players.map(p =>
            (p.id === player.id || p.name === player.name)
                ? { ...p, soldTo: newTeam, soldPrice: newPrice, sold: true }
                : p
        );

        const saved = await triggerAuctionSaveWithState(
            'PLAYER_EDIT',
            `${player.name} ${sameTeam ? 'price updated' : `moved ${currentTeam} -> ${newTeam}`}`,
            newTeam,
            newPrice,
            updatedPlayers,
            updatedTeams
        );
        if (!saved) return false;
        setPlayers(updatedPlayers);
        setTeams(updatedTeams);
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
    handleRetainPlayer,
    sellUnsoldPlayerLater,
    handleUpdateTeamPurse,
    handleIncrementTeamBooster,
    handleDecrementTeamBooster,
    handleUpdatePointsPerBooster,
    handlePlayerTransfer,
    handlePlayerEdit,
    getTeamBudgetInfo
    };
};