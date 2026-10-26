/**
 * ? CENTRALIZED TEAM DATA MANAGEMENT
 * 
 * This utility provides a single source of truth for all team-related calculations
 * and data management. All components should use these functions instead of 
 * calculating team values independently.
 * 
 * Benefits:
 * - Single source of truth for team data
 * - Consistent calculations across all components
 * - Easy to maintain and update
 * - No duplicate calculations or inconsistent values
 */

import { EMOJIS } from './constants';

/**
 * Get comprehensive team information with all calculated fields
 * @param {Object} teamData - Raw team data from state
 * @param {string} teamName - Name of the team
 * @returns {Object} - Complete team information with calculated fields
 */
export const getTeamInfo = (teamData, teamName) => {
    if (!teamData || !teamName) {
        return null;
    }

    // Core data
    const initialPurse = teamData.initialPurse || teamData.purse || 0;
    const currentPurse = teamData.purse || 0;
    const players = teamData.players || [];
    const playersToBuy = teamData.playersToBuy || 0;
    const playersLimit = (players.length || 0) + playersToBuy;

    // Calculated fields
    const pointsUsed = players.reduce((total, player) => total + (player.soldPrice || 0), 0);
    const pointsRemaining = currentPurse;
    const playersBought = players.length;
    const playersLeft = playersToBuy;
    
    // Additional useful calculations
    const averagePlayerPrice = playersBought > 0 ? Math.round(pointsUsed / playersBought) : 0;
    const budgetUtilizationPercent = initialPurse > 0 ? Math.round((pointsUsed / initialPurse) * 100) : 0;
    const averageRemainingBudgetPerPlayer = playersLeft > 0 ? Math.round(pointsRemaining / playersLeft) : pointsRemaining;

    return {
        // Basic Info
        teamName,
        owner: teamData.owner || '',
        
        // Financial Data
        initialPurse,           // Original budget from CSV
        currentPurse,           // Current available budget
        pointsUsed,             // Total spent on players
        pointsRemaining,        // Same as currentPurse (for clarity)
        
        // Player Data
        players,                // Array of purchased players
        playersBought,          // Count of players purchased
        playersLeft,            // Count of players still needed
        playersToBuy,           // Same as playersLeft (for compatibility)
        playersLimit,           // Total player limit for the team
        
        // Calculated Analytics
        averagePlayerPrice,                 // Average price per player bought
        budgetUtilizationPercent,          // Percentage of budget used
        averageRemainingBudgetPerPlayer,   // Average budget per remaining slot
        
        // Status flags
        canBuyMorePlayers: playersLeft > 0,
        hasPlayersToShow: playersBought > 0,
        isBudgetExhausted: pointsRemaining <= 0,
        isTeamComplete: playersLeft === 0,
        
        // Raw data (for compatibility)
        rawTeamData: teamData
    };
};

/**
 * Get team information for all teams
 * @param {Object} teams - Teams object from state
 * @returns {Array} - Array of team info objects
 */
export const getAllTeamsInfo = (teams) => {
    if (!teams || typeof teams !== 'object') {
        return [];
    }

    return Object.entries(teams).map(([teamName, teamData]) => 
        getTeamInfo(teamData, teamName)
    ).filter(Boolean); // Remove null entries
};

/**
 * Update team's purse amount (centralized purse management)
 * ? FIXED: Only update current purse, keep initial purse unchanged
 * @param {Object} teams - Current teams state
 * @param {string} teamName - Team to update
 * @param {number} newPurse - New purse amount
 * @returns {Object} - Updated teams object
 */
export const updateTeamPurse = (teams, teamName, newPurse) => {
    if (!teams || !teamName || typeof newPurse !== 'number' || newPurse < 0) {
        console.error('Invalid parameters for updateTeamPurse:', { teams: !!teams, teamName, newPurse });
        return teams;
    }

    const team = teams[teamName];
    if (!team) {
        console.error(`Team ${teamName} not found`);
        return teams;
    }

    return {
        ...teams,
        [teamName]: {
            ...team,
            purse: newPurse
            // ? FIXED: Do NOT update initialPurse here - it should remain as original CSV value
            // initialPurse should only be updated via explicit "Edit Balance" action
        }
    };
};

