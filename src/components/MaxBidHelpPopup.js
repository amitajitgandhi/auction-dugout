import React from "react";
import { EMOJIS } from "../utils/constants";

const MaxBidHelpPopup = ({
    isOpen,
    onClose,
    selectedCategoryForAnalysis
}) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Enhanced Calculation Logic Help Popup */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="text-center mb-6">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
                            <span className="text-3xl">{EMOJIS.GEAR}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            How Max Bid Analysis Works
                        </h3>
                        <p className="text-gray-600">
                            Understanding the smart bidding calculations and constraints
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm mb-6">
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                                <h4 className="text-base font-bold text-blue-800 mb-3 flex items-center gap-2">
                                    <span>{EMOJIS.GEAR}</span>
                                    Points Reservation Logic
                                </h4>
                                <div className="text-blue-700 space-y-2 text-xs">
                                    <div className="bg-white bg-opacity-70 p-2 rounded-lg">
                                        <div className="font-semibold mb-1">Selected Category ({selectedCategoryForAnalysis}):</div>
                                        <div className="text-blue-600">(Remaining Players - 1) * Base Points</div>
                                    </div>
                                    <div className="bg-white bg-opacity-70 p-2 rounded-lg">
                                        <div className="font-semibold mb-1">Other Categories:</div>
                                        <div className="text-blue-600">Remaining Players * Base Points</div>
                                    </div>
                                    <div className="bg-white bg-opacity-70 p-2 rounded-lg">
                                        <div className="font-semibold mb-1">Purpose:</div>
                                        <div className="text-blue-600">Ensures teams can complete mandatory purchases</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
                                <h4 className="text-base font-bold text-green-800 mb-3 flex items-center gap-2">
                                    <span>{EMOJIS.ZAP}</span>
                                    Max Bid Calculation
                                </h4>
                                <div className="text-green-700 space-y-2 text-xs">
                                    <div className="bg-white bg-opacity-70 p-2 rounded-lg text-center">
                                        <div className="font-bold text-green-800 mb-1">Formula</div>
                                        <div className="font-semibold">Max Bid = Available Points - Reserved Points</div>
                                    </div>
                                    <div className="bg-white bg-opacity-70 p-3 rounded-lg">
                                        <div className="font-medium text-green-600">
                                            <span className="font-semibold">Smart Logic:</span> For selected category, reserves (n-1) players
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
                                <h4 className="text-base font-bold text-purple-800 mb-3 flex items-center gap-2">
                                    <span>{EMOJIS.CHART}</span>
                                    Table Column Guide
                                </h4>
                                <div className="text-purple-700 space-y-2 text-xs">
                                    <div className="bg-white bg-opacity-70 p-2 rounded-lg">
                                        <div className="font-semibold mb-1">Bought/Buy:</div>
                                        <div className="text-purple-600">Players owned / Total allowed per category</div>
                                    </div>
                                    <div className="bg-white bg-opacity-70 p-2 rounded-lg">
                                        <div className="font-semibold mb-1">Base Points:</div>
                                        <div className="text-purple-600">Minimum bidding points for each category</div>
                                    </div>
                                    <div className="bg-white bg-opacity-70 p-2 rounded-lg">
                                        <div className="font-semibold mb-1">Max Bid:</div>
                                        <div className="text-purple-600">Maximum points team can bid for selected category</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm">
                                <h4 className="text-base font-bold text-orange-800 mb-3 flex items-center gap-2">
                                    <span>{EMOJIS.STAR}</span>
                                    Smart Features
                                </h4>
                                <div className="text-orange-700 space-y-1 text-xs">
                                    <div className="flex items-start gap-1 bg-white bg-opacity-70 p-2 rounded-lg">
                                        <span className="text-xs mt-0.5">{EMOJIS.ZAP}</span>
                                        <div>
                                            <div className="font-semibold">Real-time Updates</div>
                                            <div className="text-orange-600">Analysis recalculates instantly</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-1 bg-white bg-opacity-70 p-2 rounded-lg">
                                        <span className="text-xs mt-0.5">{EMOJIS.TARGET}</span>
                                        <div>
                                            <div className="font-semibold">Visual Highlighting</div>
                                            <div className="text-orange-600">Selected category highlighted in blue</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simplified Examples Section */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                        <h4 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2 justify-center">
                            <span>{EMOJIS.GEAR}</span>
                            Example Calculation
                        </h4>
                        
                        {/* Base Points Reference */}
                        <div className="mb-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <h5 className="font-semibold text-blue-800 mb-2 text-sm">Sample Base Points:</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-700">
                                <div className="bg-white p-2 rounded">PLATINUM: 1,500</div>
                                <div className="bg-white p-2 rounded">GOLD: 1,000</div>
                                <div className="bg-white p-2 rounded">SILVER: 500</div>
                                <div className="bg-white p-2 rounded">BRONZE: 200</div>
                            </div>
                        </div>

                        {/* Single Positive Example */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <h5 className="font-semibold text-green-800 mb-2 text-sm flex items-center gap-2">
                                <span>{EMOJIS.CHECK_MARK}</span>
                                Team XX Status
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="font-semibold text-blue-800 mb-1">Team Status</div>
                                    <div className="space-y-1 text-gray-700">
                                        <div className="font-medium">Available Points: 8,000</div>
                                        <div className="border-t pt-1 mt-1">
                                            <div className="text-blue-600 font-medium">Requirements:</div>
                                            <div>PLATINUM (selected): Need 2 more</div>
                                            <div>GOLD: Need 2 more</div>
                                            <div>SILVER: Need 2 more</div>
                                            <div>BRONZE: Need 0 more</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="font-semibold text-orange-800 mb-1">Reserved Calculation</div>
                                    <div className="space-y-1 text-gray-700">
                                        <div className="text-orange-600 font-medium mb-1">Per Category:</div>
                                        <div>PLATINUM: (2-1) * 1,500 = 1,500</div>
                                        <div>GOLD: 2 * 1,000 = 2,000</div>
                                        <div>SILVER: 2 * 500 = 1,000</div>
                                        <div>BRONZE: 0 * 200 = 0</div>
                                        <div className="font-semibold text-orange-600 pt-1 border-t mt-1">
                                            Total Reserved: 4,500
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="font-semibold text-green-800 mb-1">Max Bid Result</div>
                                    <div className="space-y-1 text-gray-700">
                                        <div>Available Points: 8,000</div>
                                        <div>Total Reserved: 4,500</div>
                                        <div className="font-semibold text-green-600 pt-1 border-t mt-1 flex items-center gap-1">
                                            <span>{EMOJIS.CHECK_MARK}</span>
                                            Max Bid: 3,500
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 bg-green-50 p-2 rounded">
                                            <strong>Result:</strong> Team can bid up to 3,500 points for PLATINUM player
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Explanation for (2-1) calculation */}
                            <div className="mt-2 bg-blue-50 p-2 rounded border border-blue-200">
                                <div className="text-xs text-blue-700">
                                    <strong>Why (2-1) for PLATINUM?</strong> Since PLATINUM is selected for bidding, we reserve points for only 1 remaining player (2-1=1), allowing the team to bid above base price for the current player.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Close Button */}
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={onClose}
                            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            <span>{EMOJIS.CHECK_MARK}</span>
                            Got it!
                        </button>
                    </div>
                </div>
            </div>

            {/* Click outside to close help popup */}
            <div 
                className="fixed inset-0 z-40" 
                onClick={onClose}
            ></div>
        </>
    );
};

export default MaxBidHelpPopup;