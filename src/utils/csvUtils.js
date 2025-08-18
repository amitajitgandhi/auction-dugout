import React from "react";
import Papa from "papaparse";
import { EMOJIS } from "./constants";

// Helper function to check if a row is mostly empty (for lenient validation)
export const isRowMostlyEmpty = (row, requiredFields) => {
    const filledFields = requiredFields.filter(field => row[field] && row[field].trim() !== "");
    return filledFields.length === 0; // Only consider completely empty rows as invalid
};

// Always return Google Drive thumbnail URL for Google Drive links
export const formatDriveLink = (link) => {
    if (!link || typeof link !== 'string') return '';
    
    const trimmedLink = link.trim();
    if (!trimmedLink) return '';
    
    // Always use thumbnail for Google Drive
    let match = trimmedLink.match(/\/file\/d\/([a-zA-Z0-9-_]+)/) || trimmedLink.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (match) {
        const fileId = match[1];
        return `https://drive.google.com/thumbnail?id=${fileId}`;
    }
    
    // If it's already a proper image URL format, return as-is
    if (trimmedLink.includes('drive.google.com/uc?export=view') ||
        trimmedLink.includes('drive.google.com/thumbnail') ||
        trimmedLink.includes('imgur.com') || 
        trimmedLink.includes('dropbox.com') ||
        trimmedLink.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        console.log(`${EMOJIS.CHECK_MARK} Using link as-is (already proper format):`, trimmedLink);
        return trimmedLink;
    }
    
    // If it's a Google Drive uc download URL, convert to view
    if (trimmedLink.includes('drive.google.com/uc')) {
        const fileIdMatch = trimmedLink.match(/[?&]id=([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
            const fileId = fileIdMatch[1];
            const viewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
            console.log(`${EMOJIS.CHECK_MARK} Converted uc URL to view URL:`, viewUrl);
            return viewUrl;
        }
    }
    
    console.warn(`${EMOJIS.WARNING} Could not format Google Drive link for image display:`, trimmedLink);
    return trimmedLink; // Return original if we can't format it
};

// Parse CSV file
export const parseCSV = (file, callback, onError) => {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy', // More aggressive empty line skipping
        complete: (results) => callback(results.data),
        error: (error) => {
            onError(`CSV parsing failed: ${error.message}`);
        }
    });
};

// Helper function to detect what type of CSV was uploaded
const detectCSVType = (columns) => {
    const playerColumns = ["Name", "Skillset", "Photo Link", "Category", "CricHeroes_Profile"];
    const teamColumns = ["Team Name", "Owner Name", "Total Points", "Total Players to Buy", "Owner Retained", "Owner Retained at", "Owner Category"];
    
    const playerMatches = playerColumns.filter(col => columns.includes(col)).length;
    const teamMatches = teamColumns.filter(col => columns.includes(col)).length;
    
    if (teamMatches >= 4) return 'teams'; // Increased threshold since we have more columns
    if (playerMatches >= 2) return 'players';
    return 'unknown';
};

