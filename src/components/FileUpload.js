import React, { useState } from "react";
import { parseCSV, validatePlayerCSV, validateTeamCSV, formatDriveLink } from "../utils/csvUtils";
import { EMOJIS } from "../utils/constants";

const FileUpload = ({ 
    players, 
    teams, 
    onPlayersLoad, 
    onTeamsLoad, 
    onError,
    onStartAuction,
    onWhatsAppSettings,
    onImportBackup
}) => {
    // State for import confirmation dialog
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [pendingImportData, setPendingImportData] = useState(null);

    // Handle player file upload
    const handlePlayerUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            onError("Please select a CSV file. Only .csv files are supported.");
            e.target.value = ''; // Clear the input
            return;
        }

        parseCSV(file, (data) => {
            try {
                validatePlayerCSV(data);
                
                const enriched = data.map((row, index) => ({
                    id: index,
                    name: row["Name"]?.trim() || "",
                    skill: row["Skillset"]?.trim() || "",
                    photo: formatDriveLink(row["Photo Link"] || ""),
                    category: row["Category"]?.trim() || "OPEN", // Default to "OPEN" if category is empty
                    sold: false,
                    soldTo: null,
                    soldPrice: null,
                }));
                
                onPlayersLoad(enriched);
            } catch (error) {
                onError(error.message);
                e.target.value = ''; // Clear the input on error
            }
        }, onError);
    };

    // Handle team file upload
    const handleTeamUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            onError("Please select a CSV file. Only .csv files are supported.");
            e.target.value = ''; // Clear the input
            return;
        }

        parseCSV(file, (data) => {
            try {
                validateTeamCSV(data);
                
                const loadedTeams = {};
                data.forEach((team) => {
                    const teamName = team["Team Name"]?.trim();
                    if (teamName) {
                        loadedTeams[teamName] = {
                            owner: team["Owner Name"]?.trim() || "",
                            purse: parseInt(team["Purse"], 10),
                            playersToBuy: parseInt(team["Players to Buy"], 10),
                            players: [],
                        };
                    }
                });
                
                onTeamsLoad(loadedTeams);
            } catch (error) {
                onError(error.message);
                e.target.value = ''; // Clear the input on error
            }
        }, onError);
    };

    // Function to download sample players CSV
    const downloadSamplePlayersCSV = () => {
        const sampleData = [
            ['Name', 'Skillset', 'Photo Link', 'Category'],
            ['Virat Kohli', 'Batsman', 'https://example.com/virat.jpg', 'BATSMEN'],
            ['Jasprit Bumrah', 'Bowler', 'https://example.com/bumrah.jpg', 'BOWLERS'],
            ['MS Dhoni', 'Wicket Keeper', 'https://example.com/dhoni.jpg', 'WK'],
            ['Ravindra Jadeja', 'All Rounder', 'https://example.com/jadeja.jpg', 'ALL ROUNDERS'],
            ['Sample Player', 'Batsman', 'https://example.com/sample.jpg', '']
        ];
        
        const csvContent = sampleData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample_players.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Function to download sample teams CSV
    const downloadSampleTeamsCSV = () => {
        const sampleData = [
            ['Team Name', 'Owner Name', 'Purse', 'Players to Buy'],
            ['Mumbai Indians', 'Mukesh Ambani', '80000000', '25'],
            ['Chennai Super Kings', 'N. Srinivasan', '80000000', '25'],
            ['Royal Challengers Bangalore', 'Vijay Mallya', '80000000', '25'],
            ['Kolkata Knight Riders', 'Shah Rukh Khan', '80000000', '25'],
            ['Delhi Capitals', 'JSW Group', '80000000', '25']
        ];
        
        const csvContent = sampleData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'sample_teams.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Handle import backup file
    const handleBackupImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json')) {
            onError("Please select a JSON backup file. Only .json files are supported for backup import.");
            e.target.value = ''; // Clear the input
            return;
        }

        // Read and parse the file first
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const backupData = JSON.parse(event.target.result);
                
                // Validate backup data
                if (!backupData.players || !backupData.teams) {
                    onError("Invalid backup file format. Missing required data.");
                    e.target.value = ''; // Clear the input
                    return;
                }
                
                // Store the data and show our custom confirmation dialog
                setPendingImportData(backupData);
                setShowImportConfirm(true);
                
            } catch (error) {
                onError(`Failed to parse backup file: ${error.message}`);
                e.target.value = ''; // Clear the input
            }
        };
        
        reader.onerror = () => {
            onError('Failed to read backup file');
            e.target.value = ''; // Clear the input
        };
        
        reader.readAsText(file);
        
        // Clear the input immediately so user can select the same file again if needed
        e.target.value = '';
    };

    // Handle import confirmation
    const handleConfirmImport = () => {
        if (pendingImportData) {
            onImportBackup(null, pendingImportData); // Pass null as file since we already parsed it
            setPendingImportData(null);
        }
        setShowImportConfirm(false);
    };

    // Handle import cancellation
    const handleCancelImport = () => {
        setPendingImportData(null);
        setShowImportConfirm(false);
    };

    return (
        <div className="mb-8 space-y-8 bg-white bg-opacity-95 rounded-xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {EMOJIS.FOLDER} Upload Files
                </h2>
                <p className="text-gray-600">Upload your player and team CSV files to get started</p>
            </div>

            {/* File Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Players Upload */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center mb-4">
                        <span className="text-2xl mr-3">{EMOJIS.PEOPLE}</span>
                        <div>
                            <h3 className="text-lg font-bold text-blue-800">Player File</h3>
                            <p className="text-sm text-blue-600">Upload your players CSV file</p>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <input
                            id="player-upload"
                            type="file"
                            accept=".csv"
                            onChange={handlePlayerUpload}
                            className="block w-full border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                        
                        <div className="text-xs text-blue-700 bg-blue-100 rounded-lg p-3">
                            <div className="font-semibold mb-1">Required columns:</div>
                            <div>Name • Skillset • Photo Link • Category</div>
                        </div>
                        
                        {players.length > 0 && (
                            <div className="flex items-center text-sm text-green-700 bg-green-100 rounded-lg p-3">
                                <span className="mr-2">{EMOJIS.CHECK_MARK}</span>
                                <strong>{players.length} players loaded successfully!</strong>
                            </div>
                        )}
                        
                        <button
                            onClick={downloadSamplePlayersCSV}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            {EMOJIS.DOWNLOAD} Download Sample Players CSV
                        </button>
                    </div>
                </div>

                {/* Teams Upload */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center mb-4">
                        <span className="text-2xl mr-3">{EMOJIS.TROPHY}</span>
                        <div>
                            <h3 className="text-lg font-bold text-purple-800">Team File</h3>
                            <p className="text-sm text-purple-600">Upload your teams CSV file</p>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <input
                            id="team-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleTeamUpload}
                            className="block w-full border-2 border-purple-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        />
                        
                        <div className="text-xs text-purple-700 bg-purple-100 rounded-lg p-3">
                            <div className="font-semibold mb-1">Required columns:</div>
                            <div>Team Name • Owner Name • Purse • Players to Buy</div>
                        </div>
                        
                        {Object.keys(teams).length > 0 && (
                            <div className="flex items-center text-sm text-green-700 bg-green-100 rounded-lg p-3">
                                <span className="mr-2">{EMOJIS.CHECK_MARK}</span>
                                <strong>{Object.keys(teams).length} teams loaded successfully!</strong>
                            </div>
                        )}
                        
                        <button
                            onClick={downloadSampleTeamsCSV}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            {EMOJIS.DOWNLOAD} Download Sample Teams CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={onWhatsAppSettings}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
                >
                    <span className="text-xl">{EMOJIS.MOBILE}</span>
                    WhatsApp Settings
                </button>
                <button
                    onClick={onStartAuction}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    disabled={players.length === 0 || Object.keys(teams).length === 0}
                >
                    <span className="text-xl">{EMOJIS.TARGET}</span>
                    Start Auction
                </button>
            </div>

            {/* Restore Section - Always visible for restarting auctions */}
            <div className="border-t border-gray-200 pt-8">
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {EMOJIS.RESTORE} Restore Previous Auction
                    </h3>
                    <p className="text-gray-600">Import a backup file to restore a previous auction session</p>
                </div>
                
                <div className="max-w-md mx-auto">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
                        <div className="text-center space-y-4">
                            <div className="text-4xl">{EMOJIS.FOLDER}</div>
                            <div>
                                <h4 className="text-lg font-bold text-orange-800 mb-2">Import Backup File</h4>
                                <p className="text-sm text-orange-600 mb-4">
                                    Restore your previous auction session from a backup file
                                </p>
                            </div>
                            
                            <label className="block">
                                <span className="sr-only">Import backup file</span>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleBackupImport}
                                    className="hidden"
                                    id="backup-import"
                                />
                                <label
                                    htmlFor="backup-import"
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 cursor-pointer inline-block text-center flex items-center justify-center gap-2"
                                >
                                    {EMOJIS.RESTORE} Choose Backup File (.json)
                                </label>
                            </label>
                            
                            <div className="text-xs text-orange-700 bg-orange-100 rounded-lg p-3 text-left">
                                <div className="space-y-1">
                                    <div><strong>Supported format:</strong> .json files only</div>
                                    <div><strong>Restores:</strong> Complete auction state</div>
                                    <div><strong>Note:</strong> Will replace current data</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Confirmation Dialog */}
            {showImportConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-bounce-in">
                        <div className="text-center">
                            {/* Warning Icon */}
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-6 animate-pulse">
                                <div className="text-4xl">{EMOJIS.RESTORE}</div>
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                Import Backup Data?
                            </h3>
                            
                            {/* Content */}
                            {pendingImportData && (
                                <div className="mb-6">
                                    <p className="text-gray-600 mb-3">
                                        You're about to import the following backup data:
                                    </p>
                                    <div className="bg-orange-50 rounded-lg p-4 text-left border border-orange-200">
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-orange-800">Tournament:</span>
                                                <span className="text-orange-700">{pendingImportData.tournamentName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-orange-800">Players:</span>
                                                <span className="text-orange-700">{pendingImportData.players?.length || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-orange-800">Teams:</span>
                                                <span className="text-orange-700">{Object.keys(pendingImportData.teams || {}).length}</span>
                                            </div>
                                            {pendingImportData.exportedAt && (
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-orange-800">Exported:</span>
                                                    <span className="text-orange-700 text-xs">
                                                        {new Date(pendingImportData.exportedAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 mt-3 text-sm flex items-center justify-center gap-2">
                                        <span className="text-orange-500">{EMOJIS.WARNING}</span>
                                        <strong>This will replace all current data!</strong>
                                    </p>
                                </div>
                            )}
                            
                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={handleCancelImport}
                                    className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-2"
                                >
                                    <span>{EMOJIS.CROSS_MARK}</span>
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmImport}
                                    className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-lg flex items-center justify-center gap-2"
                                >
                                    <span>{EMOJIS.RESTORE}</span>
                                    Yes, Import Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;