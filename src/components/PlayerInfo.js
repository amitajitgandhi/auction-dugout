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
                    {(currentPlayer?.name || 'No Player').toLowerCase().replace(/\b\p{L}/gu, letter => letter.toUpperCase())}
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
            
            <div className="space-y-3">
                <div className="grid grid-cols-2 grid-rows-3 gap-2 text-base sm:text-lg">
                    <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 font-semibold text-gray-700"><span aria-hidden="true">🏏</span><span>{currentPlayer?.skill || "—"}</span></div>
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-800"><span aria-hidden="true">🥎</span><span>{currentPlayer?.bowlingStyle || "—"}</span></div>
                    <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 font-semibold text-purple-800"><span aria-hidden="true">🧤</span><span>{currentPlayer?.wicketkeeper || "—"}</span></div>
                    <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 font-semibold text-rose-800"><span aria-hidden="true">🏆</span><span>{currentPlayer?.category || "—"}</span></div>
                    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-base font-semibold text-blue-700">
                        <img src={cricheroeslogo} alt="CricHeroes" className="h-6 w-6 shrink-0 object-contain" />
                        {currentPlayer?.cricHeroesProfile?.trim() ? (
                            <button type="button" onClick={() => {
                                const profileUrl = currentPlayer?.cricHeroesProfile?.trim();
                                if (!profileUrl) return;
                                const popupWidth = 1000;
                                const popupHeight = 760;
                                const left = Math.max(0, Math.round((window.screen.availWidth - popupWidth) / 2));
                                const top = Math.max(0, Math.round((window.screen.availHeight - popupHeight) / 2));
                                const profileWindow = window.open(
                                    profileUrl,
                                    "auction-dugout-cricheroes-profile",
                                    `popup=yes,width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
                                );
                                if (profileWindow) {
                                    profileWindow.opener = null;
                                    profileWindow.focus();
                                }
                            }} className="truncate underline transition-colors hover:text-blue-900">cricheroes</button>
                        ) : <span> - </span>}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowMaxBidSummary(true)}
                        className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-base font-semibold text-emerald-800 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        title="View team-wise maximum bidding capacity"
                    >
                        <span aria-hidden="true">💰</span><span>Max Bid</span>
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
                                            <th className="w-[24%] whitespace-nowrap px-2 py-3 text-right">Purse Balance</th>
                                            <th className="w-[20%] whitespace-nowrap px-2 py-3 text-right">Players to Buy</th>
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
                                                    <td className="whitespace-nowrap px-2 py-3 text-right font-semibold text-gray-700">{Object.values(team.categoryBreakdown || {}).reduce((total, category) => total + (category.playersRemaining || 0), 0)}</td>
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