// CSV Validation Functions - Enhanced with better error messages using EMOJIS constants
export const validatePlayerCSV = (data) => {
    if (!data || data.length === 0) {
        throw new Error(`${EMOJIS.CROSS_MARK} Player CSV file is empty. Please check your file and try again.`);
    }

    const requiredColumns = ["Name", "Skillset", "Photo Link", "Category"];
    const optionalColumns = ["CricHeroes_Profile"]; // New optional column
    const allValidColumns = [...requiredColumns, ...optionalColumns];
    
    const firstRow = data[0];
    const actualColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    console.log('?? CSV Validation Debug:');
    console.log('Required columns:', requiredColumns);
    console.log('Optional columns:', optionalColumns);
    console.log('Actual columns found:', actualColumns);
    console.log('Missing required columns:', missingColumns);
    
    if (missingColumns.length > 0) {
        // Detect if they uploaded the wrong type of CSV
        const csvType = detectCSVType(actualColumns);
        
        if (csvType === 'teams') {
            throw new Error(`${EMOJIS.CROSS_MARK} Wrong file type! You uploaded a Teams CSV file.\n\n${EMOJIS.CLIPBOARD} Please upload a Players CSV file with columns: Name, Skillset, Photo Link, Category, CricHeroes_Profile (optional)\n\n${EMOJIS.SPARKLES} Tip: Use the 'Download Sample Players CSV' button for the correct format.`);
        } else if (csvType === 'unknown') {
            throw new Error(`${EMOJIS.CROSS_MARK} Invalid CSV format!\n\n${EMOJIS.CLIPBOARD} Required columns: Name, Skillset, Photo Link, Category\n${EMOJIS.CLIPBOARD} Optional columns: CricHeroes_Profile\n\n${EMOJIS.FOLDER} Your file has: ${actualColumns.join(', ')}\n\n${EMOJIS.SPARKLES} Tip: Download the sample file to see the correct format.`);
        } else {
            throw new Error(`${EMOJIS.CROSS_MARK} Missing required columns: ${missingColumns.join(', ')}\n\n${EMOJIS.SPARKLES} Please ensure your CSV has the exact column headers shown in the sample file.\n\n${EMOJIS.INFO} Note: CricHeroes_Profile column is optional.`);
        }
    }

    // Filter out completely empty rows first
    const validRows = data.filter(row => !isRowMostlyEmpty(row, requiredColumns));
    
    if (validRows.length === 0) {
        throw new Error(`${EMOJIS.CROSS_MARK} No valid data found in the Players CSV file.\n\n${EMOJIS.SPARKLES} Please check that your file contains player data.`);
    }

    // Basic validation - only count rows with missing essential data
    let errorCount = 0;
    validRows.forEach((row, index) => {
        // Only count as error if name is missing (category can be empty as it defaults to "OPEN")
        const hasName = row.Name && row.Name.trim() !== "";
        
        if (!hasName) {
            console.log(`${EMOJIS.WARNING} Row ${index + 2} missing essential data:`, {
                name: row.Name,
                category: row.Category,
                skillset: row.Skillset,
                photoLink: row["Photo Link"],
                cricHeroesProfile: row["CricHeroes_Profile"]
            });
            errorCount++;
        }
        
        // Validate CricHeroes_Profile format if provided
        if (row["CricHeroes_Profile"] && row["CricHeroes_Profile"].trim()) {
            const profileText = row["CricHeroes_Profile"].trim();
            const extractedUrl = formatCricHeroesProfile(profileText);
            
            if (profileText && !extractedUrl) {
                console.log(`${EMOJIS.WARNING} Row ${index + 2} has invalid CricHeroes_Profile format:`, profileText);
                console.log(`${EMOJIS.INFO} Expected format: Text with https://cricheroes.com/player-profile/{playerId}/{playerName}`);
            }
        }
    });

    // Be more lenient - only throw error if more than 50% of rows have issues
    if (errorCount > validRows.length * 0.5) {
        throw new Error(`${EMOJIS.CROSS_MARK} Too many validation errors (${errorCount}/${validRows.length} rows).\n\n${EMOJIS.SPARKLES} Please ensure each player has at least a Name. Other fields can be empty.\n\n${EMOJIS.INFO} CricHeroes_Profile should be in format: https://cricheroes.com/player-profile/{playerId}/{playerName}`);
    }

    console.log(`${EMOJIS.CHECK_MARK} CSV validation passed: ${validRows.length} valid rows found`);
    return true;
};

