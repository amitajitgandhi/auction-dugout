import React, { useState } from "react";
import { EMOJIS } from "../utils/constants";

const JerseyColorAssignment = ({ teams, isOpen, onClose, showManagedToast, whatsappSettings, onTeamWhatsAppShare, tournamentName }) => {
    const [step, setStep] = useState(1); // 1: Color Selection, 2: Assignment Results
    const [selectedColors, setSelectedColors] = useState([]);
    const [customColors, setCustomColors] = useState([]);
    const [customColorName, setCustomColorName] = useState('');
    const [customColorHex, setCustomColorHex] = useState('');
    const [assignments, setAssignments] = useState({});

    if (!isOpen) return null;

    const teamNames = Object.keys(teams);

    // Predefined colors with names and hex codes
    const predefinedColors = [
        { name: 'Red', hex: '#FF0000', bg: 'bg-red-500' },
        { name: 'Blue', hex: '#0000FF', bg: 'bg-blue-500' },
        { name: 'Green', hex: '#008000', bg: 'bg-green-500' },
        { name: 'Yellow', hex: '#FFFF00', bg: 'bg-yellow-400' },
        { name: 'Orange', hex: '#FFA500', bg: 'bg-orange-500' },
        { name: 'Purple', hex: '#800080', bg: 'bg-purple-500' },
        { name: 'Pink', hex: '#FFC0CB', bg: 'bg-pink-400' },
        { name: 'Cyan', hex: '#00FFFF', bg: 'bg-cyan-400' },
        { name: 'Brown', hex: '#8B4513', bg: 'bg-amber-800' },
        { name: 'Gray', hex: '#808080', bg: 'bg-gray-500' },
        { name: 'Black', hex: '#000000', bg: 'bg-black' },
        { name: 'White', hex: '#FFFFFF', bg: 'bg-white border-2 border-gray-300' },
        { name: 'Indigo', hex: '#4B0082', bg: 'bg-indigo-600' },
        { name: 'Teal', hex: '#008080', bg: 'bg-teal-500' },
        { name: 'Maroon', hex: '#800000', bg: 'bg-red-800' },
        { name: 'Navy', hex: '#000080', bg: 'bg-blue-900' }
    ];

    const allColors = [...predefinedColors, ...customColors];

    // Handle color selection
    const handleColorToggle = (color) => {
        setSelectedColors(prev => {
            const isSelected = prev.some(c => c.hex === color.hex);
            if (isSelected) {
                return prev.filter(c => c.hex !== color.hex);
            } else {
                return [...prev, color];
            }
        });
    };

    // Handle custom color addition
    const handleAddCustomColor = () => {
        if (!customColorName.trim()) {
            showManagedToast('error', 'Please enter a color name!', {
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

        // Check if color name already exists
        const existingColor = allColors.find(c => c.name.toLowerCase() === customColorName.toLowerCase());
        if (existingColor) {
            showManagedToast('error', 'A color with this name already exists!', {
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

        let finalHex = customColorHex;
        
        // If no hex code provided, try to map common color names to CSS colors
        if (!finalHex) {
            const colorNameMap = {
                'magenta': '#FF00FF',
                'lime': '#00FF00',
                'aqua': '#00FFFF',
                'silver': '#C0C0C0',
                'gold': '#FFD700',
                'coral': '#FF7F50',
                'salmon': '#FA8072',
                'khaki': '#F0E68C',
                'lavender': '#E6E6FA',
                'turquoise': '#40E0D0'
            };
            finalHex = colorNameMap[customColorName.toLowerCase()] || '#888888'; // Default gray
        }

        // Validate hex format
        if (finalHex && !finalHex.match(/^#[0-9A-Fa-f]{6}$/)) {
            showManagedToast('error', 'Invalid hex code format! Use format like #FF00FF', {
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

        const newColor = {
            name: customColorName,
            hex: finalHex,
            bg: 'custom',
            isCustom: true
        };

        setCustomColors(prev => [...prev, newColor]);
        setCustomColorName('');
        setCustomColorHex('');
        
        showManagedToast('success', `Custom color "${customColorName}" added successfully!`, {
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
    };

    // Handle OK button click
    const handleOK = () => {
        if (selectedColors.length < teamNames.length) {
            showManagedToast('error', `Please select at least ${teamNames.length} unique colors to assign jerseys to all teams.`, {
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
            return;
        }

        // Randomly assign colors to teams
        const shuffledColors = [...selectedColors].sort(() => Math.random() - 0.5);
        const newAssignments = {};
        
        teamNames.forEach((teamName, index) => {
            newAssignments[teamName] = shuffledColors[index % shuffledColors.length];
        });

        setAssignments(newAssignments);
        setStep(2);
    };

    // Export assignments to CSV
    const handleExportCSV = () => {
        const csvRows = [];
        csvRows.push(['Team Name', 'Jersey Color', 'Color Code'].join(','));
        
        Object.entries(assignments).forEach(([teamName, color]) => {
            csvRows.push([
                `"${teamName}"`,
                `"${color.name}"`,
                `"${color.hex}"`
            ].join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${tournamentName}_Jersey_Colors_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        showManagedToast('success', 'Jersey color assignments exported successfully!', {
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
    };

    // Send WhatsApp message
    const handleWhatsAppMessage = () => {
        if (!whatsappSettings?.enabled || !whatsappSettings?.groupNumber) {
            showManagedToast('error', 'WhatsApp settings not configured!', {
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

        // Create WhatsApp message
        let message = `${EMOJIS.JERSEY} *${tournamentName.toUpperCase()} - JERSEY COLOR ASSIGNMENTS* ${EMOJIS.JERSEY}\n\n`;
        
        Object.entries(assignments).forEach(([teamName, color]) => {
            message += `${EMOJIS.CRICKET_BAT} *${teamName}*: ${color.name} ${color.hex}\n`;
        });
        
        message += `\n${EMOJIS.SPARKLES} Generated by Cricket Auction Tool`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappSettings.groupNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        
        showManagedToast('success', 'WhatsApp message opened! Send it to share jersey assignments.', {
            style: {
                border: '2px solid #10b981',
                padding: '16px',
                color: '#065f46',
                fontWeight: 'bold',
                fontSize: '1.05rem',
                background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
                boxShadow: '0 4px 24px 0 #10b981',
            },
            icon: EMOJIS.MOBILE,
            duration: 4000,
        });
    };

    const handleReset = () => {
        setStep(1);
        setSelectedColors([]);
        setCustomColors([]);
        setCustomColorName('');
        setCustomColorHex('');
        setAssignments({});
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {step === 1 ? (
                    /* Step 1: Color Selection */
                    <div>
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-4">{EMOJIS.JERSEY}</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Jersey Color Assignment</h2>
                            <p className="text-gray-600">Select colors to assign to your teams ({teamNames.length} teams)</p>
                        </div>

                        {/* Predefined Colors Grid */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Colors ({selectedColors.length} selected)</h3>
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {allColors.map((color, index) => {
                                    const isSelected = selectedColors.some(c => c.hex === color.hex);
                                    return (
                                        <div key={`${color.name}-${index}`} className="flex flex-col items-center relative">
                                            <label className="cursor-pointer block w-full">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleColorToggle(color)}
                                                    className="sr-only"
                                                />
                                                <div className={`w-16 h-16 rounded-lg border-2 transition-all duration-200 relative mx-auto ${
                                                    isSelected 
                                                        ? 'border-blue-500 ring-2 ring-blue-200 scale-105' 
                                                        : 'border-gray-300 hover:border-gray-400'
                                                } ${color.bg === 'custom' ? '' : color.bg}`}
                                                style={color.bg === 'custom' ? { backgroundColor: color.hex } : {}}
                                                >
                                                    {/* Visible tick mark for selected colors */}
                                                    {isSelected && (
                                                        <div className="absolute top-1 right-1 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                                            {EMOJIS.CHECK_MARK}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Vertically and horizontally center-aligned color name */}
                                                <div className="mt-2 h-8 flex items-center justify-center">
                                                    <span className="text-xs font-medium text-gray-700 text-center px-1 leading-tight">
                                                        {color.name}
                                                    </span>
                                                </div>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Add Custom Color */}
                        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Custom Color</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Color Name *</label>
                                    <input
                                        type="text"
                                        value={customColorName}
                                        onChange={(e) => setCustomColorName(e.target.value)}
                                        placeholder="e.g., Magenta"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hex Code (Optional)</label>
                                    <input
                                        type="text"
                                        value={customColorHex}
                                        onChange={(e) => setCustomColorHex(e.target.value)}
                                        placeholder="e.g., #FF00FF"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleAddCustomColor}
                                        disabled={!customColorName.trim()}
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Add Color
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleOK}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-200"
                                disabled={selectedColors.length < teamNames.length}
                            >
                                Assign Colors ({selectedColors.length}/{teamNames.length})
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Step 2: Assignment Results */
                    <div>
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-4">{EMOJIS.PARTY}</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Jersey Colors Assigned!</h2>
                            <p className="text-gray-600">Here are the randomly assigned jersey colors for each team</p>
                        </div>

                        {/* Assignments Display */}
                        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                            {Object.entries(assignments).map(([teamName, color]) => (
                                <div key={teamName} className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className={`w-12 h-12 rounded-full border-2 border-gray-300 ${color.bg === 'custom' ? '' : color.bg}`}
                                            style={color.bg === 'custom' ? { backgroundColor: color.hex } : {}}
                                        ></div>
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                                <span>{EMOJIS.CRICKET_BAT}</span>
                                                {teamName}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {color.name} • {color.hex}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button
                                onClick={handleReset}
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors duration-200 flex items-center gap-2"
                                >
                                    <span>{EMOJIS.BACK_ARROW}</span>
                                Reassign Colors
                            </button>
                            
                            <button
                                onClick={handleExportCSV}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
                            >
                                <span>{EMOJIS.CHART}</span>
                                Export to CSV
                            </button>

                            {whatsappSettings?.enabled && whatsappSettings?.groupNumber && (
                                <button
                                    onClick={handleWhatsAppMessage}
                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2"
                                >
                                    <span>{EMOJIS.MOBILE}</span>
                                    Send WhatsApp
                                </button>
                            )}

                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200"
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

export default JerseyColorAssignment;