import React, { useState, useEffect, useCallback, useMemo } from "react";
import Confetti from "react-confetti";
import { EMOJIS } from "../utils/constants";

const PlayerSpinWheel = ({ teams, isOpen, onClose, showManagedToast }) => {
    const [step, setStep] = useState(1);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState(null);
    const [hasSpunOnce, setHasSpunOnce] = useState(false);
    const [spinCount, setSpinCount] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);

    const teamNames = Object.keys(teams);

    const colors = useMemo(() => [
        '#FF4757', '#2ED573', '#3742FA', '#FF6348', '#2F3542',
        '#FF3838', '#FF9F43', '#10AC84', '#5F27CD', '#00D8D6',
        '#FFD32A', '#FF3F34', '#17C0EB', '#7D5AFF', '#FD79A8',
        '#6C5CE7', '#A4B0BE', '#FF6B35', '#26C281', '#4834D4',
        '#FF5722', '#009688', '#795548', '#607D8B', '#E91E63',
        '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4'
    ], []);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedTeams([]);
            setIsSpinning(false);
            setRotation(0);
            setWinner(null);
            setHasSpunOnce(false);
            setSpinCount(0);
            setShowConfetti(false);
        }
    }, [isOpen]);

    const getInitials = useCallback((name) => {
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
        if (parts.length === 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts.slice(0, 3).map(p => p[0]).join("").toUpperCase();
    }, []);

    // Function to calculate winner based on final rotation position
    const calculateWinnerFromRotation = useCallback((finalRotation, teams) => {
        const segmentAngle = 360 / teams.length;
        
        // Normalize rotation to 0-360 degrees
        const normalizedRotation = ((finalRotation % 360) + 360) % 360;
        
        // The pointer is at the top (0 degrees), so we need to find which segment is at the top
        // Since the wheel rotates clockwise, we need to reverse the calculation
        const pointerAngle = (360 - normalizedRotation) % 360;
        
        // Find which segment the pointer is pointing at
        const segmentIndex = Math.floor(pointerAngle / segmentAngle);
        
        // Ensure the index is within bounds
        const winnerIndex = segmentIndex % teams.length;
        
        return teams[winnerIndex];
    }, []);

    const handleSpin = useCallback(() => {
        if (isSpinning) return;

        // Calculate a random final position
        const segmentAngle = 360 / selectedTeams.length;
        const extraSpins = Math.floor(Math.random() * 3) + 5; // 5-7 full rotations
        const randomSegmentIndex = Math.floor(Math.random() * selectedTeams.length);
        
        // Calculate the exact angle to land on the desired segment
        const targetAngle = randomSegmentIndex * segmentAngle + (segmentAngle / 2); // Middle of segment
        const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.6; // Add some randomness within segment
        
        // Total rotation = extra spins + target position + random offset
        const totalRotation = extraSpins * 360 + targetAngle + randomOffset;

        setWinner(null);
        setIsSpinning(true);
        setShowConfetti(false);
        setRotation(0);

        requestAnimationFrame(() => setRotation(totalRotation));
        setSpinCount(prev => prev + 1);

        setTimeout(() => {
            // Calculate the actual winner based on final rotation position
            const actualWinner = calculateWinnerFromRotation(totalRotation, selectedTeams);
            
            setWinner(actualWinner);
            setIsSpinning(false);
            setShowConfetti(true);
            setHasSpunOnce(true);
            
            console.log('?? Spin Result:', {
                totalRotation,
                normalizedRotation: ((totalRotation % 360) + 360) % 360,
                targetSegment: randomSegmentIndex,
                actualWinner,
                allTeams: selectedTeams
            });
        }, 4500);
    }, [isSpinning, selectedTeams, calculateWinnerFromRotation]);

    const handleSpinAgain = useCallback(() => {
        setRotation(0);
        setIsSpinning(false);
        setWinner(null);
        setShowConfetti(false);
        requestAnimationFrame(() => handleSpin());
    }, [handleSpin]);

    const handleOK = useCallback(() => {
        if (selectedTeams.length === 0) {
            showManagedToast && showManagedToast('error', 'Please select at least one team!', {
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
        setStep(2);
        setRotation(0);
        setWinner(null);
        setShowConfetti(false);
    }, [selectedTeams.length, showManagedToast]);

    const handleToggleTeam = useCallback((name) => {
        setSelectedTeams(prev =>
            prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
        );
    }, []);

    const handleSelectAllToggle = useCallback(() => {
        if (selectedTeams.length === teamNames.length) {
            setSelectedTeams([]);
        } else {
            setSelectedTeams([...teamNames]);
        }
    }, [selectedTeams.length, teamNames]);

    const handleReset = useCallback(() => {
        setStep(1);
        setSelectedTeams([]);
        setWinner(null);
        setRotation(0);
        setIsSpinning(false);
        setSpinCount(0);
        setHasSpunOnce(false);
        setShowConfetti(false);
    }, []);

    const handleClose = useCallback(() => {
        handleReset();
        onClose();
    }, [handleReset, onClose]);

    const renderWheel = useMemo(() => {
        if (selectedTeams.length === 0) return null;
        const segmentAngle = 360 / selectedTeams.length;
        const radius = 150;
        const center = 160;

        return (
            <svg width="320" height="320" className="absolute inset-0" key={`wheel-${spinCount}`}>
                <defs>
                    {selectedTeams.map((_, i) => {
                        const teamColor = colors[i % colors.length];
                        return (
                            <radialGradient key={`grad-${i}-${spinCount}`} id={`grad-${i}-${spinCount}`} cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor={teamColor} stopOpacity="1" />
                                <stop offset="100%" stopColor={teamColor} stopOpacity="0.85" />
                            </radialGradient>
                        );
                    })}
                    {/* Center gradient */}
                    <radialGradient id={`centerGradient-${spinCount}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#4B5563" />
                        <stop offset="100%" stopColor="#1F2937" />
                    </radialGradient>
                </defs>

                {/* Outer border circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius + 2}
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="4"
                />

                {selectedTeams.map((team, i) => {
                    const start = i * segmentAngle;
                    const end = start + segmentAngle;
                    const mid = (start + end) / 2;
                    const midRad = (mid * Math.PI) / 180;

                    // Adjust starting angle to align properly with pointer at top
                    const x1 = center + radius * Math.cos((start - 90) * Math.PI / 180);
                    const y1 = center + radius * Math.sin((start - 90) * Math.PI / 180);
                    const x2 = center + radius * Math.cos((end - 90) * Math.PI / 180);
                    const y2 = center + radius * Math.sin((end - 90) * Math.PI / 180);

                    const largeArc = segmentAngle > 180 ? 1 : 0;
                    const d = `M${center},${center} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;

                    const textX = center + radius * 0.65 * Math.cos(midRad - Math.PI / 2);
                    const textY = center + radius * 0.65 * Math.sin(midRad - Math.PI / 2);

                    return (
                        <g key={`${team}-${i}-${spinCount}`}>
                            <path 
                                d={d} 
                                fill={`url(#grad-${i}-${spinCount})`} 
                                stroke="white" 
                                strokeWidth="3" 
                                opacity="0.95"
                            />
                            <text
                                x={textX}
                                y={textY}
                                fill="white"
                                fontSize={selectedTeams.length > 12 ? "14" : selectedTeams.length > 8 ? "16" : selectedTeams.length > 4 ? "18" : "20"}
                                fontWeight="900"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{ 
                                    textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
                                    fontFamily: 'Arial Black, Arial, sans-serif',
                                    letterSpacing: '1px'
                                }}
                            >
                                {getInitials(team)}
                            </text>
                            <title>{team}</title>
                        </g>
                    );
                })}

                {/* Center circle */}
                <circle
                    cx={center}
                    cy={center}
                    r="28"
                    fill={`url(#centerGradient-${spinCount})`}
                    stroke="#374151"
                    strokeWidth="4"
                />

                {/* Center icon */}
                <text
                    x={center}
                    y={center}
                    fill="white"
                    fontSize="22"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ 
                        fontFamily: 'Arial, sans-serif',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                    }}
                >
                    {EMOJIS.CRICKET_BAT}
                </text>
            </svg>
        );
    }, [selectedTeams, colors, getInitials, spinCount]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            {showConfetti && <Confetti numberOfPieces={150} recycle={false} />}
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {step === 1 ? (
                    /* Step 1: Team Selection */
                    <div>
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-4">{EMOJIS.SPINWHEEL}</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Player Spin - Select Teams</h2>
                            <p className="text-gray-600">Choose the teams you want to include in the spin wheel</p>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    onClick={handleSelectAllToggle}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                                >
                                    {selectedTeams.length === teamNames.length ? 'Deselect All' : 'Select All'}
                                </button>
                                <div className="text-sm text-gray-600">
                                    {selectedTeams.length} of {teamNames.length} selected
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                {teamNames.map((name) => (
                                    <label
                                        key={name}
                                        className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedTeams.includes(name)}
                                            onChange={() => handleToggleTeam(name)}
                                            className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className="text-lg">{EMOJIS.CRICKET_BAT}</span>
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-800">{name}</span>
                                                <span className="text-xs text-gray-500 ml-2">
                                                    ({getInitials(name)})
                                                </span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleOK}
                                disabled={selectedTeams.length === 0}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
                            >
                                OK ({selectedTeams.length} selected)
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Step 2: Optimized Spin Wheel */
                    <div>
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-4">{EMOJIS.SPINWHEEL}</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Player Spin Wheel</h2>
                            <p className="text-gray-600">
                                {!hasSpunOnce 
                                    ? "Click \"Start Spin\" to randomly select a team!" 
                                    : "Click \"Spin Again\" for another selection!"
                                }
                            </p>
                        </div>

                        {/* Optimized Spin Wheel */}
                        <div className="flex justify-center mb-8">
                            <div className="relative">
                                {/* Enhanced Pointer */}
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-20">
                                    <div className="flex flex-col items-center">
                                        <div className="w-0 h-0 border-l-10 border-r-10 border-b-20 border-l-transparent border-r-transparent border-b-red-600 drop-shadow-xl"></div>
                                        <div className="w-5 h-5 bg-red-600 rounded-full mt-1 shadow-xl border-3 border-white"></div>
                                    </div>
                                </div>

                                {/* Optimized Wheel Container */}
                                <div
                                    className="relative w-80 h-80 rounded-full shadow-2xl bg-white"
                                    style={{
                                        transform: `rotate(${rotation}deg)`,
                                        transition: isSpinning
                                            ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                                            : "none",
                                        filter: 'drop-shadow(0 15px 35px rgba(0, 0, 0, 0.5))',
                                        willChange: isSpinning ? 'transform' : 'auto',
                                        backfaceVisibility: 'hidden',
                                        perspective: '1000px'
                                    }}
                                >
                                    {renderWheel}
                                </div>

                                {/* Enhanced outer decorative ring */}
                                <div className="absolute inset-0 rounded-full border-4 border-yellow-400 pointer-events-none shadow-xl"></div>
                            </div>
                        </div>

                        {/* Winner Display */}
                        {winner && (
                            <div className="text-center mb-6 p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border-2 border-green-300 shadow-lg">
                                <div className="text-3xl font-bold text-green-800 flex items-center justify-center gap-3 animate-bounce">
                                    <span className="text-4xl">{EMOJIS.PARTY}</span>
                                    <span>Winner: {winner}</span>
                                    <span className="text-4xl">{EMOJIS.PARTY}</span>
                                </div>
                                <div className="text-sm text-green-600 mt-2 font-medium">
                                    Congratulations!
                                </div>
                            </div>
                        )}

                        {/* Enhanced Controls */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleReset}
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200 flex items-center gap-2"
                            >
                                <span>{EMOJIS.BACK_ARROW}</span>
                                Back to Selection
                            </button>

                            {/* Conditional rendering: Show Start Spin for first time, Spin Again for consecutive runs */}
                            {!hasSpunOnce ? (
                                // First time - Show Start Spin button
                                <button
                                    onClick={handleSpin}
                                    disabled={isSpinning}
                                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                                >
                                    {isSpinning ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Spinning...
                                        </>
                                    ) : (
                                        <>
                                            <span>{EMOJIS.TARGET}</span>
                                            Start Spin
                                        </>
                                    )}
                                </button>
                            ) : (
                                // After first spin - Show Spin Again button only
                                <button
                                    onClick={handleSpinAgain}
                                    disabled={isSpinning}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSpinning ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Spinning...
                                        </>
                                    ) : (
                                        <>
                                            <span>{EMOJIS.REFRESH}</span>
                                            Spin Again
                                        </>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerSpinWheel;