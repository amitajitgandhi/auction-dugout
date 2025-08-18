import React, { useState, useMemo } from "react";
import { EMOJIS } from "../utils/constants";

const MaxBidPage = ({ 
    teams, 
    players, 
    tournamentName, 
    onResetAuction, 
    onBackToAuction,
    showManagedToast,
    onWhatsAppSettings,
    onTeamWhatsAppShare,
    whatsappSettings
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [sortBy, setSortBy] = useState('highest'); // 'highest', 'lowest', 'alphabetical'
    const [filterCategory, setFilterCategory] = useState('ALL'); // 'ALL' or specific category

    // Calculate max bid analysis data
    const maxBidAnalysis = useMemo(() => {
        const soldPlayers = players.filter(player => player.sold && player.soldTo && player.soldPrice > 0);
        
        if (soldPlayers.length === 0) {
            return {
                totalPlayers: 0,
                totalValue: 0,
                averagePrice: 0,
                highestBid: null,
                lowestBid: null,
                categoryBreakdown: {},
                teamBreakdown: {},
                playersByPrice: []
            };
        }

        // Sort players by price
        const playersByPrice = [...soldPlayers].sort((a, b) => b.soldPrice - a.soldPrice);
        
        // Calculate totals
        const totalValue = soldPlayers.reduce((sum, player) => sum + player.soldPrice, 0);
        const averagePrice = totalValue / soldPlayers.length;
        
        // Find highest and lowest bids
        const highestBid = playersByPrice[0];
        const lowestBid = playersByPrice[playersByPrice.length - 1];
        
        // Category breakdown
        const categoryBreakdown = {};
        soldPlayers.forEach(player => {
            const category = player.category || 'OPEN';
            if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = {
                    count: 0,
                    totalValue: 0,
                    averagePrice: 0,
                    highestPrice: 0,
                    lowestPrice: Infinity,
                    players: []
                };
            }
            categoryBreakdown[category].count++;
            categoryBreakdown[category].totalValue += player.soldPrice;
            categoryBreakdown[category].highestPrice = Math.max(categoryBreakdown[category].highestPrice, player.soldPrice);
            categoryBreakdown[category].lowestPrice = Math.min(categoryBreakdown[category].lowestPrice, player.soldPrice);
            categoryBreakdown[category].players.push(player);
        });
        
        // Calculate average prices for categories
        Object.keys(categoryBreakdown).forEach(category => {
            categoryBreakdown[category].averagePrice = categoryBreakdown[category].totalValue / categoryBreakdown[category].count;
        });
        
        // Team breakdown
        const teamBreakdown = {};
        soldPlayers.forEach(player => {
            const teamName = player.soldTo;
            if (!teamBreakdown[teamName]) {
                teamBreakdown[teamName] = {
                    count: 0,
                    totalSpent: 0,
                    averagePrice: 0,
                    highestPurchase: 0,
                    lowestPurchase: Infinity,
                    players: []
                };
            }
            teamBreakdown[teamName].count++;
            teamBreakdown[teamName].totalSpent += player.soldPrice;
            teamBreakdown[teamName].highestPurchase = Math.max(teamBreakdown[teamName].highestPurchase, player.soldPrice);
            teamBreakdown[teamName].lowestPurchase = Math.min(teamBreakdown[teamName].lowestPurchase, player.soldPrice);
            teamBreakdown[teamName].players.push(player);
        });
        
        // Calculate average prices for teams
        Object.keys(teamBreakdown).forEach(teamName => {
            teamBreakdown[teamName].averagePrice = teamBreakdown[teamName].totalSpent / teamBreakdown[teamName].count;
        });

        return {
            totalPlayers: soldPlayers.length,
            totalValue,
            averagePrice,
            highestBid,
            lowestBid,
            categoryBreakdown,
            teamBreakdown,
            playersByPrice
        };
    }, [players]);

    // Get filtered and sorted players
    const filteredPlayers = useMemo(() => {
        let filtered = maxBidAnalysis.playersByPrice;
        
        // Filter by category
        if (filterCategory !== 'ALL') {
            filtered = filtered.filter(player => (player.category || 'OPEN') === filterCategory);
        }
        
        // Sort
        switch (sortBy) {
            case 'lowest':
                filtered = [...filtered].sort((a, b) => a.soldPrice - b.soldPrice);
                break;
            case 'alphabetical':
                filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'highest':
            default:
                filtered = [...filtered].sort((a, b) => b.soldPrice - a.soldPrice);
                break;
        }
        
        return filtered;
    }, [maxBidAnalysis.playersByPrice, sortBy, filterCategory]);

    // Get unique categories from sold players
    const availableCategories = useMemo(() => {
        const categories = new Set(players.filter(p => p.sold).map(p => p.category || 'OPEN'));
        return ['ALL', ...Array.from(categories)];
    }, [players]);

    const handleExportMaxBidCSV = () => {
        if (maxBidAnalysis.totalPlayers === 0) {
            showManagedToast('error', 'No sold players to export!', {
                style: {
                    border: '2px solid #f59e42',
                    padding: '16px',
                    color: '#b91c1c',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    background: 'linear-gradient(90deg, #fffbe6 0%, #ffe4e6 100%)',
                    boxShadow: '0 4px 24px 0 #fbbf24',
                },
                icon: EMOJIS.WARNING,
                duration: 3000,
            });
            return;
        }

        const csvRows = [];
        csvRows.push(['Rank', 'Player Name', 'Category', 'Skill', 'Team', 'Purchase Price'].join(','));
        
        maxBidAnalysis.playersByPrice.forEach((player, index) => {
            csvRows.push([
                index + 1,
                `"${player.name}"`,
                `"${player.category || 'OPEN'}"`,
                `"${player.skill}"`,
                `"${player.soldTo}"`,
                player.soldPrice
            ].join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${tournamentName}_Max_Bid_Analysis_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        showManagedToast('success', 'Max Bid analysis exported successfully!', {
            style: {
                border: '2px solid #10b981',
                padding: '16px',
                color: '#065f46',
                fontWeight: 'bold',
                fontSize: '1.05rem',
                background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
                boxShadow: '0 4px 24px 0 #10b981',
            },
            icon: EMOJIS.CHART,
            duration: 4000,
        });
        setShowMenu(false);
    };

    const handleWhatsAppSettings = () => {
        onWhatsAppSettings();
        setShowMenu(false);
    };

    const handleResetAuction = () => {
        onResetAuction();
        setShowMenu(false);
    };

    if (maxBidAnalysis.totalPlayers === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 bg-fixed relative overflow-x-hidden">
                {/* Tournament Name Ticker */}
                <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white py-2 shadow-lg">
                    <div className="overflow-hidden whitespace-nowrap">
                        <div className="animate-marquee inline-block font-bold text-lg">
                            {EMOJIS.TROPHY} {tournamentName.toUpperCase()} - MAX BID ANALYSIS {EMOJIS.TROPHY}
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-20 px-4 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="text-6xl mb-4">{EMOJIS.MAILBOX}</div>
                        <h3 className="text-2xl font-bold text-gray-300 mb-2">No Auction Data Available</h3>
                        <p className="text-gray-400 mb-6">Start selling players to see max bid analysis.</p>
                        <button
                            onClick={onBackToAuction}
                            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8 py-4 rounded-lg font-bold shadow-lg hover:from-violet-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 flex items-center gap-3 mx-auto text-lg"
                        >
                            <span className="text-xl">{EMOJIS.BACK_ARROW}</span>
                            Back to Auction
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 bg-fixed relative overflow-x-hidden">
            {/* Tournament Name Ticker */}
            <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white py-2 shadow-lg">
                <div className="overflow-hidden whitespace-nowrap">
                    <div className="animate-marquee inline-block font-bold text-lg">
                        {EMOJIS.TROPHY} {tournamentName.toUpperCase()} - MAX BID ANALYSIS {EMOJIS.TROPHY}
                    </div>
                </div>
            </div>

            {/* Hamburger Menu - Top Right Corner */}
            <div className="fixed top-16 right-4 z-50">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-3 rounded-lg shadow-md hover:from-gray-700 hover:to-gray-800 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    title="More Options"
                >
                    <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                        <div className="w-6 h-0.5 bg-white rounded"></div>
                        <div className="w-6 h-0.5 bg-white rounded"></div>
                        <div className="w-6 h-0.5 bg-white rounded"></div>
                    </div>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fade-in">
                        <div className="py-2">
                            {/* Export Max Bid Analysis */}
                            <button
                                onClick={handleExportMaxBidCSV}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-200 flex items-center gap-3"
                            >
                                <span className="text-blue-500">{EMOJIS.CHART}</span>
                                <span className="text-gray-700 font-medium">Export Analysis</span>
                            </button>

                            {/* WhatsApp Settings */}
                            <button
                                onClick={handleWhatsAppSettings}
                                className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors duration-200 flex items-center gap-3"
                            >
                                <span className="text-green-500">{EMOJIS.MOBILE}</span>
                                <span className="text-gray-700 font-medium">WhatsApp Settings</span>
                            </button>

                            {/* Divider */}
                            <div className="border-t border-gray-200 my-2"></div>

                            {/* Reset Auction */}
                            <button
                                onClick={handleResetAuction}
                                className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors duration-200 flex items-center gap-3"
                            >
                                <span className="text-red-500">{EMOJIS.REFRESH}</span>
                                <span className="text-gray-700 font-medium">Reset Auction</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Click outside to close menu */}
            {showMenu && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMenu(false)}
                ></div>
            )}

            <div className="pt-16 pb-20 px-4">
                <div className="w-full max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                            {EMOJIS.ZAP} Max Bid Analysis
                        </h1>
                        <p className="text-gray-300 text-lg mb-6">Complete analysis of player purchases and team spending</p>
                        
                        {/* Back to Auction Button */}
                        <button
                            onClick={onBackToAuction}
                            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8 py-4 rounded-lg font-bold shadow-lg hover:from-violet-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 flex items-center gap-3 mx-auto text-lg mb-8"
                        >
                            <span className="text-xl">{EMOJIS.BACK_ARROW}</span>
                            Back to Auction
                        </button>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Total Players Sold</p>
                                    <p className="text-3xl font-bold">{maxBidAnalysis.totalPlayers}</p>
                                </div>
                                <div className="text-4xl opacity-80">{EMOJIS.PEOPLE}</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Total Value</p>
                                    <p className="text-3xl font-bold">{EMOJIS.CURRENCY_RUPEE}{maxBidAnalysis.totalValue.toLocaleString()}</p>
                                </div>
                                <div className="text-4xl opacity-80">{EMOJIS.MONEY_BAG}</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">Average Price</p>
                                    <p className="text-3xl font-bold">{EMOJIS.CURRENCY_RUPEE}{Math.round(maxBidAnalysis.averagePrice).toLocaleString()}</p>
                                </div>
                                <div className="text-4xl opacity-80">{EMOJIS.TARGET}</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm font-medium">Highest Bid</p>
                                    <p className="text-3xl font-bold">{EMOJIS.CURRENCY_RUPEE}{maxBidAnalysis.highestBid?.soldPrice.toLocaleString()}</p>
                                    <p className="text-orange-100 text-xs truncate">{maxBidAnalysis.highestBid?.name}</p>
                                </div>
                                <div className="text-4xl opacity-80">{EMOJIS.STAR}</div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and Controls */}
                    <div className="mb-6 bg-white bg-opacity-95 rounded-xl shadow-lg p-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                        <option value="highest">Highest Price</option>
                                        <option value="lowest">Lowest Price</option>
                                        <option value="alphabetical">Alphabetical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter Category</label>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    >
                                        {availableCategories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="text-gray-600">
                                Showing {filteredPlayers.length} of {maxBidAnalysis.totalPlayers} players
                            </div>
                        </div>
                    </div>

                    {/* Players List */}
                    <div className="bg-white bg-opacity-95 rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span>{EMOJIS.CHART}</span>
                                Player Purchase Analysis
                            </h3>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPlayers.map((player, index) => (
                                        <tr key={player.id} className="hover:bg-gray-50 transition-colors duration-200">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {sortBy === 'highest' && index < 3 && (
                                                        <span className="mr-2">
                                                            {index === 0 ? '??' : index === 1 ? '??' : '??'}
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {maxBidAnalysis.playersByPrice.findIndex(p => p.id === player.id) + 1}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <span className="text-2xl mr-3">{EMOJIS.PERSON}</span>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{player.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                    {player.category || 'OPEN'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {player.skill}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {player.soldTo}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-lg font-bold text-green-600">
                                                    {EMOJIS.CURRENCY_RUPEE}{player.soldPrice.toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    {Object.keys(maxBidAnalysis.categoryBreakdown).length > 1 && (
                        <div className="mt-8 bg-white bg-opacity-95 rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <span>{EMOJIS.TARGET}</span>
                                    Category Analysis
                                </h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                                {Object.entries(maxBidAnalysis.categoryBreakdown).map(([category, data]) => (
                                    <div key={category} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                                        <h4 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                                            <span>{EMOJIS.STAR}</span>
                                            {category}
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Players:</span>
                                                <span className="font-medium">{data.count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total Value:</span>
                                                <span className="font-medium">{EMOJIS.CURRENCY_RUPEE}{data.totalValue.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Avg Price:</span>
                                                <span className="font-medium">{EMOJIS.CURRENCY_RUPEE}{Math.round(data.averagePrice).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Highest:</span>
                                                <span className="font-medium text-green-600">{EMOJIS.CURRENCY_RUPEE}{data.highestPrice.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Lowest:</span>
                                                <span className="font-medium text-blue-600">{EMOJIS.CURRENCY_RUPEE}{data.lowestPrice.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="w-full text-center py-4 mt-8 text-white bg-black bg-opacity-60 text-lg font-semibold tracking-wide fixed bottom-0 left-0 z-50">
                Product by Amit Gandhi
            </footer>
        </div>
    );
};

export default MaxBidPage;