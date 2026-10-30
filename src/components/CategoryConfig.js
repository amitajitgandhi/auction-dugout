import React, { useState, useMemo, useEffect } from "react";
import { EMOJIS } from "../utils/constants";

const CategoryConfig = ({ 
    players, 
    teams, 
    tournamentName, 
    tickerDetails = "",
    onStartAuction, 
    onBackToFileUpload,
    showManagedToast,
    categoryConfigs: initialCategoryConfigs = {}
}) => {
    // Get unique categories from players
    const categories = useMemo(() => {
        const cats = new Set(players.map(p => p.category).filter(Boolean));
        return Array.from(cats);
    }, [players]);

    // State for category configurations - retain data when returning from FileUpload
    const [categoryConfigs, setCategoryConfigs] = useState(() => {
        const configs = {};
        categories.forEach(cat => {
            configs[cat] = {
                playersPerCategory: initialCategoryConfigs[cat]?.playersPerCategory || '',
                basePrice: initialCategoryConfigs[cat]?.basePrice || ''
            };
        });
        return configs;
    });

    // Track if configs were restored from backup
    const [configsRestored, setConfigsRestored] = useState(false);

    // Update category configs when categories change (e.g., new data loaded)
    useEffect(() => {
        setCategoryConfigs(prev => {
            const updatedConfigs = { ...prev };
            let hasRestoredData = false;
            
            categories.forEach(cat => {
                if (!updatedConfigs[cat]) {
                    updatedConfigs[cat] = {
                        playersPerCategory: initialCategoryConfigs[cat]?.playersPerCategory || '',
                        basePrice: initialCategoryConfigs[cat]?.basePrice || ''
                    };
                } else {
                    // Update with restored data if available
                    if (initialCategoryConfigs[cat]?.playersPerCategory && 
                        initialCategoryConfigs[cat]?.basePrice) {
                        updatedConfigs[cat] = {
                            playersPerCategory: initialCategoryConfigs[cat].playersPerCategory,
                            basePrice: initialCategoryConfigs[cat].basePrice
                        };
                        hasRestoredData = true;
                    }
                }
            });
            
            // Show notification if configs were restored from backup (only toast, no tile)
            if (hasRestoredData && !configsRestored) {
                setConfigsRestored(true);
                showManagedToast && showManagedToast('success', 'Category configurations restored from backup!', {
                    style: {
                        border: '2px solid #10b981',
                        padding: '16px',
                        color: '#065f46',
                        fontWeight: 'bold',
                        fontSize: '1.05rem',
                        background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
                        boxShadow: '0 4px 24px 0 #10b981',
                    },
                    icon: EMOJIS.GEAR,
                    duration: 4000,
                });
            }
            
            return updatedConfigs;
        });
    }, [categories, initialCategoryConfigs, showManagedToast, configsRestored]);

    // State for confirmation dialog
    const [showStartAuctionConfirmation, setShowStartAuctionConfirmation] = useState(false);

    // Handle input changes
    const handleConfigChange = (category, field, value) => {
        setCategoryConfigs(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
    };

    // Handle back to file upload navigation with current configs
    const handleBackToFileUpload = () => {
        onBackToFileUpload(categoryConfigs);
    };

    // Enhanced validation with specific field error conditions
    const validation = useMemo(() => {
        const totalTeams = Object.keys(teams).length;
        // Use originalPlayersPerTeam instead of playersToBuy to get the original CSV value
        const playersPerTeam = totalTeams > 0 ? Object.values(teams)[0]?.originalPlayersPerTeam || 0 : 0;
        const teamBudget = totalTeams > 0 ? Object.values(teams)[0]?.purse + (Object.values(teams)[0]?.ownerRetainedAt || 0) || Object.values(teams)[0]?.purse || 0 : 0;
        
        let isValid = true;
        let errors = [];
        let fieldErrors = {}; // Track specific visual errors per category and field
        let totalPlayersToBuy = 0;
        let criteriaStatus = {}; // Track criteria status for display

        // Initialize criteria status
        criteriaStatus = {
            allFieldsFilled: true,
            validPlayerCounts: true,
            validPrices: true,
            totalPlayersMatch: true
        };

        // Validate each category
        categories.forEach(cat => {
            const config = categoryConfigs[cat];
            const playersPerCategory = parseInt(config?.playersPerCategory, 10) || 0;
            const basePrice = parseInt(config?.basePrice, 10) || 0;
            const totalPlayersInCategory = players.filter(p => p.category === cat).length;

            fieldErrors[cat] = {
                playersPerCategory: false,
                basePrice: false
            };

            // Check if all fields are filled
            if (!config?.playersPerCategory || !config?.basePrice || 
                isNaN(playersPerCategory) || playersPerCategory <= 0 ||
                isNaN(basePrice) || basePrice <= 0) {
                criteriaStatus.allFieldsFilled = false;
            }

            // Basic validation (for overall validity but not visual highlighting)
            if (isNaN(playersPerCategory) || playersPerCategory <= 0) {
                isValid = false;
                errors.push(`${cat}: Players to buy must be a positive number`);
            }

            if (isNaN(basePrice) || basePrice <= 0) {
                isValid = false;
                errors.push(`${cat}: Base price must be a positive number`);
            }

            // Specific visual validation conditions
            // Highlight Players to Buy field as red ONLY when exceeds total players in category
            if (playersPerCategory <= 0) {
                isValid = false;
                criteriaStatus.validPlayerCounts = false;
                fieldErrors[cat].playersPerCategory = true;
                errors.push(`${cat}: Players to buy (${playersPerCategory}) should be more than 0 in category (${totalPlayersInCategory})`);
            }

            // Highlight Base Price field as red ONLY when exceeds team budget
            if (basePrice > teamBudget) {
                isValid = false;
                criteriaStatus.validPrices = false;
                fieldErrors[cat].basePrice = true;
                errors.push(`${cat}: Base price (${basePrice.toLocaleString()}) cannot exceed team budget (${teamBudget.toLocaleString()})`);
            }

            totalPlayersToBuy += playersPerCategory;
        });

        // Check if sum of players to buy equals players per team from CSV (original value)
        if (totalPlayersToBuy !== playersPerTeam && categories.length > 0) {
            isValid = false;
            criteriaStatus.totalPlayersMatch = false;
            errors.push(`Total players to buy across all categories (${totalPlayersToBuy}) must equal players per team (${playersPerTeam})`);
        }

        return {
            isValid,
            errors,
            fieldErrors,
            totalPlayersToBuy,
            playersPerTeam,
            teamBudget,
            criteriaStatus
        };
    }, [categories, categoryConfigs, players, teams]);

    // Calculate comprehensive summary
    const summary = useMemo(() => {
        const totalPlayers = players.length;
        const totalTeams = Object.keys(teams).length;
        const totalPoints = Object.values(teams).reduce((sum, team) => sum + (team.purse || 0), 0);
        const teamBudget = totalTeams > 0 ? Object.values(teams)[0]?.purse + (Object.values(teams)[0]?.ownerRetainedAt || 0) || Object.values(teams)[0]?.purse || 0 : 0;
        // Use originalPlayersPerTeam instead of playersToBuy to get the original CSV value
        const playersPerTeam = totalTeams > 0 ? Object.values(teams)[0]?.originalPlayersPerTeam || 0 : 0;
        
        // Players with valid photos (non-empty photo URLs)
        const playersWithValidPhoto = players.filter(p => p.photo && p.photo.trim() && !p.photo.includes('data:image/svg+xml')).length;
        
        // Players with valid CricHeroes links
        const playersWithCricHeroes = players.filter(p => p.cricHeroesProfile && p.cricHeroesProfile.trim()).length;
        
        // Category breakdown
        const categoryBreakdown = categories.map(cat => {
            const categoryPlayers = players.filter(p => p.category === cat);
            const config = categoryConfigs[cat];
            return {
                category: cat,
                totalPlayers: categoryPlayers.length,
                toBuy: parseInt(config?.playersPerCategory, 10) || 0,
                basePrice: parseInt(config?.basePrice, 10) || 0
            };
        });

        return {
            totalPlayers,
            totalTeams,
            totalPoints,
            teamBudget,
            playersPerTeam,
            playersWithValidPhoto,
            playersWithCricHeroes,
            categoryBreakdown
        };
    }, [players, teams, categories, categoryConfigs]);

    // Handle start auction (show confirmation for category config validation)
    const handleStartAuction = () => {
        if (!validation.isValid) {
            const errorMessage = validation.errors.join('\n\n');
            showManagedToast('error', `Validation Error:\n\n${errorMessage}`, {
                style: {
                    border: '2px solid #ef4444',
                    padding: '16px',
                    color: '#b91c1c',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    background: 'linear-gradient(90deg, #fee2e2 0%, #fecaca 100%)',
                    boxShadow: '0 4px 24px 0 #ef4444',
                    whiteSpace: 'pre-line',
                    maxWidth: '500px'
                },
                icon: EMOJIS.CROSS_MARK,
                duration: 6000,
            });
            return;
        }

        setShowStartAuctionConfirmation(true);
    };

    // Confirm and start auction
    const confirmStartAuction = () => {
        setShowStartAuctionConfirmation(false);
        onStartAuction(categoryConfigs);
    };

    // Get player count for each category
    const getPlayerCountForCategory = (category) => {
        return players.filter(p => p.category === category).length;
    };

    // Render Start Button Criteria component
    const renderStartButtonCriteria = () => (
        <div className="bg-white bg-opacity-95 rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span>{EMOJIS.CLIPBOARD}</span>
                    Start Auction Requirements
                </h3>
                <p className="text-gray-600 text-sm mt-1">Complete all criteria below to enable the START AUCTION button</p>
            </div>
            
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Criterion 1: All Fields Filled */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm}`}>
                            {validation.criteriaStatus.allFieldsFilled ? EMOJIS.CHECK_MARK : EMOJIS.CROSS_MARK}
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">All Fields Completed</p>
                            <p className="text-sm text-gray-600">Players to buy and base price for all categories</p>
                        </div>
                    </div>

                    {/* Criterion 2: Valid Player Counts */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm}`}>
                            {validation.criteriaStatus.validPlayerCounts ? EMOJIS.CHECK_MARK : EMOJIS.CROSS_MARK}
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">Valid Player Counts</p>
                            <p className="text-sm text-gray-600">Players to buy &lt; available players per category</p>
                        </div>
                    </div>

                    {/* Criterion 3: Valid Prices */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm}`}>
                            {validation.criteriaStatus.validPrices ? EMOJIS.CHECK_MARK : EMOJIS.CROSS_MARK}
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">Valid Base Prices</p>
                            <p className="text-sm text-gray-600">Base price &lt; team budget ({EMOJIS.MONEY_BAG}{validation.teamBudget.toLocaleString()})</p>
                        </div>
                    </div>

                    {/* Criterion 4: Total Players Match */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm}`}>
                            {validation.criteriaStatus.totalPlayersMatch ? EMOJIS.CHECK_MARK : EMOJIS.CROSS_MARK}
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">Total Players Match</p>
                            <p className="text-sm text-gray-600">
                                Sum of players to buy = {validation.playersPerTeam} 
                                {validation.totalPlayersToBuy > 0 && ` (Current: ${validation.totalPlayersToBuy})`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overall status indicator */}
                <div className={`mt-4 p-4 rounded-lg text-center font-medium ${
                    validation.isValid 
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                    {validation.isValid ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="text-xl">{EMOJIS.CHECK_MARK}</span>
                            All requirements met! You can start the auction.
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <span className="text-xl">{EMOJIS.CROSS_MARK}</span>
                            Please complete the above requirements to start the auction.
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    // Render Auction Summary component with consistent formatting
    const renderAuctionSummary = () => (
        <div className="space-y-2">
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                <span className="font-medium text-gray-800">Total Players</span>
                <span className="font-bold text-blue-600">{summary.totalPlayers}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                <span className="font-medium text-gray-800">Total Teams</span>
                <span className="font-bold text-purple-600">{summary.totalTeams}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                <span className="font-medium text-gray-800">Players per Team</span>
                <span className="font-bold text-green-600">{summary.playersPerTeam}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                <span className="font-medium text-gray-800">Team Budget</span>
                <span className="font-bold text-green-600">{EMOJIS.CURRENCY_RUPEE}{summary.teamBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                <span className="font-medium text-gray-800">Players with Photos</span>
                <span className="font-bold text-blue-600">{summary.playersWithValidPhoto}/{summary.totalPlayers}</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                <span className="font-medium text-gray-800">CricHeroes Profiles</span>
                <span className="font-bold text-orange-600">{summary.playersWithCricHeroes}/{summary.totalPlayers}</span>
            </div>
        </div>
    );

    // Render Category Summary component
    const renderCategorySummary = () => (
        <div className="border-t pt-4 mt-4">
            <h5 className="font-bold text-gray-800 mb-3">Category Breakdown:</h5>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-800">Category</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-800">Total Players</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-800">Min. Players to Buy</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-800">Base Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summary.categoryBreakdown.map(cat => (
                            <tr key={cat.category} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2 font-medium text-gray-800">{cat.category}</td>
                                <td className="border border-gray-300 px-4 py-2 text-gray-600">{cat.totalPlayers}</td>
                                <td className="border border-gray-300 px-4 py-2 text-blue-600 font-medium">{cat.toBuy}</td>
                                <td className="border border-gray-300 px-4 py-2 text-green-600 font-medium">{EMOJIS.CURRENCY_RUPEE}{parseInt(cat.basePrice || 0).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 bg-fixed relative overflow-x-hidden">
            {/* Tournament Name Ticker */}
            <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white py-2 shadow-lg">
                <div className="overflow-hidden whitespace-nowrap">
                    <div className="animate-marquee inline-block font-bold text-lg">
                        {tickerDetails}
                    </div>
                </div>
            </div>

            <div className="pt-16 pb-20 px-4">
                <div className="w-full max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-6 text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            {EMOJIS.GEAR} Configure Categories
                        </h1>
                        <p className="text-gray-300 text-lg mb-6">Set the number of players to buy and base price for each category</p>
                        
                        {/* Back Button */}
                        <button
                            onClick={handleBackToFileUpload}
                            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:from-gray-600 hover:to-gray-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center gap-3 mx-auto text-lg mb-6"
                        >
                            <span className="text-xl">{EMOJIS.BACK_ARROW}</span>
                            Back to File Upload
                        </button>
                    </div>

                    {/* Start Button Criteria */}
                    {renderStartButtonCriteria()}

                    {/* Category Configuration */}
                    <div className="bg-white bg-opacity-95 rounded-xl shadow-lg overflow-hidden mb-6">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span>{EMOJIS.GEAR}</span>
                                Category Configuration
                            </h3>
                            <p className="text-gray-600 text-sm mt-1">Configure auction settings for each player category</p>
                        </div>
                        
                        <div className="p-6">
                            <div className="space-y-4">
                                {categories.map((category) => (
                                    <div key={category} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
                                            {/* Category Name and Info */}
                                            <div className="lg:col-span-1">
                                                <h4 className="text-lg font-bold text-gray-800">{category}</h4>
                                                <p className="text-sm text-gray-600">
                                                    {getPlayerCountForCategory(category)} players
                                                </p>
                                            </div>
                                            
                                            {/* Players to Buy Input */}
                                            <div className="lg:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Min. Players to Buy
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={getPlayerCountForCategory(category)}
                                                    value={categoryConfigs[category]?.playersPerCategory || ''}
                                                    onChange={(e) => handleConfigChange(category, 'playersPerCategory', e.target.value)}
                                                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                                                        validation.fieldErrors[category]?.playersPerCategory 
                                                            ? 'border-red-500 ring-red-200' 
                                                            : 'border-gray-300'
                                                    }`}
                                                    placeholder="Enter number"
                                                />
                                            </div>
                                            
                                            {/* Base Price Input */}
                                            <div className="lg:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Base Price
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={validation.teamBudget}
                                                    value={categoryConfigs[category]?.basePrice || ''}
                                                    onChange={(e) => handleConfigChange(category, 'basePrice', e.target.value)}
                                                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                                                        validation.fieldErrors[category]?.basePrice 
                                                            ? 'border-red-500 ring-red-200' 
                                                            : 'border-gray-300'
                                                    }`}
                                                    placeholder="Enter base price"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Start Auction Button */}
                    <div className="text-center">
                        <button
                            onClick={handleStartAuction}
                            disabled={!validation.isValid}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-12 py-4 rounded-xl font-bold text-xl shadow-lg hover:from-green-600 hover:to-emerald-700 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3 mx-auto"
                        >
                            <span className="text-2xl">{EMOJIS.TARGET}</span>
                            START AUCTION
                        </button>
                    </div>
                </div>
            </div>

            {/* Start Auction Confirmation Popup (Auction Summary + Category Summary) */}
            {showStartAuctionConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="text-center mb-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <span className="text-4xl">{EMOJIS.TARGET}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Ready to Start Auction?
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Please review the complete auction summary below before starting
                            </p>
                        </div>

                        {/* Complete Summary (Auction + Category) */}
                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span>{EMOJIS.CLIPBOARD}</span>
                                Complete Auction Summary
                            </h4>
                            
                            {/* Auction Summary */}
                            {renderAuctionSummary()}
                            
                            {/* Category Summary */}
                            {renderCategorySummary()}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => setShowStartAuctionConfirmation(false)}
                                className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-2"
                            >
                                <span>{EMOJIS.CROSS_MARK}</span>
                                Cancel
                            </button>
                            <button
                                onClick={confirmStartAuction}
                                className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg flex items-center justify-center gap-2"
                            >
                                <span>{EMOJIS.TARGET}</span>
                                Yes, Start Auction!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="w-full text-center py-4 mt-8 text-white bg-black bg-opacity-60 text-lg font-semibold tracking-wide fixed bottom-0 left-0 z-50">
                Product by Amit Gandhi
            </footer>
        </div>
    );
};

export default CategoryConfig;