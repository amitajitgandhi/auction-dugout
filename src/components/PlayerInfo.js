import React, { useMemo, useState } from "react";
import { calculateTeamMaxBidAnalysis } from "../utils/maxBidCalculator";
import { EMOJIS } from "../utils/constants";
import cricheroeslogo from '../assets/cricheroes.png';

const PlayerInfo = ({ 
    currentPlayer, 
    showSoldStamp, 
    showUnsoldStamp,
    teams = {},
    players = [],
    categoryConfigs = {},
    selectedCategory = "OPEN",
    onViewMaxBid
}) => {
    const [showMaxBidSummary, setShowMaxBidSummary] = useState(false);
    const summaryCategory = currentPlayer?.category || selectedCategory || "OPEN";
    const summaryTeams = useMemo(() => calculateTeamMaxBidAnalysis({
        teams, players, categoryConfigs, selectedCategoryForAnalysis: summaryCategory
    }).sort((a, b) => b.maxBid - a.maxBid), [teams, players, categoryConfigs, summaryCategory]);
    return (
        <div>
            <div className="relative inline-block">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    {currentPlayer?.name || 'No Player'}
                </h2>
                {/* SOLD Stamp Animation */}
                {showSoldStamp && (
                    <div className="absolute top-0 -right-2 transform translate-x-full z-20">
                        <div className="animate-pulse border-2 border-green-500 text-green-500 bg-transparent px-3 py-1 rounded-full shadow-lg">
                            <div className="flex items-center gap-1">
                                <span className="text-base font-bold">SOLD</span>
                                <span className="text-sm">{EMOJIS.CHECK_MARK}</span>
                            </div>
                        </div>
                    </div>
                )}
                {/* UNSOLD Stamp Animation */}
                {showUnsoldStamp && (
                    <div className="absolute top-0 -right-2 transform translate-x-full z-20">
                        <div className="animate-pulse border-2 border-red-500 text-red-500 bg-transparent px-3 py-1 rounded-full shadow-lg">
                            <div className="flex items-center gap-1">
                                <span className="text-base font-bold">UNSOLD</span>
                                <span className="text-sm">{EMOJIS.CROSS_MARK}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="space-y-2">
                <div className="text-gray-600 flex items-center gap-2 text-lg">
                    <span>{EMOJIS.SOCCER_BALL}</span>
                    <span className="font-medium">Skill:</span>
                    <span>{currentPlayer?.skill}</span>
                </div>
                <div className="text-purple-700 flex items-center gap-2 text-lg">
                    <span>{EMOJIS.CLIPBOARD}</span>
                    <span className="font-medium">Category:</span>
                    <span className="font-semibold">{currentPlayer?.category}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* CricHeroes Profile Link - Optional */}
                    {currentPlayer?.cricHeroesProfile && currentPlayer.cricHeroesProfile.trim() && (
                        <div className="text-blue-600 flex items-center gap-2 text-lg">
                            <img
                                src={cricheroeslogo}
                                alt="CricHeroes"
                                style={{ width: 24, height: 24 }}
                            />
                            <a
                                href={currentPlayer.cricHeroesProfile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-colors duration-200 underline"
                            >
                                <span className="font-bold text-black">cric</span>
                                <span className="font-bold text-red-600">heroes</span>
                            </a>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowMaxBidSummary(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-2 text-sm font-bold text-white shadow-md transition hover:from-amber-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                        title="View team-wise maximum bidding capacity"
                    >
                        💰 Max Bid
                    </button>
                </div>

                {showMaxBidSummary && (
                    <div
                        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"
                        onClick={() => setShowMaxBidSummary(false)}
                        role="presentation"
                    >
                        <section
                            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="max-bid-summary-title"
                            onClick={event => event.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                                <div>
                                    <h3 id="max-bid-summary-title" className="text-lg font-extrabold text-gray-900">💰 MAX BID SUMMARY</h3>
                                    <p className="mt-1 text-xs text-gray-500">Category: {summaryCategory}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowMaxBidSummary(false)}
                                    className="rounded-full p-2 text-gray-500 hover:bg-white hover:text-gray-900"
                                    aria-label="Close Max Bid summary"
                                >✕</button>
                            </div>

                            <div className="overflow-y-auto">
                                <table className="w-full table-fixed text-sm">
                                    <thead className="sticky top-0 bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                                        <tr>
                                            <th className="w-[34%] px-3 py-3 text-left">Team Name</th>
                                            <th className="w-[22%] px-2 py-3 text-right">Remaining Purse</th>
                                            <th className="w-[20%] px-2 py-3 text-right">Players to Buy</th>
                                            <th className="w-[24%] px-3 py-3 text-right">Max Bid</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {summaryTeams.map(team => {
                                            const canBidInCategory = team.categoryBreakdown[summaryCategory]?.playersRemaining > 0;
                                            return (
                                                <tr key={team.teamName} className="hover:bg-amber-50">
                                                    <td className="break-words px-3 py-3 font-semibold text-gray-800">{team.teamName}</td>
                                                    <td className="whitespace-nowrap px-2 py-3 text-right font-medium text-gray-700">₹{team.remainingPoints.toLocaleString("en-IN")}</td>
                                                    <td className="whitespace-nowrap px-2 py-3 text-right font-semibold text-gray-700">{team.categoryBreakdown[summaryCategory]?.playersRemaining ?? 0}</td>
                                                    <td className="whitespace-nowrap px-3 py-3 text-right font-bold text-green-700">{canBidInCategory ? `₹${team.maxBid.toLocaleString("en-IN")}` : "—"}</td>
                                                </tr>
                                            );
                                        })}
                                        {summaryTeams.length === 0 && (
                                            <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">No team data available.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-gray-200 bg-gray-50 p-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowMaxBidSummary(false); onViewMaxBid?.(); }}
                                    className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-bold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700"
                                >
                                    More Details
                                </button>
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* Status Display */}
            {currentPlayer && currentPlayer.sold && (
                <div className="text-green-600 font-bold text-lg mt-3 animate-pulse">
                    SOLD to {currentPlayer.soldTo} for {EMOJIS.CURRENCY_RUPEE}{currentPlayer.soldPrice?.toLocaleString()}
                </div>
            )}
            {currentPlayer && currentPlayer.soldTo === 'Unsold' && (
                <div className="text-red-600 font-bold text-lg mt-3 animate-pulse">UNSOLD</div>
            )}
        </div>
    );
};

export default PlayerInfo;