export const validateTeamCSV = (data) => {
    if (!data || data.length === 0) {
        throw new Error(`${EMOJIS.CROSS_MARK} Team CSV file is empty. Please check your file and try again.`);
    }

    const requiredColumns = ["Team Name", "Owner Name", "Total Points", "Total Players to Buy", "Owner Retained", "Owner Retained at", "Owner Category"];
    const firstRow = data[0];
    const actualColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    console.log('?? Team CSV Validation Debug:');
    console.log('Required columns:', requiredColumns);
    console.log('Actual columns found:', actualColumns);
    console.log('Missing required columns:', missingColumns);
    
    if (missingColumns.length > 0) {
        // Detect if they uploaded the wrong type of CSV
        const csvType = detectCSVType(actualColumns);
        
        if (csvType === 'players') {
            throw new Error(`${EMOJIS.CROSS_MARK} Wrong file type! You uploaded a Players CSV file.\n\n${EMOJIS.CLIPBOARD} Please upload a Teams CSV file with columns:\n• Team Name (Required)\n• Owner Name (Required)\n• Total Points (Required, same for all teams)\n• Total Players to Buy (Required, same for all teams)\n• Owner Retained (Required, Yes/No)\n• Owner Retained at (Required only if Owner Retained = Yes)\n• Owner Category (Required only if Owner Retained = Yes)\n\n${EMOJIS.SPARKLES} Tip: Use the 'Download Sample Teams CSV' button for the correct format.`);
        } else if (csvType === 'unknown') {
            throw new Error(`${EMOJIS.CROSS_MARK} Invalid CSV format!\n\n${EMOJIS.CLIPBOARD} Required columns:\n• Team Name, Owner Name, Total Points, Total Players to Buy, Owner Retained, Owner Retained at, Owner Category\n\n${EMOJIS.FOLDER} Your file has: ${actualColumns.join(', ')}\n\n${EMOJIS.SPARKLES} Tip: Download the sample file to see the correct format.`);
        } else {
            throw new Error(`${EMOJIS.CROSS_MARK} Missing required columns: ${missingColumns.join(', ')}\n\n${EMOJIS.SPARKLES} Please ensure your CSV has the exact column headers shown in the sample file.\n\n${EMOJIS.INFO} Note: Owner Retained at and Owner Category are conditionally required based on Owner Retained value.`);
        }
    }

    // Filter out completely empty rows first
    const validRows = data.filter(row => !isRowMostlyEmpty(row, requiredColumns));
    
    if (validRows.length === 0) {
        throw new Error(`${EMOJIS.CROSS_MARK} No valid data found in the Teams CSV file.\n\n${EMOJIS.SPARKLES} Please check that your file contains team data.`);
    }

    // Basic validation - only count significant errors
    let errorCount = 0;
    const teamNames = new Set();
    
    validRows.forEach((row, index) => {
        const teamName = row["Team Name"] && row["Team Name"].trim();
        const ownerName = row["Owner Name"] && row["Owner Name"].trim();
        const totalPoints = parseInt(row["Total Points"], 10);
        const totalPlayersToBuy = parseInt(row["Total Players to Buy"], 10);
        const ownerRetained = row["Owner Retained"] && row["Owner Retained"].trim().toLowerCase();
        const ownerRetainedAt = parseInt(row["Owner Retained at"], 10);
        const ownerCategory = row["Owner Category"] && row["Owner Category"].trim();
        
        // Check for essential fields
        if (!teamName || !ownerName) {
            console.log(`${EMOJIS.WARNING} Row ${index + 2} missing essential data: Team Name or Owner Name`);
            errorCount++;
        } else if (teamNames.has(teamName)) {
            console.log(`${EMOJIS.WARNING} Row ${index + 2} duplicate team name: ${teamName}`);
            errorCount++; // Duplicate team name
        } else {
            teamNames.add(teamName);
        }
        
        // Check numerical fields
        if (teamName && (isNaN(totalPoints) || totalPoints <= 0 || isNaN(totalPlayersToBuy) || totalPlayersToBuy <= 0)) {
            console.log(`${EMOJIS.WARNING} Row ${index + 2} invalid numerical data: Total Points=${totalPoints}, Total Players to Buy=${totalPlayersToBuy}`);
            errorCount++;
        }
        
        // Validate Owner Retained field
        if (teamName && ownerRetained && ownerRetained !== 'yes' && ownerRetained !== 'no') {
            console.log(`${EMOJIS.WARNING} Row ${index + 2} invalid Owner Retained value: "${ownerRetained}" (should be Yes or No)`);
            errorCount++;
        }
        
        // Validate Owner Retention logic
        if (teamName && ownerRetained === 'yes') {
            if (isNaN(ownerRetainedAt) || ownerRetainedAt <= 0) {
                console.log(`${EMOJIS.WARNING} Row ${index + 2} Owner retained but invalid retention cost: ${ownerRetainedAt}`);
                errorCount++;
            }
        } else if (teamName && ownerRetained === 'no') {
            if (ownerRetainedAt > 0) {
                console.log(`${EMOJIS.WARNING} Row ${index + 2} Owner not retained but retention cost provided: ${ownerRetainedAt}`);
                errorCount++;
            }
        }
    });

    // Be more lenient - only throw error if more than 50% of rows have issues
    if (errorCount > validRows.length * 0.5) {
        throw new Error(`${EMOJIS.CROSS_MARK} Too many validation errors in Teams CSV (${errorCount}/${validRows.length} rows).\n\n${EMOJIS.SPARKLES} Please ensure each team has:\n• Team Name and Owner Name\n• Valid Total Points and Total Players to Buy\n• Owner Retained as "Yes" or "No"\n• Proper owner retention logic\n\n${EMOJIS.INFO} If Owner Retained is "Yes", Owner Retained at must be > 0\n${EMOJIS.INFO} If Owner Retained is "No", Owner Retained at should be 0`);
    }

    console.log(`${EMOJIS.CHECK_MARK} Team CSV validation passed: ${validRows.length} valid teams found`);
    return true;
};

// Extract and format CricHeroes profile URL
export const formatCricHeroesProfile = (profileText) => {
    if (!profileText || typeof profileText !== 'string') return '';
    
    const trimmedText = profileText.trim();
    if (!trimmedText) return '';
    
    // Extract URL starting with https://cricheroes\.com/player-profile/
    const urlMatch = trimmedText.match(/https:\/\/cricheroes\.com\/player-profile\/[^\s]*/);
    if (urlMatch) {
        const extractedUrl = urlMatch[0];
        // Remove any trailing characters that might not be part of the URL
        const cleanUrl = extractedUrl.replace(/[.,;!?]*$/, '');
        // Append /stats at the end
        return cleanUrl + '/stats';
    }
    
    return ''; // Return empty if no valid URL found
};