/**
 * ? NEW: Update team's initial purse (for Edit Balance functionality)
 * This updates both initial and current purse to the new amount
 * @param {Object} teams - Current teams state
 * @param {string} teamName - Team to update
 * @param {number} newInitialPurse - New initial purse amount
 * @returns {Object} - Updated teams object
 */
export const updateTeamInitialPurse = (teams, teamName, newInitialPurse) => {
    if (!teams || !teamName || typeof newInitialPurse !== 'number' || newInitialPurse < 0) {
        console.error('Invalid parameters for updateTeamInitialPurse:', { teams: !!teams, teamName, newInitialPurse });
        return teams;
    }

    const team = teams[teamName];
    if (!team) {
        console.error(`Team ${teamName} not found`);
        return teams;
    }

    // Calculate current purse based on new initial purse minus existing expenses
    const totalSpent = (team.players || []).reduce((sum, player) => sum + (player.soldPrice || 0), 0);
    const newCurrentPurse = newInitialPurse - totalSpent;

    return {
        ...teams,
        [teamName]: {
            ...team,
            baseInitialPurse: newInitialPurse,
            boosterCount: 0,
            initialPurse: newInitialPurse,  // Update initial purse
            purse: newCurrentPurse          // Recalculate current purse
        }
    };
};

/**
 * Add booster points to a team budget.
 * Simplified model: initialPurse already represents (base + boosters).
 * So adding booster points increases both initialPurse and current purse.
 *
 * NOTE: pointsPerBooster is a single tournament-wide setting (same value for every
 * team, for the whole tournament) — never a per-team value. Callers should always
 * pass the shared/global pointsPerBooster here.
 * @param {Object} teams - Current teams state
 * @param {string} teamName - Team to update
 * @param {number} boosterCount - New total booster count for this team
 * @param {number} pointsPerBooster - Tournament-wide points awarded per booster
 * @returns {Object} - Updated teams object
 */
export const setTeamBoosterCount = (teams, teamName, boosterCount, pointsPerBooster = 10) => {
    if (
        !teams ||
        !teamName ||
        typeof boosterCount !== 'number' ||
        boosterCount < 0 ||
        typeof pointsPerBooster !== 'number' ||
        pointsPerBooster <= 0
    ) {
        console.error('Invalid parameters for setTeamBoosterCount:', { teams: !!teams, teamName, boosterCount, pointsPerBooster });
        return teams;
    }

    const team = teams[teamName];
    if (!team) {
        console.error(`Team ${teamName} not found`);
        return teams;
    }

    const baseInitialPurse = team.baseInitialPurse ?? team.initialPurse ?? team.purse ?? 0;
    const totalSpent = (team.players || []).reduce((sum, player) => sum + (player.soldPrice || 0), 0);
    const boostedInitial = baseInitialPurse + (boosterCount * pointsPerBooster);
    const recalculatedPurse = boostedInitial - totalSpent;

    return {
        ...teams,
        [teamName]: {
            ...team,
            baseInitialPurse,
            boosterCount,
            pointsPerBooster,
            initialPurse: boostedInitial,
            purse: recalculatedPurse
        }
    };
};

/**
 * Increment a single team's booster count by one, using the tournament-wide
 * points-per-booster value. This is the "+" button action in the Booster popup.
 * @param {Object} teams - Current teams state
 * @param {string} teamName - Team to increment
 * @param {number} pointsPerBooster - Tournament-wide points awarded per booster
 * @returns {Object} - Updated teams object
 */
export const incrementTeamBooster = (teams, teamName, pointsPerBooster = 10) => {
    if (!teams || !teamName) {
        console.error('Invalid parameters for incrementTeamBooster:', { teams: !!teams, teamName });
        return teams;
    }

    const team = teams[teamName];
    if (!team) {
        console.error(`Team ${teamName} not found`);
        return teams;
    }

    const currentCount = team.boosterCount ?? 0;
    return setTeamBoosterCount(teams, teamName, currentCount + 1, pointsPerBooster);
};

