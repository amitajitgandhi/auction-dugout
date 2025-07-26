import React, { useState } from "react";
import { parseCSV, validatePlayerCSV, validateTeamCSV, formatDriveLink } from "../utils/csvUtils";
import { EMOJIS } from "../utils/constants";
import { supabase } from "../supabaseClient"; // Make sure this is correct

const FileUpload = ({ 
    players, 
    teams, 
    onPlayersLoad, 
    onTeamsLoad, 
    onError,
    onStartAuction,
    onWhatsAppSettings
}) => {
    const [isUploadingPlayers, setIsUploadingPlayers] = useState(false);
    const [isUploadingTeams, setIsUploadingTeams] = useState(false);

    // Handle player file upload
    const handlePlayerUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            onError(`${EMOJIS.CROSS_MARK} Invalid file type! Please select a CSV file (.csv extension required).`);
            e.target.value = '';
            return;
        }

        setIsUploadingPlayers(true);

        parseCSV(file, async (data) => {
            try {
                validatePlayerCSV(data);

                const enrichedPlayers = [];

                for (const [index, row] of data.entries()) {
                    const name = row["Name"]?.trim() || "";
                    const skill = row["Skillset"]?.trim() || "";
                    const category = row["Category"]?.trim() || "OPEN";
                    const rawPhotoUrl = formatDriveLink(row["Photo Link"] || "");

                    if (!name || !rawPhotoUrl) continue;

                    try {
                        const response = await fetch("http://localhost:5000/api/upload-player", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                name,
                                skill,
                                category,
                                photoUrl: rawPhotoUrl
                            })
                        });

                        const result = await response.json();

                        if (!response.ok) throw new Error(result.message);

                        enrichedPlayers.push({
                            id: index,
                            name,
                            skill,
                            category,
                            photo: result.image_url,
                            sold: false,
                            soldTo: null,
                            soldPrice: null,
                        });

                    } catch (err) {
                        console.warn(`Server upload failed for ${name}:`, err.message);
                        continue;
                    }
                }

                onPlayersLoad(enrichedPlayers);
                setIsUploadingPlayers(false);
            } catch (err) {
                onError(err.message);
                e.target.value = '';
                setIsUploadingPlayers(false);
            }
        }, (err) => {
            onError(`${EMOJIS.CROSS_MARK} Failed to read CSV file: ${err}`);
            e.target.value = '';
            setIsUploadingPlayers(false);
        });
    };

    // Handle team file upload
    const handleTeamUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            onError(`${EMOJIS.CROSS_MARK} Invalid file type! Please select a CSV file (.csv extension required).`);
            e.target.value = ''; // Clear the input
            return;
        }

        setIsUploadingTeams(true);

        parseCSV(file, (data) => {
            try {
                validateTeamCSV(data);
                
                const loadedTeams = {};
                data.forEach((team) => {
                    const teamName = team["Team Name"]?.trim();
                    if (teamName) {
                        loadedTeams[teamName] = {
                            owner: team["Owner Name"]?.trim() || "",
                            purse: parseInt(team["Purse"], 10) || 0,
                            playersToBuy: parseInt(team["Players to Buy"], 10) || 0,
                            players: [],
                        };
                    }
                });
                
                onTeamsLoad(loadedTeams);
                setIsUploadingTeams(false);
            } catch (error) {
                onError(error.message);
                e.target.value = ''; // Clear the input on error
                setIsUploadingTeams(false);
            }
        }, (error) => {
            onError(`${EMOJIS.CROSS_MARK} Failed to read CSV file: ${error}\n\n${EMOJIS.SPARKLES} Please ensure your file is a valid CSV format.`);
            e.target.value = '';
            setIsUploadingTeams(false);
        });
    };

    // Function to download sample players CSV
    const downloadSamplePlayersCSV = () => {
        const sampleData = [
            ['Name', 'Skillset', 'Photo Link', 'Category'],
            ['Virat Kohli', 'Batsman', 'https://example.com/virat.jpg', 'BATSMEN'],
            ['Jasprit Bumrah', 'Bowler', 'https://example.com/bumrah.jpg', 'BOWLERS'],
            ['MS Dhoni', 'Wicket Keeper', 'https://example.com/dhoni.jpg', 'WK'],
            ['Ravindra Jadeja', 'All Rounder', 'https://example.com/jadeja.jpg', 'ALL ROUNDERS'],
            ['Sample Player', 'Batsman', 'https://example.com/sample.jpg', 'OPEN']
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
                            disabled={isUploadingPlayers}
                            className="block w-full border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        
                        {isUploadingPlayers && (
                            <div className="flex items-center text-sm text-blue-700 bg-blue-100 rounded-lg p-3">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                Processing players CSV...
                            </div>
                        )}
                        
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
                            disabled={isUploadingTeams}
                            className="block w-full border-2 border-purple-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        
                        {isUploadingTeams && (
                            <div className="flex items-center text-sm text-purple-700 bg-purple-100 rounded-lg p-3">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                                Processing teams CSV...
                            </div>
                        )}
                        
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
                    disabled={players.length === 0 || Object.keys(teams).length === 0 || isUploadingPlayers || isUploadingTeams}
                >
                    <span className="text-xl">{EMOJIS.TARGET}</span>
                    Start Auction
                </button>
            </div>
        </div>
    );
};

export default FileUpload;