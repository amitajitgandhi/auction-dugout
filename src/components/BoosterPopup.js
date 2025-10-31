/**
 * ✅ ARCHIVED COMPONENT - BOOSTER FUNCTIONALITY
 * This component has been archived in favor of simplified team purse editing.
 * The booster system was too complex and has been replaced with direct purse editing.
 * 
 * Date Archived: [Current Date]
 * Reason: Simplification - direct team purse editing preferred over booster system
 * 
 * ⚠️ DO NOT USE THIS COMPONENT - Use TeamEditPopup instead
 */

import React, { useState } from "react";
import { EMOJIS } from "../utils/constants";

// ✅ ARCHIVED: This entire component is now archived
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

    // ✅ ARCHIVED: All booster logic below is archived
    
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

    // ✅ ARCHIVED: Return null to disable this component
    if (!isOpen) return null;

    // ✅ ARCHIVED: Show archived message instead of booster interface
    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                            <span className="text-3xl">{EMOJIS.ARCHIVE}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Feature Archived
                        </h3>
                        <p className="text-gray-600 text-sm">
                            Please use the team edit feature.
                        </p>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-2"
                        >
                            <span>{EMOJIS.CHECK_MARK}</span>
                            OK
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

    // ✅ ARCHIVED: All the original booster functionality code below (commented out)
    /*
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

    // Original JSX return statement archived below 
    */
};

export default BoosterPopup;