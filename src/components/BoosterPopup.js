import React, { useState } from "react";
import { EMOJIS } from "../utils/constants";

const BoosterPopup = ({ 
    isOpen, 
    onClose, 
    teams, 
    showManagedToast,
    boosterData,
    onApplyBoosters
}) => {
    const [pointsPerBooster, setPointsPerBooster] = useState('');
    const [teamBoosters, setTeamBoosters] = useState({});

    // Initialize team boosters when popup opens
    React.useEffect(() => {
        if (isOpen && Object.keys(teams).length > 0) {
            // Load existing booster data if available
            if (boosterData && boosterData.pointsPerBooster && Object.keys(boosterData.teamBoosters || {}).length > 0) {
                setPointsPerBooster(boosterData.pointsPerBooster.toString());
                setTeamBoosters(boosterData.teamBoosters);
            } else {
                // Initialize with empty booster data
                const initialBoosters = {};
                Object.keys(teams).forEach(teamName => {
                    initialBoosters[teamName] = {
                        selected: false,
                        boosterCount: 0
                    };
                });
                setTeamBoosters(initialBoosters);
            }
        }
    }, [isOpen, teams, boosterData]);

    if (!isOpen) return null;

    const handleCheckboxChange = (teamName, checked) => {
        setTeamBoosters(prev => ({
            ...prev,
            [teamName]: {
                ...prev[teamName],
                selected: checked,
                boosterCount: checked ? prev[teamName]?.boosterCount || 0 : 0
            }
        }));
    };

    const handleBoosterCountChange = (teamName, increment) => {
        setTeamBoosters(prev => {
            const currentCount = prev[teamName]?.boosterCount || 0;
            const newCount = Math.max(0, Math.min(10, currentCount + increment));
            
            return {
                ...prev,
                [teamName]: {
                    ...prev[teamName],
                    boosterCount: newCount
                }
            };
        });
    };

    const calculateUpdatedPoints = (teamName) => {
        const team = teams[teamName];
        if (!team) return 0;
        
        // Get initial points (purse + spent amount)
        const spentAmount = team.players.reduce((total, player) => total + player.soldPrice, 0);
        const initialPoints = team.purse + spentAmount;
        
        const boosterData = teamBoosters[teamName];
        const boosterPoints = boosterData?.selected && pointsPerBooster ? 
            (boosterData.boosterCount * parseInt(pointsPerBooster)) : 0;
        
        return initialPoints + boosterPoints;
    };

    const getInitialPoints = (teamName) => {
        const team = teams[teamName];
        if (!team) return 0;
        
        // Calculate initial points (purse + spent amount)
        const spentAmount = team.players.reduce((total, player) => total + player.soldPrice, 0);
        return team.purse + spentAmount;
    };

    const handleClose = () => {
        // Don't reset state when closing - keep the existing values
        onClose();
    };

    const handleApplyBoosters = () => {
        if (!pointsPerBooster || parseInt(pointsPerBooster) <= 0) {
            showManagedToast('error', 'Please enter valid points per booster!', {
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

        const selectedTeams = Object.entries(teamBoosters).filter(([_, data]) => data.selected && data.boosterCount > 0);
        
        if (selectedTeams.length === 0) {
            showManagedToast('error', 'Please select at least one team with boosters!', {
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

        // Pass the booster data to parent component
        const boosterDataToSave = {
            pointsPerBooster: parseInt(pointsPerBooster),
            teamBoosters: teamBoosters
        };

        onApplyBoosters(boosterDataToSave);

        const boosterSummary = selectedTeams.map(([teamName, data]) => 
            `${teamName}: ${data.boosterCount} booster(s)`
        ).join(', ');

        showManagedToast('success', `Boosters applied successfully! ${boosterSummary}`, {
            style: {
                border: '2px solid #10b981',
                padding: '16px',
                color: '#065f46',
                fontWeight: 'bold',
                fontSize: '1.05rem',
                background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
                boxShadow: '0 4px 24px 0 #10b981',
            },
            icon: EMOJIS.ZAP,
            duration: 4000,
        });

        handleClose();
    };

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 mb-4">
                            <span className="text-3xl">{EMOJIS.ZAP}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Team Booster
                        </h3>
                        <p className="text-gray-600 text-sm">
                            Add bonus points to selected teams
                        </p>
                    </div>

                    {/* Points per Booster Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Points per Booster
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={pointsPerBooster}
                            onChange={(e) => setPointsPerBooster(e.target.value)}
                            placeholder="Enter points per booster"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-medium"
                        />
                    </div>

                    {/* Teams Table */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>{EMOJIS.TROPHY}</span>
                            Team Wise Booster
                        </h4>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="px-3 py-3 text-center text-sm font-bold text-gray-700">Select</th>
                                        <th className="px-3 py-3 text-left text-sm font-bold text-gray-700">Team Name</th>
                                        <th className="px-3 py-3 text-center text-sm font-bold text-gray-700">Initial Points</th>
                                        <th className="px-3 py-3 text-center text-sm font-bold text-gray-700">No. of Boosters</th>
                                        <th className="px-3 py-3 text-center text-sm font-bold text-gray-700">Updated Points</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.entries(teams).map(([teamName, teamData]) => {
                                        const boosterTeamData = teamBoosters[teamName] || { selected: false, boosterCount: 0 };
                                        const initialPoints = getInitialPoints(teamName);
                                        const updatedPoints = calculateUpdatedPoints(teamName);
                                        
                                        return (
                                            <tr key={teamName} className="hover:bg-gray-50 transition-colors duration-200">
                                                {/* Checkbox Column */}
                                                <td className="px-3 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={boosterTeamData.selected}
                                                        onChange={(e) => handleCheckboxChange(teamName, e.target.checked)}
                                                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                                    />
                                                </td>
                                                
                                                {/* Team Name Column */}
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900 text-sm">{teamName}</span>
                                                    </div>
                                                </td>
                                                
                                                {/* Initial Points Column */}
                                                <td className="px-3 py-4 text-center">
                                                    <span className="font-bold text-blue-600 text-sm">
                                                        {EMOJIS.CURRENCY_RUPEE}{initialPoints.toLocaleString()}
                                                    </span>
                                                </td>
                                                
                                                {/* No. of Boosters Column */}
                                                <td className="px-3 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleBoosterCountChange(teamName, -1)}
                                                            disabled={!boosterTeamData.selected || boosterTeamData.boosterCount <= 0}
                                                            className="w-6 h-6 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center text-xs"
                                                        >
                                                            -
                                                        </button>
                                                        <span className={`w-6 text-center font-bold text-sm ${
                                                            boosterTeamData.selected ? 'text-gray-900' : 'text-gray-400'
                                                        }`}>
                                                            {boosterTeamData.boosterCount}
                                                        </span>
                                                        <button
                                                            onClick={() => handleBoosterCountChange(teamName, 1)}
                                                            disabled={!boosterTeamData.selected || boosterTeamData.boosterCount >= 10}
                                                            className="w-6 h-6 rounded-full bg-green-500 text-white font-bold hover:bg-green-600 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center text-xs"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                
                                                {/* Updated Points Column */}
                                                <td className="px-3 py-4 text-center">
                                                    <span className={`font-bold text-sm ${
                                                        boosterTeamData.selected && boosterTeamData.boosterCount > 0 
                                                            ? 'text-green-600' 
                                                            : 'text-gray-600'
                                                    }`}>
                                                        {EMOJIS.CURRENCY_RUPEE}{updatedPoints.toLocaleString()}
                                                    </span>
                                                    {boosterTeamData.selected && boosterTeamData.boosterCount > 0 && pointsPerBooster && (
                                                        <div className="text-xs text-green-500 mt-1">
                                                            +{EMOJIS.CURRENCY_RUPEE}{(boosterTeamData.boosterCount * parseInt(pointsPerBooster)).toLocaleString()}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={handleClose}
                            className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-2"
                        >
                            <span>{EMOJIS.CROSS_MARK}</span>
                            Cancel
                        </button>
                        <button
                            onClick={handleApplyBoosters}
                            className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-lg flex items-center justify-center gap-2"
                        >
                            <span>{EMOJIS.ZAP}</span>
                            Apply Boosters
                        </button>
                    </div>
                </div>
            </div>

            {/* Click outside to close */}
            <div
                className="fixed inset-0 z-40"
                onClick={handleClose}
            ></div>
        </>
    );
};

export default BoosterPopup;