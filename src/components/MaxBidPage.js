import React, { useState, useMemo } from "react";
import { EMOJIS } from "../utils/constants";
import MaxBidAnalysisTable from "./MaxBidAnalysisTable";
import MaxBidHelpPopup from "./MaxBidHelpPopup";

const MaxBidPage = ({ 
    teams, 
    players, 
    tournamentName, 
    onResetAuction, 
    onBackToAuction,
    showManagedToast,
    onWhatsAppSettings,
    onTeamWhatsAppShare,
    whatsappSettings,
    // New props for proper analysis
    currentPlayer,
    selectedCategory,
    categoryConfigs,
    boosterData // New prop for booster data
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [selectedCategoryForAnalysis, setSelectedCategoryForAnalysis] = useState(currentPlayer?.category || 'OPEN');
    const [showCalculationHelp, setShowCalculationHelp] = useState(false);

    // Get all available categories from category configs
    const availableCategories = useMemo(() => {
        return Object.keys(categoryConfigs || {});
    }, [categoryConfigs]);

    // Helper function to get adjusted purse including booster points
    const getAdjustedPurse = (teamName, teamData) => {
        let adjustedPurse = teamData.purse;
        
        // Add booster points if available
        if (boosterData && boosterData.teamBoosters && boosterData.teamBoosters[teamName]) {
            const teamBooster = boosterData.teamBoosters[teamName];
            if (teamBooster.selected && teamBooster.boosterCount > 0 && boosterData.pointsPerBooster) {
                const boosterPoints = teamBooster.boosterCount * boosterData.pointsPerBooster;
                adjustedPurse += boosterPoints;
            }
        }
        
        return adjustedPurse;
    };

    // Calculate comprehensive team analysis with category-wise breakdown
    const teamAnalysis = useMemo(() => {
        if (Object.keys(teams).length === 0 || Object.keys(categoryConfigs).length === 0) {
            return [];
        }

        return Object.entries(teams).map(([teamName, teamData]) => {
            const remainingPoints = getAdjustedPurse(teamName, teamData);
            let totalReservedPoints = 0;
            const categoryBreakdown = {}

            // Calculate for each category
            availableCategories.forEach(categoryName => {
                const config = categoryConfigs[categoryName];
                const basePrice = parseInt(config?.basePrice, 10) || 0;
                const playersAllowed = parseInt(config?.playersPerCategory, 10) || 0;
                
                // ? FIXED: Count players bought from the actual players array, not teamData.players
                const playersBought = players.filter(p => 
                    (p.category || 'OPEN') === categoryName && 
                    p.soldTo === teamName && 
                    p.sold === true
                ).length;
                
                // Calculate remaining players to buy in this category
                const playersRemaining = Math.max(0, playersAllowed - playersBought);
                
                // Calculate points reserved for this category
                let pointsReserved = 0;
                if (categoryName === selectedCategoryForAnalysis) {
                    // For selected category: (Remaining - 1) * Base Price
                    pointsReserved = Math.max(0, playersRemaining - 1) * basePrice;
                } else {
                    // For other categories: Remaining * Base Price
                    pointsReserved = playersRemaining * basePrice;
                }
                
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

            // Calculate max bid
            const maxBid = Math.max(0, remainingPoints - totalReservedPoints);
            
            // Determine if team can bid for selected category
            const selectedCategoryData = categoryBreakdown[selectedCategoryForAnalysis];
            const canBidForSelectedCategory = selectedCategoryData?.canBuyMore && 
                                           remainingPoints >= selectedCategoryData?.basePrice;

            return {
                teamName,
                owner: teamData.owner,
                remainingPoints,
                totalReservedPoints,
                maxBid,
                categoryBreakdown,
                canBidForSelectedCategory,
                playersToBuy: teamData.playersToBuy
            };
        });
    }, [teams, categoryConfigs, availableCategories, selectedCategoryForAnalysis, boosterData, players]); // ? FIXED: Added players to dependency array

    // Sort teams by highest max bid (default sorting)
    const sortedTeams = useMemo(() => {
        return [...teamAnalysis].sort((a, b) => b.maxBid - a.maxBid);
    }, [teamAnalysis]);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        const eligibleTeams = teamAnalysis.filter(team => team.canBidForSelectedCategory);
        
        return {
            totalTeams: teamAnalysis.length,
            eligibleTeams: eligibleTeams.length,
            ineligibleTeams: teamAnalysis.length - eligibleTeams.length
        };
    }, [teamAnalysis, selectedCategoryForAnalysis]);

    const handleExportMaxBidCSV = () => {
        if (teamAnalysis.length === 0) {
            showManagedToast('error', 'No team data to export!', {
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
        
        // Create header row with dynamic categories
        const headerRow = ['Team Name', 'Owner'];
        availableCategories.forEach(cat => {
            headerRow.push(`${cat} - Bought/Allowed`, `${cat} - Base Price`, `${cat} - Points Reserved`);
        });
        headerRow.push('Remaining Points', 'Total Reserved', 'Max Bid');
        csvRows.push(headerRow.join(','));
        
        // Add data rows
        sortedTeams.forEach((team) => {
            const row = [`"${team.teamName}"`, `"${team.owner}"`];
            
            availableCategories.forEach(cat => {
                const catData = team.categoryBreakdown[cat];
                row.push(`${catData.playersBought}/${catData.playersAllowed}`);
                row.push(catData.basePrice);
                row.push(catData.pointsReserved);
            });
            
            row.push(team.remainingPoints);
            row.push(team.totalReservedPoints);
            row.push(team.maxBid);
            
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${tournamentName}_Category_Analysis_${selectedCategoryForAnalysis}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        showManagedToast('success', 'Category analysis exported successfully!', {
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

    if (availableCategories.length === 0) {
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
                        <h3 className="text-2xl font-bold text-gray-300 mb-2">No Category Configuration</h3>
                        <p className="text-gray-400 mb-6">Configure categories first to see team bidding analysis.</p>
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
                            {/* Export Analysis */}
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
                <div className="w-full max-w-full mx-auto">
                    {/* Enhanced Header Section */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                            {EMOJIS.ZAP} Team Bidding Analysis
                        </h1>
                        <p className="text-gray-300 text-lg mb-6">Smart bidding insights powered by category constraints and budget analysis</p>
                        
                        {/* Back to Auction Button */}
                        <button
                            onClick={onBackToAuction}
                            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8 py-4 rounded-lg font-bold shadow-lg hover:from-violet-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 flex items-center gap-3 mx-auto text-lg mb-8"
                        >
                            <span className="text-xl">{EMOJIS.BACK_ARROW}</span>
                            Back to Auction
                        </button>
                    </div>

                    {/* Max Bid Analysis Table Component */}
                    <MaxBidAnalysisTable
                        sortedTeams={sortedTeams}
                        availableCategories={availableCategories}
                        selectedCategoryForAnalysis={selectedCategoryForAnalysis}
                        onCategoryChange={setSelectedCategoryForAnalysis}
                        onShowCalculationHelp={() => setShowCalculationHelp(true)}
                    />

                    {/* Max Bid Help Popup Component */}
                    <MaxBidHelpPopup
                        isOpen={showCalculationHelp}
                        onClose={() => setShowCalculationHelp(false)}
                        selectedCategoryForAnalysis={selectedCategoryForAnalysis}
                    />
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