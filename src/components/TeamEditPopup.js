import React, { useState, useEffect } from "react";
import { EMOJIS } from "../utils/constants";

const TeamEditPopup = ({ 
    isOpen, 
    onClose, 
    teams, 
    onUpdateTeamPurse,
    showManagedToast
}) => {
    const [editingTeam, setEditingTeam] = useState(null);
    const [newTotalPoints, setNewTotalPoints] = useState('');

    // Reset state when popup opens/closes
    useEffect(() => {
        if (!isOpen) {
            setEditingTeam(null);
            setNewTotalPoints('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleEditClick = (teamName, currentTotalPoints) => {
        setEditingTeam(teamName);
        setNewTotalPoints(currentTotalPoints.toString());
    };

    const handleSave = () => {
        if (!editingTeam || !newTotalPoints || isNaN(newTotalPoints) || parseFloat(newTotalPoints) < 0) {
            showManagedToast('error', 'Please enter a valid total points amount!', {
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

        const pointsAmount = parseFloat(newTotalPoints);
        const success = onUpdateTeamPurse(editingTeam, pointsAmount);
        
        if (success) {
            showManagedToast('success', `${editingTeam} total points updated to ${EMOJIS.CURRENCY_RUPEE}${pointsAmount.toLocaleString()}!`, {
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
                duration: 4000,
            });
            
            setEditingTeam(null);
            setNewTotalPoints('');
        }
    };

    const handleCancel = () => {
        setEditingTeam(null);
        setNewTotalPoints('');
    };

    const calculateTotalSpent = (teamData) => {
        return (teamData.players || []).reduce((total, player) => total + (player.soldPrice || 0), 0);
    };

    const getInitialPurse = (teamData) => {
        // ? FIXED: Calculate proper initial purse
        const totalSpent = calculateTotalSpent(teamData);
        const currentPurse = teamData.purse || 0;
        
        // If initialPurse exists, use it; otherwise calculate from current + spent
        return teamData.initialPurse || (currentPurse + totalSpent);
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-green-100 mb-4">
                            <span className="text-3xl">{EMOJIS.EDIT}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Edit Team Balance
                        </h3>
                        <p className="text-gray-600 text-sm">
                            Update team's total points (budget from CSV). Points left will be recalculated automatically.
                        </p>
                    </div>

                    {/* Teams Table */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>{EMOJIS.TROPHY}</span>
                            Teams Financial Summary
                        </h4>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Team Name</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Total Points</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Points Left</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Total Spent</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Players</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Players to Buy</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(teams).map(([teamName, teamData]) => {
                                        const isEditing = editingTeam === teamName;
                                        const initialPurse = getInitialPurse(teamData);
                                        const currentPurse = teamData.purse || 0;
                                        const totalSpent = calculateTotalSpent(teamData);
                                        const playersCount = (teamData.players || []).length;
                                        const playersToBuy = teamData.playersToBuy || 0;
                                        
                                        return (
                                            <tr key={teamName} className="hover:bg-gray-50 transition-colors duration-200">
                                                {/* Team Name */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900 text-sm">{teamName}</span>
                                                    </div>
                                                </td>
                                                
                                                {/* Total Points (formerly Initial Purse) - EDITABLE */}
                                                <td className="px-4 py-4 text-center">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <input
                                                                type="number"
                                                                value={newTotalPoints}
                                                                onChange={(e) => setNewTotalPoints(e.target.value)}
                                                                className="w-28 px-2 py-1 border border-blue-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
                                                                placeholder="Total Points"
                                                                min="0"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="font-bold text-blue-600 text-sm">
                                                            {EMOJIS.CURRENCY_RUPEE}{initialPurse.toLocaleString()}
                                                        </span>
                                                    )}
                                                </td>
                                                
                                                {/* Points Left (formerly Current Purse) - DISPLAY ONLY */}
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        {isEditing ? (
                                                            <>
                                                                <span className="font-bold text-green-600 text-sm">
                                                                    {EMOJIS.CURRENCY_RUPEE}{(() => {
                                                                        const newTotalPointsValue = parseFloat(newTotalPoints) || 0;
                                                                        const spent = totalSpent;
                                                                        const newPointsLeft = newTotalPointsValue - spent;
                                                                        return newPointsLeft.toLocaleString();
                                                                    })()}
                                                                </span>
                                                                <span className="text-xs text-blue-600 mt-1 font-medium">
                                                                    (Preview)
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="font-bold text-green-600 text-sm">
                                                                {EMOJIS.CURRENCY_RUPEE}{currentPurse.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                
                                                {/* Total Spent */}
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-bold text-red-600 text-sm">
                                                        {EMOJIS.CURRENCY_RUPEE}{totalSpent.toLocaleString()
                                                        }
                                                    </span>
                                                </td>
                                                
                                                {/* Players Count */}
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-bold text-gray-700 text-sm">
                                                        {playersCount}
                                                    </span>
                                                </td>
                                                
                                                {/* Players to Buy */}
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-bold text-orange-600 text-sm">
                                                        {playersToBuy}
                                                    </span>
                                                </td>
                                                
                                                {/* Action Buttons */}
                                                <td className="px-4 py-4 text-center">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-1 justify-center">
                                                            <button
                                                                onClick={handleSave}
                                                                className="px-3 py-1 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 transition-colors duration-200"
                                                                title="Save new total points"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={handleCancel}
                                                                className="px-3 py-1 bg-gray-500 text-white rounded text-xs font-semibold hover:bg-gray-600 transition-colors duration-200"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEditClick(teamName, initialPurse)}
                                                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition-colors duration-200 flex items-center gap-1 mx-auto"
                                                            title="Edit total points (budget from CSV)"
                                                        >
                                                            <span>{EMOJIS.EDIT}</span>
                                                            Edit
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                        
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Information Note */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2">
                                <span className="text-blue-500 text-sm">{EMOJIS.GEAR}</span>
                                <div className="text-xs text-blue-700">
                                    <p className="font-semibold mb-1">How Edit Balance Works:</p>
                                    <ul className="space-y-1">
                                        <li>• <strong>Total Points:</strong> Original budget from team CSV file (editable here)</li>
                                        <li>• <strong>Points Left:</strong> Available budget for future purchases (auto-calculated)</li>
                                        <li>• <strong>Formula:</strong> Points Left = Total Points - Total Spent</li>
                                        <li>• <strong>Use Case:</strong> Adjust team budgets, fix data entry errors, or add bonus funds</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-2"
                        >
                            <span>{EMOJIS.CROSS_MARK}</span>
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {/* Click outside to close */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            ></div>
        </>
    );
};

export default TeamEditPopup;