/**
 * Apply a new tournament-wide points-per-booster value to every team, recalculating
 * each team's purse from its existing booster count so all teams stay in sync
 * (points-per-booster is never a per-team value).
 * @param {Object} teams - Current teams state
 * @param {number} pointsPerBooster - New tournament-wide points awarded per booster
 * @returns {Object} - Updated teams object
 */
export const applyGlobalPointsPerBooster = (teams, pointsPerBooster) => {
    if (!teams || typeof pointsPerBooster !== 'number' || pointsPerBooster <= 0) {
        console.error('Invalid parameters for applyGlobalPointsPerBooster:', { teams: !!teams, pointsPerBooster });
        return teams;
    }

    const updatedTeams = {};
    for (const [teamName, team] of Object.entries(teams)) {
        const boosterCount = team.boosterCount ?? 0;
        const baseInitialPurse = team.baseInitialPurse ?? team.initialPurse ?? team.purse ?? 0;
        const totalSpent = (team.players || []).reduce((sum, player) => sum + (player.soldPrice || 0), 0);
        const boostedInitial = baseInitialPurse + (boosterCount * pointsPerBooster);

        updatedTeams[teamName] = {
            ...team,
            baseInitialPurse,
            boosterCount,
            pointsPerBooster,
            initialPurse: boostedInitial,
            purse: boostedInitial - totalSpent
        };
    }

    return updatedTeams;
};

/**
 * Process a player purchase (centralized purchase management)
 * @param {Object} teams - Current teams state
 * @param {string} teamName - Buying team
 * @param {Object} player - Player being purchased
 * @param {number} price - Purchase price
 * @returns {Object} - Updated teams object or null if invalid
 */
export const processPlayerPurchase = (teams, teamName, player, price) => {
    if (!teams || !teamName || !player || typeof price !== 'number' || price <= 0) {
        console.error('Invalid parameters for processPlayerPurchase');
        return null;
    }

    const team = teams[teamName];
    if (!team) {
        console.error(`Team ${teamName} not found`);
        return null;
    }

    // Validate the purchase
    if (team.purse < price) {
        console.error(`Insufficient funds: ${team.purse} < ${price}`);
        return null;
    }

    if (team.playersToBuy <= 0) {
        console.error(`Team ${teamName} cannot buy more players`);
        return null;
    }

    // Check if player is already in team
    const playerAlreadyInTeam = team.players.some(p => p.id === player.id);
    if (playerAlreadyInTeam) {
        console.error(`Player ${player.name} already in team ${teamName}`);
        return null;
    }

    // Process the purchase
    return {
        ...teams,
        [teamName]: {
            ...team,
            purse: team.purse - price,                          // Deduct from budget
            playersToBuy: team.playersToBuy - 1,               // Decrease remaining slots
            players: [...team.players, { ...player, soldPrice: price }] // Add player
        }
    };
};

/**
 * Get a team's requirement status for every configured category, derived
 * live from the team's actual roster rather than a separately maintained
 * counter (so it can never drift out of sync with the roster).
 * @param {Object} team - Team data (must have `.players`)
 * @param {Object} categoryConfigs - { [category]: { playersPerCategory, basePrice } }
 * @returns {Object} - { [category]: { required, filled, remaining } }
 */
export const getCategoryRequirementStatus = (team, categoryConfigs) => {
    const status = {};
    if (!team || !categoryConfigs) return status;

    Object.entries(categoryConfigs).forEach(([category, config]) => {
        const required = parseInt(config?.playersPerCategory, 10) || 0;
        const filled = (team.players || []).filter(p => p.category === category).length;
        status[category] = {
            required,
            filled,
            remaining: Math.max(required - filled, 0)
        };
    });

    return status;
};

