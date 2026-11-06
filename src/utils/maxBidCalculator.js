// Shared source of truth for Max Bid calculations used by both the full page and auction popup.
export const calculateTeamMaxBidAnalysis = ({
    teams = {},
    players = [],
    categoryConfigs = {},
    selectedCategoryForAnalysis = "OPEN"
}) => {
    const availableCategories = Object.keys(categoryConfigs || {});
    if (Object.keys(teams || {}).length === 0 || availableCategories.length === 0) {
        return [];
    }

    return Object.entries(teams).map(([teamName, teamData]) => {
        // Team purse is canonical and already includes any applied boosters.
        const remainingPoints = Number(teamData?.purse) || 0;
        let totalReservedPoints = 0;
        const categoryBreakdown = {};

        availableCategories.forEach(categoryName => {
            const config = categoryConfigs[categoryName];
            const basePrice = parseInt(config?.basePrice, 10) || 0;
            const playersAllowed = parseInt(config?.playersPerCategory, 10) || 0;
            const playersBought = players.filter(player =>
                (player.category || "OPEN") === categoryName &&
                player.soldTo === teamName &&
                player.sold === true
            ).length;
            const playersRemaining = Math.max(0, playersAllowed - playersBought);
            const pointsReserved = categoryName === selectedCategoryForAnalysis
                ? Math.max(0, playersRemaining - 1) * basePrice
                : playersRemaining * basePrice;

            totalReservedPoints += pointsReserved;
            categoryBreakdown[categoryName] = {
                playersBought,
                playersAllowed,
                playersRemaining,
                basePrice,
                pointsReserved,
                canBuyMore: playersRemaining > 0
            };
        });

        const maxBid = Math.max(0, remainingPoints - totalReservedPoints);
        const selectedCategoryData = categoryBreakdown[selectedCategoryForAnalysis];
        const canBidForSelectedCategory = selectedCategoryData?.canBuyMore &&
            remainingPoints >= selectedCategoryData?.basePrice;

        return {
            teamName,
            owner: teamData?.owner,
            remainingPoints,
            totalReservedPoints,
            maxBid,
            categoryBreakdown,
            canBidForSelectedCategory,
            playersToBuy: teamData?.playersToBuy
        };
    });
};
