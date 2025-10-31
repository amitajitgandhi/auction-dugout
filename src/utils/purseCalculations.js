/**
 * Simplified utility functions for handling team purse calculations
 * ? ARCHIVED: All booster-related functionality removed for simplicity
 */

/**
 * Calculate total available budget for a team (just the current purse)
 * @param {Object} teamData - Team object with purse information
 * @returns {number} - Current purse amount
 */
export const calculateTotalAvailableBudget = (teamData) => {
    return teamData.purse || 0;
};

/**
 * Get team purse information with breakdown
 * @param {Object} teamData - Team object
 * @param {string} teamName - Name of the team
 * @returns {Object} - Purse breakdown object
 */
export const getTeamPurseBreakdown = (teamData, teamName) => {
    const currentPurse = teamData.purse || 0;
    const initialPurse = teamData.initialPurse || teamData.purse || 0;
    const totalSpent = initialPurse - currentPurse;
    
    return {
        teamName,
        initialPurse,
        currentPurse,
        totalAvailable: currentPurse, // ? SIMPLIFIED: No boosters, just current purse
        totalSpent,
        playersCount: teamData.players?.length || 0,
        playersToBuy: teamData.playersToBuy || 0
    };
};

/**
 * Validate if a bid amount is within team's available budget
 * @param {number} bidAmount - The bid amount to validate
 * @param {Object} teamData - Team object
 * @param {string} teamName - Name of the team
 * @returns {Object} - Validation result with success flag and message
 */
export const validateBidAmount = (bidAmount, teamData, teamName) => {
    const breakdown = getTeamPurseBreakdown(teamData, teamName);
    
    if (bidAmount > breakdown.currentPurse) {
        return {
            success: false,
            message: `Bid exceeds team's available budget.`,
            breakdown
        };
    }
    
    return {
        success: true,
        breakdown
    };
};

/**
 * Calculate new purse after a purchase
 * @param {Object} teamData - Team object
 * @param {number} purchaseAmount - Amount being spent
 * @returns {number} - New purse amount
 */
export const calculateNewPurseAfterPurchase = (teamData, purchaseAmount) => {
    return teamData.purse - purchaseAmount;
};

/**
 * ? NEW: Update team's purse amount
 * @param {Object} teamData - Team object
 * @param {number} newPurseAmount - New purse amount
 * @returns {Object} - Updated team object
 */
export const updateTeamPurse = (teamData, newPurseAmount) => {
    return {
        ...teamData,
        purse: newPurseAmount,
        initialPurse: newPurseAmount // Update both current and initial
    };
};