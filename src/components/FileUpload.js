import React, { useState } from "react";
import { parseCSV, validatePlayerCSV, validateTeamCSV, formatDriveLink, formatCricHeroesProfile } from "../utils/csvUtils";
import { EMOJIS, getDefaultPlayerImage } from "../utils/constants";
import { supabase } from "../supabaseClient";

const FileUpload = ({ 
    players, 
    teams, 
    onPlayersLoad, 
    onTeamsLoad, 
    onError,
    onStartAuction,
    onWhatsAppSettings,
    // Additional props for saving progress
    persistence,
    authUser,
    isTournamentNameSet,
    tournamentName,
    whatsappSettings,
    categoryConfigs,
    showManagedToast
}) => {
    const [isUploadingPlayers, setIsUploadingPlayers] = useState(false);
    const [isUploadingTeams, setIsUploadingTeams] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showProceedConfirmation, setShowProceedConfirmation] = useState(false);

    // Calculate auction summary for proceed confirmation
    const calculateAuctionSummary = () => {
        const totalPlayers = players.length;
        const totalTeams = Object.keys(teams).length;
        // Use originalPlayersPerTeam if available, otherwise fall back to playersToBuy for backward compatibility
        const playersPerTeam = totalTeams > 0 ? (Object.values(teams)[0]?.originalPlayersPerTeam || Object.values(teams)[0]?.playersToBuy || 0) : 0;
        const teamBudget = totalTeams > 0 ? Object.values(teams)[0]?.purse || 0 : 0;
        
        // Players with valid photos (non-empty photo URLs)
        const playersWithValidPhoto = players.filter(p => p.photo && p.photo.includes('.supabase.co/storage/v1/object/')).length;
        const playersWithLinkedPhoto = players.filter(p => p.photo && p.photo.trim() && !p.photo.includes('data:image/svg+xml') && !p.photo.includes('.supabase.co/storage/v1/object/')).length;
        
        // Players with valid CricHeroes links
        const playersWithCricHeroes = players.filter(p => p.cricHeroesProfile && p.cricHeroesProfile.trim()).length;

        return {
            totalPlayers,
            totalTeams,
            playersPerTeam,
            teamBudget,
            playersWithValidPhoto,
            playersWithLinkedPhoto,
            playersWithCricHeroes
        };
    };

    // Handle proceed button click
    const handleProceedClick = () => {
        setShowProceedConfirmation(true);
    };

    // Confirm proceed to category config
    const confirmProceed = async () => {
        setShowProceedConfirmation(false);
        
        // Save progress when proceeding to category config
        if (authUser?.id && isTournamentNameSet) {
            try {
                const currentState = {
                    players,
                    teams,
                    tournamentName,
                    isTournamentNameSet,
                    whatsappSettings,
                    categoryConfigs,
                    auctionStarted: false, // Not started yet, just proceeding to config
                    selectedCategory: null,
                    completedCategories: []
                };
                
                await persistence.saveState(currentState);
                console.log('?? Progress saved when proceeding to category configuration');
                
                showManagedToast('success', `Progress saved! Proceeding to category configuration.`, {
                    style: {
                        border: '2px solid #10b981',
                        padding: '16px',
                        color: '#065f46',
                        fontWeight: 'bold',
                        fontSize: '1.05rem',
                        background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
                        boxShadow: '0 4px 24px 0 #10b981',
                    },
                    icon: EMOJIS.SAVEDISK,
                    duration: 3000,
                });
            } catch (error) {
                console.error('? Failed to save progress when proceeding:', error);
                showManagedToast('error', 'Failed to save progress, but proceeding anyway.', {
                    style: {
                        border: '2px solid #ef4444',
                        padding: '16px',
                        color: '#b91c1c',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        background: 'linear-gradient(90deg, #fee2e2 0%, #fecaca 100%)',
                        boxShadow: '0 4px 24px 0 #ef4444',
                    },
                    icon: EMOJIS.FAILURE,
                    duration: 4000,
                });
            }
        }
        
        onStartAuction();
    };

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
        setUploadProgress(0);

        parseCSV(file, async (data) => {
            try {
                validatePlayerCSV(data);

                const enrichedPlayers = [];
                const totalPlayers = data.length;
                const normalizedName = (value) => String(value || '')
                    .replace(/[\u200B-\u200D\uFEFF\uFFFD]/g, '')
                    .trim()
                    .replace(/\s+/g, ' ')
                    .toLowerCase();

                const nameCounts = new Map();
                data.forEach((row) => {
                    const key = normalizedName(row.Name);
                    if (key) nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
                });

                const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://auction-backend-xeai.onrender.com";
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                const accessToken = sessionData?.session?.access_token;
                if (sessionError || !accessToken || !authUser?.id) {
                    throw new Error("Your login session could not be verified. Please sign in again before uploading players.");
                }
                const summary = { reused: 0, uploaded: 0, missing: 0, failed: 0, duplicates: 0 };

                for (const [index, row] of data.entries()) {
                    const name = (row["Name"] || "").replace(/[\u200B-\u200D\uFEFF\uFFFD]/g, '').trim();
                    const skill = (row["Skillset"] || "").replace(/[\u200B-\u200D\uFEFF\uFFFD]/g, '').trim();
                    const category = (row["Category"] || "").replace(/[\u200B-\u200D\uFEFF\uFFFD]/g, '').trim() || "OPEN";
                    const originalPhotoLink = (row["Photo Link"] || "").trim();
                    const rawPhotoUrl = formatDriveLink(originalPhotoLink);
                    const cricHeroesProfile = formatCricHeroesProfile(row["CricHeroes_Profile"] || "");

                    if (!name) {
                        setUploadProgress(Math.round(((index + 1) / totalPlayers) * 100));
                        continue;
                    }

                    const isDuplicateInCsv = (nameCounts.get(normalizedName(name)) || 0) > 1;
                    if (isDuplicateInCsv) summary.duplicates++;

                    let selectedPhoto = '';
                    let source = '';
                    let lastError = null;

                    for (let attempt = 0; attempt <= 2; attempt++) {
                        try {
                            const response = await fetch(`${API_BASE_URL}/api/upload-player`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    name,
                                    skill,
                                    category,
                                    photoUrl: originalPhotoLink,
                                    forceDownload: isDuplicateInCsv,
                                    cricHeroesProfile,
                                    tournamentName: tournamentName || null,
                                    accessToken
                                })
                            });

                            const result = await response.json().catch(() => ({}));
                            if (response.ok) {
                                source = result.source || '';
                                if (source === 'missing' && result.player_saved) {
                                    // Missing photo is a successful player import, not an upload failure.
                                    selectedPhoto = getDefaultPlayerImage();
                                    summary.missing++;
                                } else {
                                    selectedPhoto = result.image_url || '';
                                    if (source === 'storage') summary.reused++;
                                    else if (source === 'drive') summary.uploaded++;
                                    else if (source === 'missing') summary.missing++;
                                }
                                break;
                            }

                            lastError = new Error(result.message || `API request failed: ${response.status} ${response.statusText}`);
                            if (response.status < 500) break;
                        } catch (requestError) {
                            lastError = requestError;
                        }

                        if (attempt < 2) {
                            console.warn(`Retry ${attempt + 1}/2 for ${name}: ${lastError?.message || 'request failed'}`);
                            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
                        }
                    }

                    if (!selectedPhoto) {
                        if (source !== 'missing') summary.failed++;
                        // If the backend saved the player without a photo, keep
                        // the placeholder; never treat this as a failed upload.
                        selectedPhoto = source === 'missing'
                            ? getDefaultPlayerImage()
                            : (rawPhotoUrl || getDefaultPlayerImage());
                        if (source !== 'missing') {
                            console.warn(`Photo processing did not return a Storage URL for ${name}:`, lastError?.message || source);
                        }
                    }

                    enrichedPlayers.push({
                        id: index,
                        name,
                        skill,
                        category,
                        photo: selectedPhoto,
                        driveLink: originalPhotoLink,
                        cricHeroesProfile,
                        sold: false,
                        soldTo: null,
                        soldPrice: null,
                    });

                    setUploadProgress(Math.round(((index + 1) / totalPlayers) * 100));
                }

                if (enrichedPlayers.length === 0) {
                    onError(`${EMOJIS.WARNING} No valid players were processed! Please check your CSV file format and ensure player names are provided.`);
                } else {
                    onPlayersLoad(enrichedPlayers);
                    console.log("Player CSV photo processing summary:", summary);
                    if (showManagedToast) {
                        showManagedToast('success',
                            `Players loaded: ${enrichedPlayers.length}. Photos reused: ${summary.reused}; uploaded: ${summary.uploaded}; missing: ${summary.missing}; failed: ${summary.failed}; duplicate rows: ${summary.duplicates}.`);
                    }
                }

                setIsUploadingPlayers(false);
                setUploadProgress(0);
            } catch (err) {
                onError(err.message);
                e.target.value = '';
                setIsUploadingPlayers(false);
                setUploadProgress(0);
            }
        }, (err) => {
            onError(`${EMOJIS.CROSS_MARK} Failed to read CSV file: ${err}`);
            e.target.value = '';
            setIsUploadingPlayers(false);
            setUploadProgress(0);
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
                            purse: parseInt(team["Total Points"], 10) || 0,
                            initialPurse: parseInt(team["Total Points"], 10) || 0,
                            baseInitialPurse: parseInt(team["Total Points"], 10) || 0,
                            boosterCount: 0,
                            pointsPerBooster: 10,
                            playersToBuy: parseInt(team["Players per Team"], 10) || 0,
                            originalPlayersPerTeam: parseInt(team["Players per Team"], 10) || 0, // Store original value
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
            ['Name', 'Skillset', 'Photo Link', 'Category', 'CricHeroes_Profile'],
            ['Virat Kohli', 'Batsman', 'https://example.com/virat.jpg', 'PLATINUM', 'https://cricheroes.com/player-profile/1234567/virat-kohli'],
            ['Jasprit Bumrah', 'Bowler', 'https://example.com/bumrah.jpg', 'ICON', 'https://cricheroes.com/player-profile/2345678/jasprit-bumrah'],
            ['MS Dhoni', 'Wicket Keeper', 'https://example.com/dhoni.jpg', 'GOLD', 'https://cricheroes.com/player-profile/3456789/ms-dhoni'],
            ['Ravindra Jadeja', 'All Rounder', 'https://example.com/jadeja.jpg', 'SILVER', 'https://cricheroes.com/player-profile/4567890/ravindra-jadeja'],
            ['Sample Player', 'Batsman', 'https://example.com/sample.jpg', 'OPEN', '']
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
            ['Team Name', 'Owner Name', 'Total Points', 'Players per Team'],
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

    // Function to open players CSV help file in new tab
    const openPlayersHelpFile = () => {
        const currentDate = new Date().toLocaleDateString();
        const helpContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Players CSV File Instructions - Auction Dugout</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #f9f9f9;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #4F46E5;
            margin: 0;
            font-size: 2.2em;
        }
        .header .subtitle {
            color: #6B7280;
            font-size: 1.1em;
            margin-top: 5px;
        }
        h2 {
            color: #1F2937;
            border-left: 4px solid #10B981;
            padding-left: 15px;
            margin-top: 30px;
        }
        h3 {
            color: #374151;
            margin-top: 25px;
        }
        .required-columns, .optional-columns {
            background: #F3F4F6;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .required-columns {
            border-left: 4px solid #EF4444;
        }
        .optional-columns {
            border-left: 4px solid #10B981;
        }
        .column-item {
            margin: 10px 0;
            padding: 8px;
            background: white;
            border-radius: 5px;
            border: 1px solid #E5E7EB;
        }
        .column-name {
            font-weight: bold;
            color: #1F2937;
        }
        .column-desc {
            color: #6B7280;
            margin-left: 10px;
        }
        .examples {
            background: #EFF6FF;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #DBEAFE;
            margin: 15px 0;
        }
        .example-item {
            font-family: 'Courier New', monospace;
            background: #F8FAFC;
            padding: 8px;
            margin: 5px 0;
            border-radius: 4px;
            border: 1px solid #E2E8F0;
        }
        .tip-box {
            background: #FEFCE8;
            border: 1px solid #FDE047;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .tip-box h4 {
            color: #CA8A04;
            margin: 0 0 10px 0;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin: 8px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 0.9em;
        }
        .csv-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 0.9em;
        }
        .csv-table th, .csv-table td {
            border: 1px solid #D1D5DB;
            padding: 8px 12px;
            text-align: left;
        }
        .csv-table th {
            background: #F9FAFB;
            font-weight: bold;
            color: #374151;
        }
        .csv-table tr:nth-child(even) {
            background: #F9FAFB;
        }
        @media print {
            body { background-color: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${String.fromCodePoint(0x1F3CF)} Players CSV File Instructions</h1>
            <div class="subtitle">Auction Dugout - Cricket Auction Management System</div>
            <div class="subtitle">Generated: ${currentDate}</div>
        </div>

        <h2>${String.fromCodePoint(0x1F4CB)} Required Columns</h2>
        <div class="required-columns">
            <div class="column-item">
                <span class="column-name">1. Name</span>
                <span class="column-desc">- Player's full name (Required)</span>
            </div>
            <div class="column-item">
                <span class="column-name">2. Skillset</span>
                <span class="column-desc">- Player's primary skill (e.g., Batsman, Bowler, All Rounder, Wicket Keeper)</span>
            </div>
            <div class="column-item">
                <span class="column-name">3. Photo Link</span>
                <span class="column-desc">- URL to player's photo (Google Drive links supported)</span>
            </div>
            <div class="column-item">
                <span class="column-name">4. Category</span>
                <span class="column-desc">- Player category (PLATINUM, ICON, GOLD, SILVER, OPEN)</span>
            </div>
        </div>

        <h2>${String.fromCodePoint(0x1F3AF)} Optional Columns</h2>
        <div class="optional-columns">
            <div class="column-item">
                <span class="column-name">5. CricHeroes_Profile</span>
                <span class="column-desc">- CricHeroes profile URL (Optional)</span>
            </div>
        </div>

        <h2>${String.fromCodePoint(0x2728)} CricHeroes_Profile Column Details</h2>
        <ul>
            <li>This column should contain only the CricHeroes profile URL</li>
            <li>Format: https://cricheroes.com/player-profile/{playerId}/{playerName}</li>
            <li>If no valid URL is found, the field will be ignored</li>
        </ul>

        <h3>Valid Entry Example:</h3>
        <div class="examples">
            <div class="example-item">"https://cricheroes.com/player-profile/5594432/amit-gandhi"</div>
        </div>

        <h2>${String.fromCodePoint(0x1F4C1)} Photo Link Guidelines</h2>
        <ul>
            <li>Google Drive links are automatically converted to proper format</li>
            <li>Direct image URLs (jpg, png, gif, webp) are supported</li>
            <li>Ensure photos are publicly accessible</li>
            <li>Recommended image size: 400x400 pixels minimum</li>
        </ul>

        <h2>${String.fromCodePoint(0x1F4CA)} Example CSV Structure</h2>
        <table class="csv-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Skillset</th>
                    <th>Photo Link</th>
                    <th>Category</th>
                    <th>CricHeroes_Profile</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Virat Kohli</td>
                    <td>Batsman</td>
                    <td>https://example.com/virat.jpg</td>
                    <td>PLATINUM</td>
                    <td>https://cricheroes.com/player-profile/1234567/virat-kohli</td>
                </tr>
                <tr>
                    <td>Jasprit Bumrah</td>
                    <td>Bowler</td>
                    <td>https://example.com/bumrah.jpg</td>
                    <td>ICON</td>
                    <td>https://cricheroes.com/player-profile/2345678/jasprit-bumrah</td>
                </tr>
                <tr>
                    <td>MS Dhoni</td>
                    <td>Wicket Keeper</td>
                    <td>https://example.com/dhoni.jpg</td>
                    <td>GOLD</td>
                    <td>https://cricheroes.com/player-profile/3456789/ms-dhoni</td>
                </tr>
                <tr>
                    <td>Ravindra Jadeja</td>
                    <td>All Rounder</td>
                    <td>https://example.com/jadeja.jpg</td>
                    <td>SILVER</td>
                    <td>https://cricheroes.com/player-profile/4567890/ravindra-jadeja</td>
                </tr>
                <tr>
                    <td>Sample Player</td>
                    <td>Batsman</td>
                    <td>https://example.com/sample.jpg</td>
                    <td>OPEN</td>
                    <td></td>
                </tr>
            </tbody>
        </table>

        <div class="tip-box">
            <h4>${String.fromCodePoint(0x2728)} Pro Tips</h4>
            <ul>
                <li>Use consistent naming conventions for players</li>
                <li>Double-check category assignments for better auction organization</li>
                <li>Test photo links before uploading to ensure they work</li>
                <li>Keep a backup of your CSV file</li>
                <li>Use the sample CSV as a template</li>
                <li>For CricHeroes_Profile, prefer clean URLs without additional text</li>
            </ul>
        </div>

        <div class="footer">
            <p><strong>Auction Dugout</strong> - Cricket Auction Management System</p>
            <p>For support, contact: <a href="https://wa.me/+917276319578">WhatsApp Support</a></p>
        </div>
    </div>
</body>
</html>`;

        // Open in new tab instead of downloading
        const blob = new Blob([helpContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        // Clean up the URL after a short delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

        // Focus the new window if it opened successfully
        if (newWindow) {
            newWindow.focus();
        }
    };

    // Function to open teams CSV help file in new tab
    const openTeamsHelpFile = () => {
        const currentDate = new Date().toLocaleDateString();
        const helpContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teams CSV File Instructions - Auction Dugout</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #f9f9f9;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #7C3AED;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #7C3AED;
            margin: 0;
            font-size: 2.2em;
        }
        .header .subtitle {
            color: #6B7280;
            font-size: 1.1em;
            margin-top: 5px;
        }
        h2 {
            color: #1F2937;
            border-left: 4px solid #10B981;
            padding-left: 15px;
            margin-top: 30px;
        }
        h3 {
            color: #374151;
            margin-top: 25px;
        }
        .required-columns {
            background: #F3F4F6;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #EF4444;
        }
        .column-item {
            margin: 10px 0;
            padding: 8px;
            background: white;
            border-radius: 5px;
            border: 1px solid #E5E7EB;
        }
        .column-name {
            font-weight: bold;
            color: #1F2937;
        }
        .column-desc {
            color: #6B7280;
            margin-left: 10px;
        }
        .validation-box {
            background: #FEF2F2;
            border: 1px solid #FECACA;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .validation-box h4 {
            color: #DC2626;
            margin: 0 0 10px 0;
        }
        .tip-box {
            background: #FEFCE8;
            border: 1px solid #FDE047;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .tip-box h4 {
            color: #CA8A04;
            margin: 0 0 10px 0;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin: 8px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            color: #6B7280;
            font-size: 0.9em;
        }
        .csv-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 0.9em;
        }
        .csv-table th, .csv-table td {
            border: 1px solid #D1D5DB;
            padding: 8px 12px;
            text-align: left;
        }
        .csv-table th {
            background: #F9FAFB;
            font-weight: bold;
            color: #374151;
        }
        .csv-table tr:nth-child(even) {
            background: #F9FAFB;
        }
        @media print {
            body { background-color: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${String.fromCodePoint(0x1F3C6)} Teams CSV File Instructions</h1>
            <div class="subtitle">Auction Dugout - Cricket Auction Management System</div>
            <div class="subtitle">Generated: ${currentDate}</div>
        </div>

        <h2>${String.fromCodePoint(0x1F4CB)} Required Columns</h2>
        <div class="required-columns">
            <div class="column-item">
                <span class="column-name">1. Team Name</span>
                <span class="column-desc">- Name of the team (Required, must be unique)</span>
            </div>
            <div class="column-item">
                <span class="column-name">2. Owner Name</span>
                <span class="column-desc">- Name of the team owner (Required)</span>
            </div>
            <div class="column-item">
                <span class="column-name">3. Total Points</span>
                <span class="column-desc">- Total budget amount for the team (Required, numeric value) - should be same for all teams</span>
            </div>
            <div class="column-item">
                <span class="column-name">4. Players per Team</span>
                <span class="column-desc">- Total number of players the team needs (Required) - should be same for all teams</span>
            </div>
        </div>

        <div class="validation-box">
            <h4>${String.fromCodePoint(0x26A0, 0xFE0F)} Data Validation Rules</h4>
            <ul>
                <li>Team Name and Owner Name cannot be empty</li>
                <li>Total Points must be a positive number (greater than 0) - same for all teams</li>
                <li>Players per Team must be a positive number (greater than 0) - same for all teams</li>
                <li>No duplicate team names allowed</li>
                <li>Numeric values should not contain currency symbols or commas</li>
            </ul>
        </div>

        <h2>${String.fromCodePoint(0x1F4CA)} Example CSV Structure</h2>
        <table class="csv-table">
            <thead>
                <tr>
                    <th>Team Name</th>
                    <th>Owner Name</th>
                    <th>Total Points</th>
                    <th>Players per Team</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Mumbai Indians</td>
                    <td>Mukesh Ambani</td>
                    <td>80000000</td>
                    <td>25</td>
                </tr>
                <tr>
                    <td>Chennai Super Kings</td>
                    <td>N. Srinivasan</td>
                    <td>80000000</td>
                    <td>25</td>
                </tr>
                <tr>
                    <td>Royal Challengers Bangalore</td>
                    <td>Vijay Mallya</td>
                    <td>80000000</td>
                    <td>25</td>
                </tr>
                <tr>
                    <td>Kolkata Knight Riders</td>
                    <td>Shah Rukh Khan</td>
                    <td>80000000</td>
                    <td>25</td>
                </tr>
                <tr>
                    <td>Delhi Capitals</td>
                    <td>JSW Group</td>
                    <td>80000000</td>
                    <td>25</td>
                </tr>
            </tbody>
        </table>

        <h2>${String.fromCodePoint(0x2728)} Key Features</h2>
        <ul>
            <li><strong>Equal Budget:</strong> All teams start with the same total points budget</li>
            <li><strong>Equal Squad Size:</strong> All teams need to buy the same number of players</li>
            <li><strong>Clean & Simple:</strong> No complex retention rules or pre-assignments</li>
            <li><strong>Fair Competition:</strong> Every team starts on equal footing</li>
        </ul>

        <div class="tip-box">
            <h4>${String.fromCodePoint(0x2728)} Best Practices</h4>
            <ul>
                <li>Use consistent naming conventions for teams</li>
                <li>Ensure total points are realistic for your auction type</li>
                <li>Set appropriate player counts based on your tournament format</li>
                <li>Keep team names short and memorable</li>
                <li>Use the sample CSV as a template</li>
                <li>Double-check all numeric values before uploading</li>
            </ul>
        </div>

        <div class="footer">
            <p><strong>Auction Dugout</strong> - Cricket Auction Management System</p>
            <p>For support, contact: <a href="https://wa.me/+917276319578">WhatsApp Support</a></p>
        </div>
    </div>
</body>
</html>`;

        // Open in new tab instead of downloading
        const blob = new Blob([helpContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        // Clean up the URL after a short delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

        // Focus the new window if it opened successfully
        if (newWindow) {
            newWindow.focus();
        }
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
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-blue-700 bg-blue-100 rounded-lg p-3">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                    Processing players CSV... {uploadProgress}%
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-2.5">
                                    <div 
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
						
                        {players.length > 0 && (
                            <div className="flex items-center text-sm text-green-700 bg-green-100 rounded-lg p-3">
                                <span className="mr-2">{EMOJIS.CHECK_MARK}</span>
                                <strong>{players.length} players loaded successfully!</strong>
                            </div>
                        )}
						
                        <div className="flex gap-2">
                            <button
                                onClick={downloadSamplePlayersCSV}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                {EMOJIS.DOWNLOAD} Download Sample
                            </button>
                            <button
                                onClick={openPlayersHelpFile}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                title="Open detailed instructions in new tab"
                            >
                                {EMOJIS.SPARKLES} Help Guide
                            </button>
                        </div>
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
                        
                        {Object.keys(teams).length > 0 && (
                            <div className="flex items-center text-sm text-green-700 bg-green-100 rounded-lg p-3">
                                <span className="mr-2">{EMOJIS.CHECK_MARK}</span>
                                <strong>{Object.keys(teams).length} teams loaded successfully!</strong>
                            </div>
                        )}
                        
                        <div className="flex gap-2">
                            <button
                                onClick={downloadSampleTeamsCSV}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                {EMOJIS.DOWNLOAD} Download Sample
                            </button>
                            <button
                                onClick={openTeamsHelpFile}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                title="Open detailed instructions in new tab"
                            >
                                {EMOJIS.SPARKLES} Help Guide
                            </button>
                        </div>
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
                    onClick={handleProceedClick}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    disabled={players.length === 0 || Object.keys(teams).length === 0 || isUploadingPlayers || isUploadingTeams}
                >
                    <span className="text-xl">{EMOJIS.FORWARD_ARROW}</span>
                    Proceed
                </button>
            </div>

            {/* Proceed Confirmation Popup */}
            {showProceedConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="text-center mb-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                                <span className="text-4xl">{EMOJIS.FORWARD_ARROW}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Ready to Proceed?
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Please review the auction summary below before proceeding to category configuration
                            </p>
                        </div>

                        {/* Auction Summary */}
                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span>{EMOJIS.CLIPBOARD}</span>
                                Auction Summary
                            </h4>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                                    <span className="font-medium text-gray-800">Total Players</span>
                                    <span className="font-bold text-blue-600">{calculateAuctionSummary().totalPlayers}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                                    <span className="font-medium text-gray-800">Total Teams</span>
                                    <span className="font-bold text-purple-600">{calculateAuctionSummary().totalTeams}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                                    <span className="font-medium text-gray-800">Players per Team</span>
                                    <span className="font-bold text-green-600">{calculateAuctionSummary().playersPerTeam}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                                    <span className="font-medium text-gray-800">Team Budget</span>
                                    <span className="font-bold text-green-600">{EMOJIS.CURRENCY_RUPEE}{calculateAuctionSummary().teamBudget.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                                    <span className="font-medium text-gray-800">Players with Photos</span>
                                    <span className="font-bold text-blue-600">{calculateAuctionSummary().playersWithValidPhoto}/{calculateAuctionSummary().totalPlayers}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                                    <span className="font-medium text-gray-800">CricHeroes Profiles</span>
                                    <span className="font-bold text-orange-600">{calculateAuctionSummary().playersWithCricHeroes}/{calculateAuctionSummary().totalPlayers}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => setShowProceedConfirmation(false)}
                                className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-2"
                            >
                                <span>{EMOJIS.CROSS_MARK}</span>
                                Cancel
                            </button>
                            <button
                                onClick={confirmProceed}
                                className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg flex items-center justify-center gap-2"
                            >
                                <span>{EMOJIS.FORWARD_ARROW}</span>
                                Yes, Proceed!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileUpload;