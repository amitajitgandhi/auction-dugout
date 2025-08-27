import React, { Fragment } from "react";
import { EMOJIS } from "../utils/constants";

const MaxBidAnalysisTable = ({
    sortedTeams,
    availableCategories,
    selectedCategoryForAnalysis,
    onCategoryChange,
    onShowCalculationHelp
}) => {
    return (
        <div className="bg-white bg-opacity-95 rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="text-2xl">{EMOJIS.CHART}</span>
                            Team Bidding Analysis
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold ml-2">
                                {sortedTeams.length} Teams
                            </span>
                        </h3>
                        <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
                            <span>{EMOJIS.GEAR}</span>
                            Complete financial breakdown with smart bidding recommendations
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Category Selection Dropdown */}
                        <div className="flex items-center gap-2 bg-white rounded-lg p-2 shadow-sm border border-orange-200">
                            <span className="text-orange-600">{EMOJIS.TARGET}</span>
                            <label className="text-xs font-semibold text-gray-700">Category:</label>
                            <select
                                value={selectedCategoryForAnalysis}
                                onChange={(e) => onCategoryChange(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-400 text-xs font-medium min-w-24"
                            >
                                {availableCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* How it Works Button */}
                        <button
                            onClick={onShowCalculationHelp}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105"
                            title="Show calculation help"
                        >
                            <span>{EMOJIS.GEAR}</span>
                            How it Works
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10 border-r border-gray-300">
                                <div className="flex items-center gap-2">
                                    <span>{EMOJIS.TROPHY}</span>
                                    Team
                                </div>
                            </th>
                            {availableCategories.map(category => (
                                <th key={category} className="px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300" colSpan="3">
                                    <div className="p-2 rounded-lg">
                                        <div className="font-bold">{category}</div>
                                        {category === selectedCategoryForAnalysis && (
                                            <div className="text-xs mt-1 flex items-center justify-center gap-1">
                                                <span>{EMOJIS.TARGET}</span>
                                                Selected
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                                <div className="flex items-center justify-center gap-1">
                                    <span>{EMOJIS.CURRENCY_RUPEE}</span>
                                    Available
                                </div>
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-300">
                                <div className="flex items-center justify-center gap-1">
                                    <span>{EMOJIS.STAR}</span>
                                    Reserved
                                </div>
                            </th>
                            <th className="px-4 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <span>{EMOJIS.ZAP}</span>
                                    Max Bid
                                </div>
                            </th>
                        </tr>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 sticky left-0 bg-gray-100 z-10 border-r border-gray-300">
                                Owner
                            </th>
                            {availableCategories.map(category => (
                                <Fragment key={category}>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-600">Bought/Buy</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-600">Base Price</th>
                                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-600 border-r border-gray-300">Reserved</th>
                                </Fragment>
                            ))}
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 border-r border-gray-300">Points</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 border-r border-gray-300">Points</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedTeams.map((team, index) => (
                            <tr key={team.teamName} className="hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 transition-all duration-200 group">
                                <td className="px-4 py-4 whitespace-nowrap sticky left-0 bg-white group-hover:bg-gradient-to-r group-hover:from-yellow-50 group-hover:to-amber-50 z-10 border-r border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                            index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                                            index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                            'bg-gradient-to-r from-blue-400 to-blue-600'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-gray-900">{team.teamName}</div>
                                            <div className="text-xs text-gray-500">{team.owner}</div>
                                        </div>
                                    </div>
                                </td>
                                {availableCategories.map(category => {
                                    const catData = team.categoryBreakdown[category];
                                    return (
                                        <Fragment key={category}>
                                            <td className="px-2 py-4 whitespace-nowrap text-center text-xs transition-colors duration-200">
                                                <div className={`font-bold px-2 py-1 rounded-full text-xs ${
                                                    catData.playersBought >= catData.playersAllowed 
                                                        ? 'text-red-600 bg-red-100' 
                                                        : 'text-green-600 bg-green-100'
                                                }`}>
                                                    {catData.playersBought}/{catData.playersAllowed}
                                                </div>
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap text-center text-xs transition-colors duration-200">
                                                <div className="text-gray-700 font-medium">
                                                    {EMOJIS.CURRENCY_RUPEE}{catData.basePrice.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-2 py-4 whitespace-nowrap text-center text-xs border-r border-gray-200 transition-colors duration-200">
                                                <div className={`font-bold ${
                                                    catData.pointsReserved > 0 
                                                    ? 'text-gray-500' 
                                                        : 'text-gray-400'
                                                }`}>
                                                    {catData.pointsReserved > 0 ? 
                                                        `${EMOJIS.CURRENCY_RUPEE}${catData.pointsReserved.toLocaleString()}` : 
                                                        '-'
                                                    }
                                                </div>
                                            </td>
                                        </Fragment>
                                    );
                                })}
                                <td className="px-4 py-4 whitespace-nowrap text-center border-r border-gray-200">
                                    <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                        {EMOJIS.CURRENCY_RUPEE}{team.remainingPoints.toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center border-r border-gray-200">
                                    <div className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                        {EMOJIS.CURRENCY_RUPEE}{team.totalReservedPoints.toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                    {/* Enhanced Max Bid Display */}
                                    {team.categoryBreakdown[selectedCategoryForAnalysis]?.playersRemaining > 0 ? (
                                        <div className={`text-sm font-bold px-3 py-2 rounded-lg shadow-sm ${
                                            team.maxBid > 0 
                                                ? 'text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                                                : 'text-red-600 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200'
                                        }`}>
                                            {team.maxBid > 0 ? (
                                                <div className="flex items-center gap-1 justify-center">
                                                    <span>{EMOJIS.ZAP}</span>
                                                    {EMOJIS.CURRENCY_RUPEE}{team.maxBid.toLocaleString()}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 justify-center">
                                                    <span>{EMOJIS.CROSS_MARK}</span>
                                                    Cannot Bid
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-sm font-bold text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 px-3 py-2 rounded-lg shadow-sm">
                                            <div className="flex items-center gap-1 justify-center">
                                                -
                                            </div>
                                        </div>
                                    )}
                                    {!team.canBidForSelectedCategory && team.categoryBreakdown[selectedCategoryForAnalysis]?.playersRemaining > 0 && (
                                        <div className="text-xs text-red-500 mt-1 flex items-center justify-center gap-1">
                                            <span>{EMOJIS.WARNING}</span>
                                            Insufficient Budget
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MaxBidAnalysisTable;