/**
 * Utility functions for team data management and initialization
 */

/**
 * Initialize team data with proper purse tracking
 * Ensures teams have both initialPurse and current purse properly set
 * @param {Object} teamsData - Raw teams data (typically from CSV)
 * @returns {Object} - Properly initialized teams data
 */
export const initializeTeamData = (teamsData) => {
    const initializedTeams = {};
    
    Object.keys(teamsData).forEach(teamName => {
        const team = teamsData[teamName];
        initializedTeams[teamName] = {
            ...team,
            initialPurse: team.initialPurse || team.purse, // Set initialPurse if not already set
            purse: team.purse, // Current available purse (will decrease with purchases)
            players: team.players || [] // Ensure players array exists
        };
    });
    
    return initializedTeams;
};

/**
 * Migrate existing team data to include initialPurse field
 * This is for backward compatibility with existing auction data
 * @param {Object} teamsData - Existing teams data
 * @returns {Object} - Migrated teams data with initialPurse
 */
export const migrateTeamData = (teamsData) => {
    const migratedTeams = {};
    
    Object.keys(teamsData).forEach(teamName => {
        const team = teamsData[teamName];
        
        // If initialPurse doesn't exist, calculate it from current purse + spent amount
        if (!team.initialPurse) {
            const totalSpent = (team.players || []).reduce((sum, player) => {
                return sum + (player.soldPrice || 0);
            }, 0);
            
            migratedTeams[teamName] = {
                ...team,
                initialPurse: team.purse + totalSpent // Reconstruct initial purse
            };
        } else {
            migratedTeams[teamName] = team;
        }
    });
    
    return migratedTeams;
};

/**
 * Validate team data integrity
 * @param {Object} teamsData - Teams data to validate
 * @returns {Object} - Validation result with any issues found
 */
export const validateTeamData = (teamsData) => {
    const issues = [];
    const validTeams = {};
    
    Object.keys(teamsData).forEach(teamName => {
        const team = teamsData[teamName];
        const teamIssues = [];
        
        // Check required fields
        if (typeof team.purse !== 'number' || team.purse < 0) {
            teamIssues.push(`Invalid purse amount: ${team.purse}`);
        }
        
        if (typeof team.initialPurse !== 'number' || team.initialPurse < 0) {
            teamIssues.push(`Invalid initial purse amount: ${team.initialPurse}`);
        }
        
        if (team.initialPurse && team.purse && team.purse > team.initialPurse) {
            teamIssues.push(`Current purse (${team.purse}) exceeds initial purse (${team.initialPurse})`);
        }
        
        if (typeof team.playersToBuy !== 'number' || team.playersToBuy < 0) {
            teamIssues.push(`Invalid players to buy: ${team.playersToBuy}`);
        }
        
        if (!Array.isArray(team.players)) {
            teamIssues.push(`Players should be an array`);
        }
        
        if (teamIssues.length > 0) {
            issues.push({
                teamName,
                issues: teamIssues
            });
        } else {
            validTeams[teamName] = team;
        }
    });
    
    return {
        isValid: issues.length === 0,
        issues,
        validTeams
    };
};