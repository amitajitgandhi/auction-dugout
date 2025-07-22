import React from "react";
import Papa from "papaparse";

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
        console.log('? Using link as-is (already proper format):', trimmedLink);
        return trimmedLink;
    }
    
    // If it's a Google Drive uc download URL, convert to view
    if (trimmedLink.includes('drive.google.com/uc')) {
        const fileIdMatch = trimmedLink.match(/[?&]id=([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
            const fileId = fileIdMatch[1];
            const viewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
            console.log('? Converted uc URL to view URL:', viewUrl);
            return viewUrl;
        }
    }
    
    console.warn('?? Could not format Google Drive link for image display:', trimmedLink);
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

// CSV Validation Functions - Enhanced to handle blank rows and empty cells with better error reporting
export const validatePlayerCSV = (data) => {
    if (!data || data.length === 0) {
        throw new Error("Player CSV file is empty.");
    }

    const requiredColumns = ["Name", "Skillset", "Photo Link", "Category"];
    const firstRow = data[0];
    const actualColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    console.log('?? CSV Validation Debug:');
    console.log('Required columns:', requiredColumns);
    console.log('Actual columns found:', actualColumns);
    console.log('Missing columns:', missingColumns);
    console.log('First row data:', firstRow);
    
    if (missingColumns.length > 0) {
        throw new Error(`Player CSV is missing required columns: ${missingColumns.join(', ')}. 
        
Found columns: ${actualColumns.join(', ')}
        
Please ensure your CSV has these exact column headers:
Name, Skillset, Photo Link, Category

Your CSV appears to have: ${actualColumns.join(', ')}`);
    }

    // Filter out completely empty rows first
    const validRows = data.filter(row => !isRowMostlyEmpty(row, requiredColumns));
    
    if (validRows.length === 0) {
        throw new Error("Player CSV contains no valid data rows.");
    }

    // Basic validation - only count rows with missing essential data
    let errorCount = 0;
    validRows.forEach((row, index) => {
        // Only count as error if name is missing (category can be empty as it defaults to "OPEN")
        const hasName = row.Name && row.Name.trim() !== "";
        
        if (!hasName) {
            console.log(`?? Row ${index + 2} missing essential data:`, {
                name: row.Name,
                category: row.Category,
                skillset: row.Skillset,
                photoLink: row["Photo Link"]
            });
            errorCount++;
        }
    });

    // Be more lenient - only throw error if more than 50% of rows have issues
    if (errorCount > validRows.length * 0.5) {
        throw new Error(`Player CSV has too many validation errors (${errorCount}/${validRows.length} rows). Please check your data format.`);
    }

    console.log(`? CSV validation passed: ${validRows.length} valid rows found`);
    return true;
};

export const validateTeamCSV = (data) => {
    if (!data || data.length === 0) {
        throw new Error("Team CSV file is empty.");
    }

    const requiredColumns = ["Team Name", "Owner Name", "Purse", "Players to Buy"];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
        throw new Error("Team CSV is missing required columns. Please check the format.");
    }

    // Filter out completely empty rows first
    const validRows = data.filter(row => !isRowMostlyEmpty(row, requiredColumns));
    
    if (validRows.length === 0) {
        throw new Error("Team CSV contains no valid data rows.");
    }

    // Basic validation - only count significant errors
    let errorCount = 0;
    const teamNames = new Set();
    
    validRows.forEach((row) => {
        const teamName = row["Team Name"] && row["Team Name"].trim();
        const ownerName = row["Owner Name"] && row["Owner Name"].trim();
        const purse = parseInt(row["Purse"], 10);
        const playersToBuy = parseInt(row["Players to Buy"], 10);
        
        // Only count as error if essential fields are missing
        if (!teamName || !ownerName) {
            errorCount++;
        } else if (teamNames.has(teamName)) {
            errorCount++; // Duplicate team name
        } else {
            teamNames.add(teamName);
        }
        
        // Only count as error if numerical fields are clearly invalid
        if (teamName && (isNaN(purse) || purse <= 0 || isNaN(playersToBuy) || playersToBuy <= 0)) {
            errorCount++;
        }
    });

    // Be more lenient - only throw error if more than 50% of rows have issues
    if (errorCount > validRows.length * 0.5) {
        throw new Error(`Team CSV has too many validation errors. Please check your data.`);
    }

    return true;
};