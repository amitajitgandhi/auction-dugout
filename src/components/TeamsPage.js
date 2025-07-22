import React from "react";
import { exportTeamsData, EMOJIS } from "../utils/constants";
import { WHATSAPP_EMOJIS } from "../utils/whatsappUtils";

const TeamsPage = ({ 
    teams, 
    players, 
    tournamentName, 
    onExportTeams, 
    onResetAuction, 
    onBackToAuction,
    showManagedToast,
    onWhatsAppSettings,
    onTeamWhatsAppShare,
    whatsappSettings
}) => {
    const handleExportTeams = () => {
        try {
            exportTeamsData(teams, tournamentName);
            showManagedToast('success', 'Teams data exported successfully! The file is optimized for Excel and other spreadsheet applications.', {
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
        } catch (error) {
            showManagedToast('error', 'Failed to export teams data. Please try again.', {
                style: {
                    border: '2px solid #f59e42',
                    padding: '16px',
                    color: '#b91c1c',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    background: 'linear-gradient(90deg, #fffbe6 0%, #ffe4e6 100%)',
                    boxShadow: '0 4px 24px 0 #fbbf24',
                },
                icon: EMOJIS.CROSS_MARK,
                duration: 4000,
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 bg-fixed relative overflow-x-hidden">
            {/* Tournament Name Ticker */}
            <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white py-2 shadow-lg">
                <div className="overflow-hidden whitespace-nowrap">
                    <div className="animate-marquee inline-block font-bold text-lg">
                        {EMOJIS.TROPHY} {tournamentName.toUpperCase()} - TEAMS OVERVIEW {EMOJIS.TROPHY}
                    </div>
                </div>
            </div>

            <div className="pt-16 pb-20 px-4">
                <div className="w-full max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                            {EMOJIS.TROPHY} Teams Summary
                        </h1>
                        <p className="text-gray-300 text-lg">Complete overview of all teams squad and budget</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mb-8 flex flex-col sm:flex-row justify-center gap-3 max-w-2xl mx-auto">
                        <button
                            onClick={onBackToAuction}
                            className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-3 py-3 rounded-lg font-semibold shadow-md hover:from-violet-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 flex items-center justify-center gap-2 text-sm min-h-[44px]"
                        >
                            <span>{EMOJIS.BACK_ARROW}</span>
                            Back to Auction
                        </button>
                        <button
                            onClick={handleExportTeams}
                            className={`flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-3 py-3 rounded-lg font-semibold shadow-md hover:from-blue-600 hover:to-cyan-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-center gap-2 text-sm min-h-[44px] ${
                                Object.keys(teams).length === 0 || Object.values(teams).every(team => team.players.length === 0) 
                                ? 'export-button-disabled' 
                                : ''
                            }`}
                            disabled={Object.keys(teams).length === 0 || Object.values(teams).every(team => team.players.length === 0)}
                        >
                            <span>{EMOJIS.CHART}</span>
                            Export Teams
                        </button>
                        <button
                            onClick={onWhatsAppSettings}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-3 rounded-lg font-semibold shadow-md hover:from-green-600 hover:to-emerald-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 flex items-center justify-center gap-2 text-sm min-h-[44px]"
                        >
                            <span>{EMOJIS.MOBILE}</span>
                            WhatsApp
                        </button>
                        <button
                            onClick={onResetAuction}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-3 rounded-lg font-semibold shadow-md hover:from-red-600 hover:to-red-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center justify-center gap-2 text-sm min-h-[44px]"
                        >
                            <span>{EMOJIS.REFRESH}</span>
                            Reset Auction
                        </button>
                    </div>

                    {/* Teams Grid */}
                    {Object.keys(teams).length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {Object.entries(teams).map(([teamName, data]) => (
                                <div
                                    key={teamName}
                                    className="border-2 border-indigo-200 p-6 rounded-3xl shadow-xl hover:scale-102 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                                    style={{
                                        background: `linear-gradient(145deg, 
                                            rgba(255, 255, 255, 0.98) 0%, 
                                            rgba(248, 250, 252, 0.95) 50%, 
                                            rgba(241, 245, 249, 0.9) 100%)`,
                                        boxShadow: `0 20px 40px -10px rgba(99, 102, 241, 0.1), 
                                                   0 0 0 1px rgba(165, 180, 252, 0.1), 
                                                   inset 0 1px 0 rgba(255, 255, 255, 0.6)`
                                    }}
                                >
                                    {/* Subtle corner accents */}
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-3xl opacity-40"></div>
                                    <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-purple-100 to-transparent rounded-tr-3xl opacity-30"></div>
                                    
                                    {/* Single cricket bat icon only */}
                                    
                                    <div className="relative z-10">
                                        {/* Team Name Section */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                {/* Team Name - Left aligned and single line */}
                                                <div className="flex-1 text-left pr-2">
                                                    <h3 className="font-bold text-xl text-slate-700 flex items-center justify-start gap-2 whitespace-nowrap overflow-hidden">
                                                        <span className="text-lg">{EMOJIS.CRICKET_BAT}</span>
                                                        <span className="truncate">{teamName}</span>
                                                    </h3>
                                                </div>
                                                {/* WhatsApp Share Button for each team - smaller size */}
                                                {whatsappSettings && whatsappSettings.enabled && whatsappSettings.groupNumber && (
                                                    <button
                                                        onClick={() => onTeamWhatsAppShare(teamName, data)}
                                                        className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 flex-shrink-0"
                                                        title={`Share ${teamName} details to WhatsApp`}
                                                    >
                                                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"/>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                            {/* Owner Name - Left aligned */}
                                            <div className="text-left">
                                                <p className="text-slate-500 flex items-center justify-start gap-2 text-sm">
                                                    <span className="text-xs">{EMOJIS.PERSON}</span>
                                                    <span className="font-medium">Owner:</span> 
                                                    <span className="text-slate-700 font-semibold">{data.owner}</span>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Financial Stats - Distinct Blue Card */}
                                        <div className="mb-5 p-4 rounded-2xl border border-blue-200" style={{
                                            background: `linear-gradient(135deg, 
                                                rgba(219, 234, 254, 0.8) 0%, 
                                                rgba(191, 219, 254, 0.6) 50%, 
                                                rgba(147, 197, 253, 0.4) 100%)`,
                                            boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.3)`
                                        }}>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-blue-600 text-lg">{EMOJIS.MONEY_BAG}</span>
                                                        <span className="font-semibold text-blue-800">Remaining Purse</span>
                                                    </div>
                                                    <span className="font-bold text-emerald-600 text-lg">{EMOJIS.CURRENCY_RUPEE}{data.purse.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-orange-500 text-lg">{EMOJIS.TARGET}</span>
                                                        <span className="font-semibold text-blue-800">Players to Buy</span>
                                                    </div>
                                                    <span className="font-bold text-orange-600 text-lg">{data.playersToBuy}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Squad Section - Distinct Green Theme */}
                                        {data.players.length > 0 ? (
                                            <div>
                                                <div className="mb-3 p-3 rounded-xl border border-emerald-200" style={{
                                                    background: `linear-gradient(135deg, 
                                                        rgba(209, 250, 229, 0.7) 0%, 
                                                        rgba(167, 243, 208, 0.5) 100%)`
                                                }}>
                                                    <h4 className="font-bold text-emerald-700 text-center flex items-center justify-center gap-2">
                                                        <span className="text-sm">{EMOJIS.PEOPLE}</span>
                                                        Squad ({data.players.length} players)
                                                    </h4>
                                                </div>
                                                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                                                    {data.players.map((p, idx) => (
                                                        <div key={idx} className="p-3 rounded-xl border border-gray-200" style={{
                                                            background: `linear-gradient(135deg, 
                                                                rgba(255, 255, 255, 0.9) 0%, 
                                                                rgba(249, 250, 251, 0.8) 100%)`,
                                                            boxShadow: `0 2px 4px rgba(0, 0, 0, 0.05)`
                                                        }}>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-semibold text-gray-800 flex items-center gap-1 text-sm">
                                                                    <span className="text-xs">{EMOJIS.PERSON}</span>
                                                                    {p.name}
                                                                </span>
                                                                <span className="text-emerald-600 font-bold px-2 py-1 rounded-lg text-xs" style={{
                                                                    background: `rgba(209, 250, 229, 0.8)`,
                                                                    border: `1px solid rgba(52, 211, 153, 0.2)`
                                                                }}>
                                                                    {EMOJIS.CURRENCY_RUPEE}{p.soldPrice.toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-600 flex items-center gap-2">
                                                                <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">{EMOJIS.SOCCER_BALL} {p.skill}</span>
                                                                {p.category && (
                                                                    <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{EMOJIS.CLIPBOARD} {p.category}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 p-4 rounded-xl border border-gray-200" style={{
                                                background: `linear-gradient(135deg, 
                                                    rgba(243, 244, 246, 0.6) 0%, 
                                                    rgba(249, 250, 251, 0.8) 100%)`
                                            }}>
                                                <div className="text-4xl mb-3 opacity-40">{EMOJIS.MAILBOX}</div>
                                                <p className="text-gray-600 font-medium">No players yet</p>
                                                <p className="text-gray-500 text-sm mt-1">Start bidding to build your squad!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">{EMOJIS.MAILBOX}</div>
                            <h3 className="text-2xl font-bold text-gray-300 mb-2">No Teams Available</h3>
                            <p className="text-gray-400">Upload team data to see the summary here.</p>
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

export default TeamsPage;