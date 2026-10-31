const normalize = (value) => (value ?? '').toString().trim().toUpperCase();

const getPlayerStatus = (player) => ({
    sold: !!(player?.sold && player?.soldTo !== 'Unsold'),
    unsold: player?.soldTo === 'Unsold'
});

export const buildViewerPayload = (stateData = {}) => {
    const players = Array.isArray(stateData.players) ? stateData.players : [];
    const teams = stateData.teams && typeof stateData.teams === 'object' ? stateData.teams : {};
    const selectedCategory = stateData.selectedCategory || '';
    const currentPlayer = stateData.currentPlayerName
        ? players.find((player) => player.name === stateData.currentPlayerName)
        : null;

    const categoryPlayers = selectedCategory
        ? players.filter((player) => normalize(player.category) === normalize(selectedCategory))
        : [];

    const categoryStats = categoryPlayers.reduce((stats, player) => {
        const status = getPlayerStatus(player);
        if (status.sold) stats.sold += 1;
        else if (status.unsold) stats.unsold += 1;
        else stats.remaining += 1;
        return stats;
    }, { sold: 0, unsold: 0, remaining: 0 });

    const overall = players.reduce((stats, player) => {
        const status = getPlayerStatus(player);
        if (status.sold) stats.sold += 1;
        else if (status.unsold) stats.unsold += 1;
        else stats.remaining += 1;
        return stats;
    }, { total: players.length, sold: 0, unsold: 0, remaining: 0 });

    const compactTeams = Object.fromEntries(
        Object.entries(teams).map(([teamName, team]) => [
            teamName,
            {
                owner: team?.owner || '',
                purse: team?.purse || 0,
                players: Array.isArray(team?.players)
                    ? team.players.map((player) => ({
                        name: player?.name || '',
                        category: player?.category || '',
                        soldPrice: player?.soldPrice || 0
                    }))
                    : []
            }
        ])
    );

    return {
        tournamentName: stateData.tournamentName || '',
        sponsorName: stateData.sponsorName || '',
        tickerDetails: stateData.tickerDetails || '',
        auctionStarted: !!stateData.auctionStarted,
        selectedCategory,
        currentPlayer: currentPlayer ? {
            name: currentPlayer.name || '',
            skill: currentPlayer.skill || '',
            category: currentPlayer.category || '',
            cricHeroesProfile: currentPlayer.cricHeroesProfile || '',
            sold: !!currentPlayer.sold,
            soldTo: currentPlayer.soldTo || '',
            soldPrice: currentPlayer.soldPrice || 0
        } : null,
        categoryStats,
        progress: {
            ...overall,
            percentage: overall.total > 0
                ? Math.round(((overall.sold + overall.unsold) / overall.total) * 100)
                : 0
        },
        teams: compactTeams
    };
};
