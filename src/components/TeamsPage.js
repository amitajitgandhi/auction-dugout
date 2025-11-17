import React, { useState } from "react";
import { exportTeamsData, EMOJIS } from "../utils/constants";
import { WHATSAPP_EMOJIS } from "../utils/whatsappUtils";
import PlayerSpinWheel from "./PlayerSpinWheel";
import JerseyColorAssignment from "./JerseyColorAssignment";
import TeamEditPopup from "./TeamEditPopup";
import WhatsappIcon from "../assets/Whatsapp.png";

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
    whatsappSettings,
    onPlayerEdit,
    onTeamPurseUpdate,
    updateTeamPurse,
    onViewUnsoldPlayers // ...new prop
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showPlayerSpin, setShowPlayerSpin] = useState(false);
    const [showJerseyColor, setShowJerseyColor] = useState(false);
    const [showTeamEdit, setShowTeamEdit] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [editForm, setEditForm] = useState({
        newTeam: '',
        newPrice: 0
    });

    // Helper function to convert text to camelCase
    const toCamelCase = (str) => {
        return str
            .toLowerCase()
            .split(' ')
            .map((word, index) => 
                index === 0 
                    ? word.charAt(0).toUpperCase() + word.slice(1)
                    : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join(' ');
    };

    const getAdjustedPurse = (teamName, teamData) => {
        return teamData.purse;
    };

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
            setShowMenu(false);
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

    const handlePlayerSpin = () => {
        if (Object.keys(teams).length === 0) {
            showManagedToast('error', 'No teams available for Player Spin! Please add teams first.', {
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
                duration: 4000,
            });
            setShowMenu(false);
            return;
        }
        
        setShowPlayerSpin(true);
        setShowMenu(false);
    };

    const handleJerseyColor = () => {
        if (Object.keys(teams).length === 0) {
            showManagedToast('error', 'No teams available for Jersey Color assignment! Please add teams first.', {
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
                duration: 4000,
            });
            setShowMenu(false);
            return;
        }
        
        setShowJerseyColor(true);
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

    const handleEditPlayer = (player, currentTeam) => {
        setEditingPlayer({ ...player, currentTeam });
        setEditForm({
            newTeam: currentTeam,
            newPrice: player.soldPrice
        });
    };

    const handleSavePlayerEdit = () => {
        if (!editForm.newTeam) {
            showManagedToast('error', 'Please select a team!', {
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

        if (editForm.newPrice <= 0) {
            showManagedToast('error', 'Price must be greater than 0!', {
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

        setShowConfirmation(true);
    };

    const handleConfirmUpdate = () => {
        if (onPlayerEdit) {
            onPlayerEdit(editingPlayer, editForm.newTeam, parseInt(editForm.newPrice));
        }

        const actionMessage = editingPlayer.currentTeam !== editForm.newTeam 
            ? `Player "${editingPlayer.name}" transferred to ${editForm.newTeam}!`
            : `Player "${editingPlayer.name}" price updated!`;

        showManagedToast('success', actionMessage, {
            style: {
                border: '2px solid #10b981',
                padding: '16px',
                color: '#065f46',
                fontWeight: 'bold',
                fontSize: '1.05rem',
                background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
                boxShadow: '0 4px 24px 0 #10b981',
            },
            icon: EMOJIS.CHECK_MARK,
            duration: 3000,
        });

        setEditingPlayer(null);
        setEditForm({ newTeam: '', newPrice: 0 });
        setShowConfirmation(false);
    };

    const handleCancelConfirmation = () => {
        setShowConfirmation(false);
    };

    const handleCancelEdit = () => {
        setEditingPlayer(null);
        setEditForm({ newTeam: '', newPrice: 0 });
        setShowConfirmation(false);
    };

    const handleTeamEdit = () => {
        if (Object.keys(teams).length === 0) {
            showManagedToast('error', 'No teams available for editing! Please add teams first.', {
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
                duration: 4000,
            });
            setShowMenu(false);
            return;
        }
        
        setShowTeamEdit(true);
        setShowMenu(false);
    };

    const handleViewUnsoldPlayers = () => {
        if (onViewUnsoldPlayers) {
            onViewUnsoldPlayers();
            setShowMenu(false);
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
                            {/* Unsold Players navigation */}
                            <button
                                onClick={handleViewUnsoldPlayers}
                                className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors duration-200 flex items-center gap-3"
                            >
                                <span className="text-red-500">{EMOJIS.CROSS_MARK}</span>
                                <span className="text-gray-700 font-medium">Unsold Players</span>
                            </button>

                            {/* Edit Balance - First Option */}
                            <button
                                onClick={handleTeamEdit}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-200 flex items-center gap-3"
                            >
                                <span className="text-blue-500">{EMOJIS.EDIT}</span>
                                <span className="text-gray-700 font-medium">Edit Balance</span>
                            </button>

                            {/* Export Teams */}
                            <button
                                onClick={handleExportTeams}
                                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-200 flex items-center gap-3 ${
                                    Object.keys(teams).length === 0 || Object.values(teams).every(team => (team.players || []).length === 0) 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : ''
                                }`}
                                disabled={Object.keys(teams).length === 0 || Object.values(teams).every(team => (team.players || []).length === 0)}
                            >
                                <span className="text-blue-500">{EMOJIS.CHART}</span>
                                <span className="text-gray-700 font-medium">Export Teams</span>
                            </button>

                            {/* Player Spin */}
                            <button
                                onClick={handlePlayerSpin}
                                className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors duration-200 flex items-center gap-3"
                            >
                                <span className="text-purple-500">{EMOJIS.SPINWHEEL}</span>
                                <span className="text-gray-700 font-medium">Player Spin</span>
                            </button>

                            {/* Jersey Color */}
                            <button
                                onClick={handleJerseyColor}
                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors duration-200 flex items-center gap-3"
                            >
                                <span className="text-indigo-500">{EMOJIS.JERSEY}</span>
                                <span className="text-gray-700 font-medium">Jersey Color</span>
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

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300">
                        <div className="text-center mb-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                                <span className="text-4xl">{EMOJIS.WARNING}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Changes</h3>
                            <p className="text-gray-600">
                                Are you sure you want to update the player details?
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="text-sm text-gray-600 space-y-2">
                                <div><strong>Player:</strong> {editingPlayer?.name}</div>
                                <div><strong>From Team:</strong> {editingPlayer?.currentTeam}</div>
                                <div><strong>To Team:</strong> {editForm.newTeam}</div>
                                <div><strong>New Price:</strong> {EMOJIS.CURRENCY_RUPEE}{parseInt(editForm.newPrice).toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelConfirmation}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmUpdate}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg"
                            >
                                Confirm Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Player Edit Modal */}
            {editingPlayer && !showConfirmation && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300">
                        <div className="text-center mb-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
                                <span className="text-4xl">{EMOJIS.PENCIL}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Edit Player</h3>
                            <p className="text-gray-600">
                                Update team assignment or sold price for<br/>
                                <strong>{editingPlayer.name}</strong>
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Current Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div><strong>Current Team:</strong> {editingPlayer.currentTeam}</div>
                                    <div><strong>Current Price:</strong> {EMOJIS.CURRENCY_RUPEE}{editingPlayer.soldPrice.toLocaleString()}</div>
                                    <div><strong>Skill:</strong> {editingPlayer.skill}</div>
                                    <div><strong>Category:</strong> {editingPlayer.category}</div>
                                </div>
                            </div>

                            {/* New Team Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Transfer to Team</label>
                                <select
                                    value={editForm.newTeam}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, newTeam: e.target.value }))
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                >
                                    <option value="">Select Team</option>
                                    {Object.keys(teams).map(teamName => (
                                        <option key={teamName} value={teamName}>{teamName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* New Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Update Sold Price</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={editForm.newPrice}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, newPrice: e.target.value }))
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                    placeholder="Enter new price"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCancelEdit}
                                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePlayerEdit}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-lg"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Edit Popup */}
            <TeamEditPopup
                isOpen={showTeamEdit}
                onClose={() => setShowTeamEdit(false)}
                teams={teams}
                onUpdateTeamPurse={onTeamPurseUpdate}
                showManagedToast={showManagedToast}
            />

            {/* Player Spin Wheel Modal */}
            <PlayerSpinWheel
                teams={teams}
                isOpen={showPlayerSpin}
                onClose={() => setShowPlayerSpin(false)}
                showManagedToast={showManagedToast}
            />

            {/* Jersey Color Assignment Modal */}
            <JerseyColorAssignment
                teams={teams}
                isOpen={showJerseyColor}
                onClose={() => setShowJerseyColor(false)}
                showManagedToast={showManagedToast}
                whatsappSettings={whatsappSettings}
                onTeamWhatsAppShare={onTeamWhatsAppShare}
                tournamentName={tournamentName}
            />

            <div className="pt-16 pb-20 px-4">
                <div className="w-full max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                            {EMOJIS.TROPHY} SQUAD {EMOJIS.TROPHY} 
                        </h1>
                        <p className="text-gray-300 text-lg mb-6">Complete overview of all teams squad and budget</p>
                        
                        {/* Back to Auction Button - Centered below header */}
                        <button
                            onClick={onBackToAuction}
                            className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8 py-4 rounded-lg font-bold shadow-lg hover:from-violet-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 flex items-center gap-3 mx-auto text-lg"
                        >
                            <span className="text-xl">{EMOJIS.BACK_ARROW}</span>
                            Back to Auction
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
                                    {/* Team card content */}
                                    <div className="relative z-10">
                                        {/* Team Name Section */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex-1 text-left pr-2">
                                                    <h3 className="font-bold text-xl text-slate-700 flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                                        <span className="text-lg">{EMOJIS.CRICKET_BAT}</span>
                                                        <span className="truncate" title={teamName}>{teamName}</span>
                                                    </h3>
                                                </div>
                                                {/* WhatsApp share icon button */}
                                                <div className="flex-shrink-0">
                                                    {whatsappSettings?.enabled && whatsappSettings?.groupNumber ? (
                                                        <button
                                                            onClick={() => onTeamWhatsAppShare && onTeamWhatsAppShare(teamName, data, tournamentName)}
                                                            className="text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-full w-9 h-9 flex items-center justify-center shadow-sm transition-all duration-200"
                                                            title={`Share ${teamName} summary on WhatsApp`}
                                                        >
                                                            <img src={WhatsappIcon} alt="WhatsApp" className="w-5 h-5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            disabled
                                                            className="text-gray-400 bg-gray-100 border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center cursor-not-allowed"
                                                            title="Configure WhatsApp settings to enable sharing"
                                                        >
                                                            <img src={WhatsappIcon} alt="WhatsApp" className="w-5 h-5 opacity-50" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-slate-500 flex items-center gap-2 text-sm">
                                                    <span className="text-xs">{EMOJIS.PERSON}</span>
                                                    <span className="font-medium">Owner:</span> 
                                                    <span className="text-slate-700 font-semibold" title={data.owner}>{data.owner}</span>
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Financial Stats */}
                                        <div className="mb-2 p-1 rounded-2xl border border-blue-200" style={{
                                            background: `linear-gradient(135deg, 
                                                rgba(219, 234, 254, 0.8) 0%, 
                                                rgba(191, 219, 254, 0.6) 50%, 
                                                rgba(147, 197, 253, 0.4) 100%)`
                                        }}>
                                            <div className="grid grid-cols-1 gap-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-blue-600 text-lg">{EMOJIS.TROPHY}</span>
                                                        <span className="font-semibold text-blue-800">Total Points</span>
                                                    </div>
                                                    <span className="font-bold text-blue-600 text-lg">{EMOJIS.CURRENCY_RUPEE}{(() => {
                                                        const totalSpent = ((data.players || []).reduce((sum, p) => sum + (p.soldPrice || 0), 0));
                                                        const currentPurse = data.purse || 0;
                                                        const initialPurse = data.initialPurse || (currentPurse + totalSpent);
                                                        return initialPurse.toLocaleString();
                                                    })()}</span>
                                                </div>
                                                
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-emerald-600 text-lg">{EMOJIS.MONEY_BAG}</span>
                                                        <span className="font-semibold text-blue-800">Points Left</span>
                                                    </div>
                                                    <span className="font-bold text-emerald-600 text-lg">{EMOJIS.CURRENCY_RUPEE}{getAdjustedPurse(teamName, data).toLocaleString()}</span>
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
                                        
                                        {/* Squad Section */}
                                        {data.players && data.players.length > 0 ? (
                                            <div>
                                                <div className="mb-2 p-1 rounded-xl border border-emerald-200" style={{
                                                    background: `linear-gradient(135deg, 
                                                        rgba(209, 250, 229, 0.7) 0%, 
                                                        rgba(167, 243, 208, 0.5) 100%)`
                                                }}>
                                                    <h4 className="font-bold text-emerald-700 text-center flex items-center justify-center gap-2">
                                                        <span className="text-sm">{EMOJIS.PEOPLE}</span>
                                                        Squad ({data.players.length} players)
                                                    </h4>
                                                </div>
                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                    {data.players.map((p, idx) => (
                                                        <div key={idx} className="p-2 rounded-xl border border-gray-200 group hover:bg-gray-50 transition-all duration-200">
                                                            <div className="grid grid-cols-12 gap-1 items-center">
                                                                <div className="col-span-4 flex items-center gap-1 min-w-0">
                                                                    <span className="text-xs flex-shrink-0">{EMOJIS.PERSON}</span>
                                                                    <span className="font-semibold text-gray-800 truncate text-sm" title={p.name}>
                                                                        {toCamelCase(p.name.length > 10 ? `${p.name.substring(0, 10)}..` : p.name)}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="col-span-3 text-center">
                                                                    {p.category && (
                                                                        <span className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded text-xs font-medium">
                                                                            {p.category}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="col-span-4 text-right">
                                                                    <span className="text-emerald-600 font-bold px-1 py-0.5 rounded text-xs whitespace-nowrap" style={{
                                                                        background: `rgba(209, 250, 229, 0.8)`,
                                                                        border: `1px solid rgba(52, 211, 153, 0.2)`
                                                                    }}>
                                                                        {EMOJIS.CURRENCY_RUPEE}{p.soldPrice.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="col-span-1 text-center">
                                                                    <button
                                                                        onClick={() => handleEditPlayer(p, teamName)}
                                                                        className="opacity-0 group-hover:opacity-100 p-1 text-white rounded text-xs transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                                                        title="Edit player"
                                                                    >
                                                                        {EMOJIS.PENCIL}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 p-4 rounded-xl border border-gray-200">
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

            {/* Custom CSS for animations */}
            <style jsx>{`
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out;
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default TeamsPage;