/**
 * Directly assign an owner-player to a team at a fixed retention price.
 * This is NOT an auction bid — it reuses processPlayerPurchase for the
 * purse/roster math (so initial/base purse semantics and playersToBuy
 * accounting stay byte-for-byte identical to a normal purchase), and
 * additionally enforces the team's per-category roster limit from
 * categoryConfigs — derived live from the roster, never a separate counter —
 * before delegating to it.
 * @param {Object} teams - Current teams state
 * @param {string} teamName - Team the player is being retained for
 * @param {Object} player - Player object (top-level master player record)
 * @param {number} retentionAmount - Fixed retention price (same positive-amount floor as a normal purchase)
 * @param {string} category - Category to assign the player under (may differ from the player's original CSV category)
 * @param {Object} categoryConfigs - Tournament category requirements, keyed by category name
 * @returns {Object|null} - Updated teams object, or null if the retention is invalid
 */
export const retainPlayer = (teams, teamName, player, retentionAmount, category, categoryConfigs = {}) => {
    if (!teams || !teamName || !player || !category) {
        console.error('Invalid parameters for retainPlayer:', { teams: !!teams, teamName, player: !!player, category });
        return null;
    }

    const team = teams[teamName];
    if (!team) {
        console.error(`Team ${teamName} not found`);
        return null;
    }

    // Enforce the category roster limit — only when that category actually
    // has a configured limit (an unconfigured category is treated as unlimited).
    const config = categoryConfigs?.[category];
    const required = parseInt(config?.playersPerCategory, 10) || 0;
    if (required > 0) {
        const filled = (team.players || []).filter(p => p.category === category).length;
        if (filled >= required) {
            console.error(`Team ${teamName} has no remaining ${category} slots (${filled}/${required})`);
            return null;
        }
    }

    // Assign under the (possibly overridden) category, then let the same
    // purchase path everything else uses handle purse + playersToBuy + the
    // duplicate-player guard.
    const retainedPlayer = { ...player, category };
    const updatedTeams = processPlayerPurchase(teams, teamName, retainedPlayer, retentionAmount);
    if (!updatedTeams) {
        return null;
    }

    // Tag the new roster entry with how it was acquired, without touching any
    // of the fields processPlayerPurchase already set (soldPrice, etc).
    const updatedTeam = updatedTeams[teamName];
    const taggedPlayers = updatedTeam.players.map(p =>
        p.id === player.id ? { ...p, retentionSource: 'OWNER_RETENTION' } : p
    );

    return {
        ...updatedTeams,
        [teamName]: {
            ...updatedTeam,
            players: taggedPlayers
        }
    };
};

/**
 * Process a player transfer between teams (centralized transfer management)
 * @param {Object} teams - Current teams state
 * @param {Object} player - Player being transferred
 * @param {string} fromTeam - Source team name
 * @param {string} toTeam - Destination team name
 * @param {number} newPrice - New price for the player
 * @returns {Object} - Updated teams object or null if invalid
 */
export const processPlayerTransfer = (teams, player, fromTeam, toTeam, newPrice) => {
    if (!teams || !player || !fromTeam || !toTeam || typeof newPrice !== 'number' || newPrice <= 0) {
        console.error('Invalid parameters for processPlayerTransfer');
        return null;
    }

    const sourceTeam = teams[fromTeam];
    const destTeam = teams[toTeam];

    if (!sourceTeam || !destTeam) {
        console.error('Source or destination team not found');
        return null;
    }

    // Validate destination team can afford and has space
    if (destTeam.purse < newPrice) {
        console.error(`Destination team has insufficient funds: ${destTeam.purse} < ${newPrice}`);
        return null;
    }

    if (destTeam.playersToBuy <= 0) {
        console.error(`Destination team cannot buy more players`);
        return null;
    }

    // Find player in source team
    const playerIndex = sourceTeam.players.findIndex(p => p.id === player.id || p.name === player.name);
    if (playerIndex === -1) {
        console.error(`Player ${player.name} not found in source team ${fromTeam}`);
        return null;
    }

    const existingPlayer = sourceTeam.players[playerIndex];

    // Process the transfer
    return {
        ...teams,
        [fromTeam]: {
            ...sourceTeam,
            purse: sourceTeam.purse + existingPlayer.soldPrice,    // Refund old price
            playersToBuy: sourceTeam.playersToBuy + 1,            // Increase available slots
            players: sourceTeam.players.filter((_, index) => index !== playerIndex) // Remove player
        },
        [toTeam]: {
            ...destTeam,
            purse: destTeam.purse - newPrice,                     // Deduct new price
            playersToBuy: destTeam.playersToBuy - 1,             // Decrease available slots
            players: [...destTeam.players, { ...player, soldPrice: newPrice }] // Add player with new price
        }
    };
};

/**
 * Update a sold player's price within the same team.
 * Keeps playersToBuy unchanged, adjusts purse by the price delta.
 * @param {Object} teams - Current teams state
 * @param {Object} player - Player to update (must exist in team players[])
 * @param {string} teamName - Team that owns the player
 * @param {number} newPrice - New sold price
 * @returns {Object} - Updated teams object or null if invalid
 */
export const updatePlayerPriceInTeam = (teams, player, teamName, newPrice) => {
    if (!teams || !player || !teamName || typeof newPrice !== 'number' || newPrice <= 0) {
        console.error('Invalid parameters for updatePlayerPriceInTeam');
        return null;
    }

    const team = teams[teamName];
    if (!team) {
        console.error(`Team ${teamName} not found`);
        return null;
    }

    const playerIndex = (team.players || []).findIndex(p => p.id === player.id || p.name === player.name);
    if (playerIndex === -1) {
        console.error(`Player ${player.name} not found in team ${teamName}`);
        return null;
    }

    const existingPlayer = team.players[playerIndex];
    const oldPrice = existingPlayer.soldPrice || 0;
    const delta = newPrice - oldPrice;

    // If increasing price, ensure team can afford the delta
    if (delta > 0 && team.purse < delta) {
        console.error(`Insufficient funds to increase price: purse ${team.purse} < delta ${delta}`);
        return null;
    }

    const updatedPlayersInTeam = team.players.map((p, idx) =>
        idx === playerIndex ? { ...p, soldPrice: newPrice } : p
    );

    return {
        ...teams,
        [teamName]: {
            ...team,
            purse: team.purse - delta,
            players: updatedPlayersInTeam
        }
    };
};

/**
 * Validate if a team can make a purchase
 * @param {Object} teamData - Team data
 * @param {number} bidAmount - Bid amount to validate
 * @returns {Object} - Validation result
 */
export const validateTeamPurchase = (teamData, bidAmount) => {
    if (!teamData || typeof bidAmount !== 'number') {
        return {
            isValid: false,
            message: 'Invalid team data or bid amount',
            details: null
        };
    }

    const teamInfo = getTeamInfo(teamData, 'Team');

    if (bidAmount > teamInfo.currentPurse) {
        return {
            isValid: false,
            message: `Bid exceeds available budget. Available: ${EMOJIS.CURRENCY_RUPEE}${teamInfo.currentPurse.toLocaleString()}, Bid: ${EMOJIS.CURRENCY_RUPEE}${bidAmount.toLocaleString()}`,
            details: {
                availableBudget: teamInfo.currentPurse,
                requestedAmount: bidAmount,
                shortfall: bidAmount - teamInfo.currentPurse
            }
        };
    }

    if (teamInfo.playersLeft <= 0) {
        return {
            isValid: false,
            message: 'Team has reached maximum player limit',
            details: {
                playersLimit: teamInfo.playersLimit,
                playersBought: teamInfo.playersBought,
                playersLeft: teamInfo.playersLeft
            }
        };
    }

    return {
        isValid: true,
        message: 'Purchase is valid',
        details: {
            availableBudget: teamInfo.currentPurse,
            requestedAmount: bidAmount,
            remainingAfterPurchase: teamInfo.currentPurse - bidAmount,
            playersLeft: teamInfo.playersLeft
        }
    };
};

/**
 * Get summary statistics for all teams
 * @param {Object} teams - Teams object
 * @returns {Object} - Summary statistics
 */
