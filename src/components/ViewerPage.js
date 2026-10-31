import React from "react";
import { EMOJIS } from "../utils/constants";
import { useViewerData } from "../hooks/useViewerData";

const ViewerPage = ({ userId }) => {
    const {
        teams,
        tournamentName,
        sponsorName,
        tickerDetails,
        selectedCategory,
        currentPlayer,
        categoryStats,
        progress,
        auctionStarted,
        loading,
        hasData,
        error,
        lastUpdated
    } = useViewerData(userId);

    // Viewer calculations are already prepared server-side in the compact snapshot.
    const catSoldCount = categoryStats.sold || 0;
    const catUnsoldCount = categoryStats.unsold || 0;
    const catRemainingCount = categoryStats.remaining || 0;

    const totalPlayers = progress.total || 0;
    const totalSold = progress.sold || 0;
    const totalUnsold = progress.unsold || 0;
    const totalRemaining = progress.remaining || 0;
    const progressPercent = progress.percentage || 0;

    const toTitleCase = (str) => {
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatLastUpdated = () => {
        if (!lastUpdated) return '';
        return new Date(lastUpdated).toLocaleTimeString();
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <div className="text-white text-lg font-semibold">Loading Auction Data...</div>
                    <div className="text-gray-400 text-sm mt-2">Connecting to live auction</div>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error && !hasData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center max-w-md mx-4">
                    <div className="text-6xl mb-4">{EMOJIS.WARNING}</div>
                    <h2 className="text-2xl font-bold text-white mb-3">Unable to Load Auction</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <p className="text-gray-500 text-sm">Please check that the viewer link is correct and the auction is active.</p>
                </div>
            </div>
        );
    }

    // --- Main Viewer ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 bg-fixed relative overflow-x-hidden">
            {/* Custom ticker — same colors, position, and marquee animation as the auction screen */}
            {tickerDetails.trim() && <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white py-2 shadow-lg">
                <div className="overflow-hidden whitespace-nowrap"><div className="animate-marquee inline-block font-bold text-lg">{tickerDetails}</div></div>
            </div>}
            <div className="text-center pt-4 px-4 pb-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide text-white">{tournamentName || "AUCTION"}</h1>
                {sponsorName.trim() && <div className="mt-1 text-lg font-semibold text-yellow-300">Sponsored by {sponsorName}</div>}
            </div>

            {/* LIVE Indicator */}
            <div className={`fixed ${tickerDetails.trim() ? "top-14" : "top-2"} right-2 z-50`}>
                <div className="flex items-center gap-1.5 bg-black bg-opacity-70 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-bold">LIVE</span>
                </div>
            </div>

            <div className="pb-16 px-3">
                <div className="max-w-lg mx-auto text-center text-gray-200 text-sm md:text-base font-bold mb-3">
                    🔄 This page refreshes automatically every 30 seconds
                </div>
                {error && hasData && (
                    <div role="status" className="max-w-lg mx-auto mb-3 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        Connection issue — showing the last successfully loaded auction data. Automatic refresh will retry.
                    </div>
                )}
                <div className="w-full max-w-lg mx-auto">

                    {/* Current Player Section */}
                    {auctionStarted && selectedCategory ? (
                        <div className="mb-4">
                            {/* Category & Stats Bar — Compact for mobile */}
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-md p-2.5 mb-3">
                                <div className="text-center mb-1.5">
                                    <span className="text-sm font-bold opacity-90">{EMOJIS.CLIPBOARD} {selectedCategory}</span>
                                </div>
                                <div className="flex items-center justify-center gap-4 text-xs">
                                    <div className="flex items-center gap-1">
                                        <span className="text-green-300">{EMOJIS.CHECK_MARK}</span>
                                        <span className="font-bold">{catSoldCount}</span>
                                        <span className="opacity-75">Sold</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-red-300">{EMOJIS.CROSS_MARK}</span>
                                        <span className="font-bold">{catUnsoldCount}</span>
                                        <span className="opacity-75">Unsold</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-blue-300">{EMOJIS.PEOPLE}</span>
                                        <span className="font-bold">{catRemainingCount}</span>
                                        <span className="opacity-75">Left</span>
                                    </div>
                                </div>
                            </div>

                            {/* Current Player Card — Mobile-first, no photo */}
                            {currentPlayer ? (
                                <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in">
                                    {/* NOW AUCTIONING banner */}
                                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-center py-1.5 px-3">
                                        <span className="text-xs font-bold tracking-wider flex items-center justify-center gap-1.5">
                                            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                            {EMOJIS.TARGET} NOW AUCTIONING
                                        </span>
                                    </div>

                                    <div className="p-4">
                                        {/* Player Name — Large and prominent */}
                                        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                                            {currentPlayer.name || 'Unknown Player'}
                                        </h2>

                                        {/* Skill & Category — Inline badges */}
                                        <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                                {EMOJIS.SOCCER_BALL} {currentPlayer.skill}
                                            </span>
                                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                                {EMOJIS.CLIPBOARD} {currentPlayer.category}
                                            </span>
                                        </div>

                                        {/* Drive Link — Clickable (Disabled for now; uncomment to enable in future) */}
                                        {/*
                                        {currentPlayer.driveLink && (
                                            <div className="text-center mb-3">
                                                <a
                                                    href={currentPlayer.driveLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    📷 View Player Photo
                                                </a>
                                            </div>
                                        )}
                                        */}

                                        {/* CricHeroes Link */}
                                        {currentPlayer.cricHeroesProfile && (
                                            <div className="text-center mb-3">
                                                <a
                                                    href={currentPlayer.cricHeroesProfile}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    🏏 CricHeroes Profile
                                                </a>
                                            </div>
                                        )}

                                        {/* Sold/Unsold Status */}
                                        {currentPlayer.sold && currentPlayer.soldTo !== 'Unsold' && (
                                            <div className="bg-green-50 border border-green-300 rounded-lg p-2.5 text-center">
                                                <div className="text-green-700 font-bold text-sm animate-pulse">
                                                    {EMOJIS.CHECK_MARK} SOLD to {currentPlayer.soldTo} for {EMOJIS.CURRENCY_RUPEE}{currentPlayer.soldPrice?.toLocaleString()}
                                                </div>
                                            </div>
                                        )}
                                        {currentPlayer.soldTo === 'Unsold' && (
                                            <div className="bg-red-50 border border-red-300 rounded-lg p-2.5 text-center">
                                                <div className="text-red-700 font-bold text-sm animate-pulse">
                                                    {EMOJIS.CROSS_MARK} UNSOLD
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white bg-opacity-90 rounded-xl shadow-lg p-6 text-center">
                                    <div className="text-4xl mb-3 animate-pulse">{EMOJIS.TARGET}</div>
                                    <h3 className="text-lg font-bold text-gray-700 mb-1">Waiting for Next Player...</h3>
                                    <p className="text-gray-500 text-sm">The auctioneer is preparing the next player</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Auction Not Started or No Category Selected — but not when auction is fully done */
                        totalRemaining > 0 || !auctionStarted ? (
                            <div className="mb-4 bg-white bg-opacity-90 rounded-xl shadow-lg p-6 text-center">
                                <div className="text-5xl mb-3">{EMOJIS.CRICKET_BAT}</div>
                                <h3 className="text-xl font-bold text-gray-700 mb-2">
                                    {auctionStarted ? 'Selecting Category...' : 'Auction Has Not Started Yet'}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {auctionStarted
                                        ? 'The auctioneer is selecting a category. Stay tuned!'
                                        : 'The auction will begin shortly. This page will update automatically.'}
                                </p>
                            </div>
                        ) : null
                    )}

                    {/* Auction Completed Banner */}
                    {totalPlayers > 0 && totalRemaining === 0 && (
                        <div className="mb-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-xl shadow-lg p-4 text-center animate-fade-in">
                            <div className="text-3xl mb-1">{EMOJIS.TROPHY}</div>
                            <h3 className="text-lg font-extrabold text-white tracking-wide">Auction Completed!</h3>
                            <p className="text-white text-xs opacity-90 mt-1">All {totalPlayers} players have been auctioned</p>
                        </div>
                    )}

                    {/* Overall Progress — Compact */}
                    {totalPlayers > 0 && (
                        <div className="mb-4 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-3 shadow-lg">
                            <h3 className="text-white font-bold text-sm mb-2 text-center">{EMOJIS.CHART} Auction Progress</h3>
                            <div className="flex justify-center gap-5">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-yellow-400">{totalPlayers}</div>
                                    <div className="text-gray-400 text-xs">Total</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-green-400">{totalSold}</div>
                                    <div className="text-gray-400 text-xs">Sold</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-red-400">{totalUnsold}</div>
                                    <div className="text-gray-400 text-xs">Unsold</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-blue-400">{totalRemaining}</div>
                                    <div className="text-gray-400 text-xs">Left</div>
                                </div>
                            </div>
                            <div className="mt-2 bg-gray-600 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <div className="text-center mt-1">
                                <span className="text-gray-400 text-xs">{progressPercent}%</span>
                            </div>
                        </div>
                    )}

                    {/* Teams Summary — Mobile-optimized cards */}
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-white mb-3 text-center">
                            {EMOJIS.PEOPLE} Teams
                        </h2>

                        {Object.keys(teams).length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(teams).map(([teamName, data]) => (
                                    <div
                                        key={teamName}
                                        className="bg-white rounded-xl shadow-md overflow-hidden"
                                    >
                                        {/* Team Header */}
                                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-2 border-b border-indigo-100">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-sm text-slate-700 flex items-center gap-1.5 truncate">
                                                    {EMOJIS.CRICKET_BAT}
                                                    <span className="truncate" title={teamName}>{teamName}</span>
                                                </h3>
                                                <span className="text-xs text-slate-500 flex-shrink-0">
                                                    {EMOJIS.PERSON} {data.owner}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="px-3 py-2">
                                            {/* Points Left */}
                                            <div className="flex items-center text-xs mb-2 gap-1">
                                                <span className="text-gray-500">{EMOJIS.CURRENCY_RUPEE}Left:</span>
                                                <span className="font-bold text-emerald-600">{(data.purse || 0).toLocaleString()}</span>
                                            </div>

                                            {/* Squad List — Compact */}
                                            {data.players && data.players.length > 0 ? (
                                                <div>
                                                    <div className="text-xs font-bold text-emerald-700 mb-1 flex items-center gap-1">
                                                        {EMOJIS.PEOPLE} Squad ({data.players.length})
                                                    </div>
                                                    <div className="space-y-0.5 max-h-36 overflow-y-auto">
                                                        {data.players.map((p, idx) => (
                                                            <div key={idx} className="flex items-center justify-between py-0.5 px-1 rounded text-xs">
                                                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                                                    <span className="text-gray-400">{idx + 1}.</span>
                                                                    <span className="font-medium text-gray-800 truncate" title={p.name}>
                                                                        {toTitleCase(p.name)}
                                                                    </span>
                                                                    {p.category && (
                                                                        <span className="text-purple-500 bg-purple-50 px-1 rounded text-xs flex-shrink-0">
                                                                            {p.category}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-emerald-600 font-bold flex-shrink-0 ml-2">
                                                                    {EMOJIS.CURRENCY_RUPEE}{(p.soldPrice || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-2">
                                                    <p className="text-gray-400 text-xs">No players yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="text-3xl mb-2 opacity-40">{EMOJIS.MAILBOX}</div>
                                <p className="text-gray-400 text-sm">No teams data available yet</p>
                            </div>
                        )}
                    </div>

                    {/* Last updated timestamp */}
                    {lastUpdated && (
                        <div className="text-center mb-2">
                            <span className="text-gray-500 text-xs">Updated: {formatLastUpdated()}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="fixed bottom-0 left-0 w-full text-center text-xs font-semibold text-white py-1.5 bg-black shadow z-50" style={{ letterSpacing: '0.5px' }}>
                {EMOJIS.CRICKET_BAT} Auction Dugout | Powered by{' '}
                <a href="https://www.linkedin.com/in/amitajitgandhi/" className="underline hover:text-yellow-400" target="_blank" rel="noopener noreferrer">Amit Gandhi</a>
            </footer>
        </div>
    );
};

export default ViewerPage;