export const getTeamsSummary = (teams) => {
    const teamsInfo = getAllTeamsInfo(teams);
    
    if (teamsInfo.length === 0) {
        return {
            totalTeams: 0,
            totalPlayers: 0,
            totalBudget: 0,
            totalSpent: 0,
            totalRemaining: 0,
            averageSpendPerTeam: 0,
            averagePlayersPerTeam: 0,
            teamsCompleted: 0,
            teamsWithBudget: 0
        };
    }

    const totalBudget = teamsInfo.reduce((sum, team) => sum + team.initialPurse, 0);
    const totalSpent = teamsInfo.reduce((sum, team) => sum + team.pointsUsed, 0);
    const totalRemaining = teamsInfo.reduce((sum, team) => sum + team.pointsRemaining, 0);
    const totalPlayers = teamsInfo.reduce((sum, team) => sum + team.playersBought, 0);
    const teamsCompleted = teamsInfo.filter(team => team.isTeamComplete).length;
    const teamsWithBudget = teamsInfo.filter(team => team.pointsRemaining > 0).length;

    return {
        totalTeams: teamsInfo.length,
        totalPlayers,
        totalBudget,
        totalSpent,
        totalRemaining,
        averageSpendPerTeam: Math.round(totalSpent / teamsInfo.length),
        averagePlayersPerTeam: Math.round(totalPlayers / teamsInfo.length),
        teamsCompleted,
        teamsWithBudget,
        budgetUtilizationPercent: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
    };
};

/**
 * Format team information for display
 * @param {Object} teamInfo - Team info from getTeamInfo()
 * @returns {Object} - Formatted display data
 */
export const formatTeamForDisplay = (teamInfo) => {
    if (!teamInfo) return null;

    return {
        // Display strings
        initialPurseDisplay: `${EMOJIS.CURRENCY_RUPEE}${teamInfo.initialPurse.toLocaleString()}`,
        currentPurseDisplay: `${EMOJIS.CURRENCY_RUPEE}${teamInfo.currentPurse.toLocaleString()}`,
        pointsUsedDisplay: `${EMOJIS.CURRENCY_RUPEE}${teamInfo.pointsUsed.toLocaleString()}`,
        averagePriceDisplay: `${EMOJIS.CURRENCY_RUPEE}${teamInfo.averagePlayerPrice.toLocaleString()}`,
        
        // Status indicators
        budgetStatus: teamInfo.isBudgetExhausted ? 'Exhausted' : 
                     teamInfo.currentPurse < 1000000 ? 'Low' : 'Good',
        completionStatus: teamInfo.isTeamComplete ? 'Complete' : 
                         teamInfo.playersBought === 0 ? 'Not Started' : 'In Progress',
        
        // Progress indicators
        playerProgress: `${teamInfo.playersBought}/${teamInfo.playersLimit}`,
        budgetProgress: `${teamInfo.budgetUtilizationPercent}%`,
        
        // Raw data for calculations
        ...teamInfo
    };
};

/**
 * Export teams data with centralized calculations
 * @param {Object} teams - Teams object
 * @returns {Array} - Array of team data for export
 */
export const prepareTeamsForExport = (teams) => {
    return getAllTeamsInfo(teams).map(teamInfo => ({
        teamName: teamInfo.teamName,
        owner: teamInfo.owner,
        initialBudget: teamInfo.initialPurse,
        currentBudget: teamInfo.currentPurse,
        totalSpent: teamInfo.pointsUsed,
        playersBought: teamInfo.playersBought,
        playersRemaining: teamInfo.playersLeft,
        averagePlayerPrice: teamInfo.averagePlayerPrice,
        budgetUtilization: `${teamInfo.budgetUtilizationPercent}%`,
        status: teamInfo.isTeamComplete ? 'Complete' : 'In Progress',
        players: teamInfo.players.map(player => ({
            name: player.name,
            category: player.category || 'OPEN',
            skill: player.skill || 'All Rounder',
            price: player.soldPrice
        }))
    }));
};