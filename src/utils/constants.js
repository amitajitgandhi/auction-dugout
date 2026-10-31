// Emoji constants to ensure proper Unicode rendering
export const EMOJIS = {
    TROPHY: String.fromCodePoint(0x1F3C6),
    CRICKET_BAT: String.fromCodePoint(0x1F3CF), 
    PEOPLE: String.fromCodePoint(0x1F465),
    PERSON: String.fromCodePoint(0x1F464),
    MONEY_BAG: String.fromCodePoint(0x1F4B0),
    TARGET: String.fromCodePoint(0x1F3AF),
    SOCCER_BALL: String.fromCodePoint(0x26BD),
    CLIPBOARD: String.fromCodePoint(0x1F4CB),
    MAILBOX: String.fromCodePoint(0x1F4ED),
    BACK_ARROW: String.fromCodePoint(0x2B05, 0xFE0F),
    FORWARD_ARROW: String.fromCodePoint(0x27A1, 0xFE0F),
    GEAR: String.fromCodePoint(0x2699, 0xFE0F),
    CHART: String.fromCodePoint(0x1F4CA),
    REFRESH: String.fromCodePoint(0x1F504),
    FOLDER: String.fromCodePoint(0x1F4C1),
    CHECK_MARK: String.fromCodePoint(0x2705),
    WARNING: String.fromCodePoint(0x26A0, 0xFE0F),
    CROSS_MARK: String.fromCodePoint(0x274C),
    PARTY: String.fromCodePoint(0x1F389),
    BULLET: String.fromCodePoint(0x2022),
    CURRENCY_RUPEE: String.fromCodePoint(0x1F4B0), // Money bag emoji
    SPARKLES: String.fromCodePoint(0x2728),
    STAR: String.fromCodePoint(0x2B50),
    DIZZY: String.fromCodePoint(0x1F4AB),
    ZAP: String.fromCodePoint(0x26A1),
    WHATSAPP: String.fromCodePoint(0x2699, 0xFE0F), // Settings gear emoji
    MOBILE: String.fromCodePoint(0x1F4F1), // Mobile phone emoji
    DOWNLOAD: String.fromCodePoint(0x1F4E5), // Download emoji
    BACKUP: String.fromCodePoint(0x1F4BE), // Backup/Save emoji
    RESTORE: String.fromCodePoint(0x1F504), // Restore/Refresh emoji
    VIDEO: String.fromCodePoint(0x1F4FA), // Video camera emoji
    TEAMOWNERVIEW: String.fromCodePoint(0x1F465), // People emoji,
    WHATSAPPLOGO: String.fromCodePoint(0x1F4F1, 0xFE0F), // WhatsApp logo emoji
    SMARTUI: String.fromCodePoint(0x1F4BB), // Laptop emoji
    EXPORTTEAMS: String.fromCodePoint(0x1F4C8), // Export teams emoji
    NODATALOSS: String.fromCodePoint(0x1F6A8), // No data loss warning emoji
    HEART: String.fromCodePoint(0x2764, 0xFE0F),// Heart emoji 
    SPINWHEEL: String.fromCodePoint(0x1F3A1), // Ferris wheel emoji for spin wheel
    JERSEY: String.fromCodePoint(0x1F455), // Shirt emoji for jersey
    SAVEDISK: String.fromCodePoint(0x1F4BE), // Floppy disk emoji for save
    FAILURE: String.fromCodePoint(0x1F4A5), // Collision emoji for failure
    PENCIL: String.fromCodePoint(0x270F, 0xFE0F), // Pencil emoji for edit
    EDIT: String.fromCodePoint(0x270F, 0xFE0F), // Pencil emoji for edit (alias)
    ARCHIVE: String.fromCodePoint(0x1F4C6), // Archive box emoji
    CAMERA: String.fromCodePoint(0x1F4F7), // Camera emoji, for image export/share actions
    CROWN: String.fromCodePoint(0x1F451), // Crown emoji, for retained owner-players
    LOCK: String.fromCodePoint(0x1F512) // Lock emoji, for players no longer eligible for bidding
};

// Helper to shuffle an array
export const shuffle = (array) => {
    let arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// Helper function to get simple default player image - Standard "no profile pic" style
export const getDefaultPlayerImage = () => {
    // Create a simple "no profile picture" style placeholder
    const svgString = `<svg width="288" height="288" viewBox="0 0 288 288" xmlns="http://www.w3.org/2000/svg">
        <rect width="288" height="288" fill="#f3f4f6" rx="144"/>
        <circle cx="144" cy="115" r="35" fill="#d1d5db"/>
        <path d="M 75 220 Q 75 180 144 180 Q 213 180 213 220 L 213 288 L 75 288 Z" fill="#d1d5db"/>
        <rect x="94" y="240" width="100" height="24" fill="rgba(0,0,0,0.1)" rx="12"/>
        <text x="144" y="256" font-family="Arial, sans-serif" font-size="14" font-weight="normal" fill="#6b7280" text-anchor="middle">No Image</text>
    </svg>`;
    
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
};

// Get simple backup image for extreme fallback
export const getBackupPlayerImage = () => {
    // Simple backup placeholder
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
        <svg width="288" height="288" viewBox="0 0 288 288" xmlns="http://www.w3.org/2000/svg">
            <rect width="288" height="288" fill="#e5e7eb" rx="144"/>
            <circle cx="144" cy="115" r="30" fill="#9ca3af"/>
            <path d="M 85 205 Q 85 175 144 175 Q 203 175 203 205 L 203 288 L 85 288 Z" fill="#9ca3af"/>
            <rect x="119" y="245" width="50" height="18" fill="rgba(0,0,0,0.2)" rx="9"/>
            <text x="144" y="256" font-family="Arial" font-size="12" font-weight="normal" fill="#ffffff" text-anchor="middle">No Photo</text>
        </svg>
    `);
};

// Progressive image error handler with multiple fallback strategies
export const handleImageError = (e) => {
    const originalSrc = e.target.src;
    console.error('?? Image failed to load:', originalSrc);
    
    // Prevent infinite loops by checking what we've already tried
    const currentState = e.target.dataset.fallbackState || 'original';
    
    switch (currentState) {
        case 'original':
            // First fallback: Try Google Drive alternatives
            if (originalSrc.includes('drive.google.com')) {
                const fileIdMatch = originalSrc.match(/[?&]id=([a-zA-Z0-9-_]+)/);
                if (fileIdMatch) {
                    const fileId = fileIdMatch[1];
                    
                    // Try thumbnail URL
                    if (!originalSrc.includes('thumbnail')) {
                        console.log('?? Trying Google Drive thumbnail URL...');
                        e.target.dataset.fallbackState = 'thumbnail';
                        e.target.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`;
                        return;
                    }
                    
                    // Try view URL
                    if (!originalSrc.includes('export=view')) {
                        console.log('?? Trying Google Drive view URL...');
                        e.target.dataset.fallbackState = 'view';
                        e.target.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
                        return;
                    }
                }
            }
            // Fall through to default
            
        case 'thumbnail':
        case 'view':
            // Second fallback: Try default player image
            console.log('?? Trying default player image...');
            e.target.dataset.fallbackState = 'default';
            e.target.src = getDefaultPlayerImage();
            return;
            
        case 'default':
            // Third fallback: Try backup image
            console.log('?? Trying backup player image...');
            e.target.dataset.fallbackState = 'backup';
            e.target.src = getBackupPlayerImage();
            return;
            
        case 'backup':
            // Final fallback: Replace with a div
            console.error('? All image fallbacks failed, replacing with div');
            const parent = e.target.parentElement;
            if (parent) {
                parent.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-red-400 via-red-500 to-red-600 flex flex-col items-center justify-center text-white font-bold relative overflow-hidden">
                        <div class="absolute inset-0 bg-black opacity-10"></div>
                        <div class="relative z-10 text-center">
                            <div class="text-4xl mb-2">??</div>
                            <div class="text-lg font-bold mb-1">IMAGE ERROR</div>
                            <div class="text-sm opacity-90">Could not load player image</div>
                        </div>
                        <div class="absolute bottom-4 left-4 right-4 h-1 bg-white opacity-20 rounded"></div>
                    </div>
                `;
            }
            return;
            
        default:
            console.error('? Unknown fallback state:', currentState);
            e.target.src = getDefaultPlayerImage();
            e.target.dataset.fallbackState = 'default';
    }
};

// Toast styles
export const TOAST_STYLES = {
    success: {
        border: '2px solid #10b981',
        padding: '16px',
        color: '#065f46',
        fontWeight: 'bold',
        fontSize: '1.05rem',
        background: 'linear-gradient(90deg, #d1fae5 0%, #a7f3d0 100%)',
        boxShadow: '0 4px 24px 0 #10b981',
    },
    error: {
        border: '2px solid #f59e42',
        padding: '16px',
        color: '#b91c1c',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        background: 'linear-gradient(90deg, #fffbe6 0%, #ffe4e6 100%)',
        boxShadow: '0 4px 24px 0 #fbbf24',
    },
};

// Export teams data to CSV
export const exportTeamsData = (teams, tournamentName) => {
    if (!teams || Object.keys(teams).length === 0) {
        throw new Error('No teams data available to export');
    }

    // Create CSV content
    const csvRows = [];
    
    // Header
    csvRows.push(['Team Name', 'Owner', 'Remaining Purse', 'Players to Buy', 'Player Name', 'Skill', 'Category', 'Purchase Price'].join(','));
    
    // Data rows
    Object.entries(teams).forEach(([teamName, teamData]) => {
        if (teamData.players && teamData.players.length > 0) {
            teamData.players.forEach(player => {
                csvRows.push([
                    `"${teamName}"`,
                    `"${teamData.owner || ''}"`,
                    teamData.purse || 0,
                    teamData.playersToBuy || 0,
                    `"${player.name || ''}"`,
                    `"${player.skill || ''}"`,
                    `"${player.category || ''}"`,
                    player.soldPrice || 0
                ].join(','));
            });
        } else {
            // Include teams with no players
            csvRows.push([
                `"${teamName}"`,
                `"${teamData.owner || ''}"`,
                teamData.purse || 0,
                teamData.playersToBuy || 0,
                '"No players"',
                '""',
                '""',
                '0'
            ].join(','));
        }
    });
    
    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${tournamentName}_Teams_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        throw new Error('File download not supported in this browser');
    }
};

// =============================================================================
// DATA PERSISTENCE UTILITIES
// =============================================================================

// Auction state is persisted in Supabase only. Browser storage is intentionally not used.

// Export complete auction data as JSON file
export const exportAuctionBackup = (auctionData, tournamentName) => {
    try {
        const backupData = {
            ...auctionData,
            exportedAt: new Date().toISOString(),
            version: '1.0',
            appVersion: 'Cricket Auction Tool v1.0'
        };
        
        const jsonContent = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            // Format timestamp as yyyyMMdd_HHmmss
            const now = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            const datePart = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
            const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
            const fileName = `${tournamentName || 'Auction'}_Backup_${datePart}_${timePart}.json`;
            
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return true;
        }
        return false;
    } catch (error) {
        console.error('? Failed to export auction backup:', error);
        return false;
    }
};

// Import auction data from JSON file
export const importAuctionBackup = (file, callback, onError) => {
    try {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const backupData = JSON.parse(e.target.result);
                
                // Validate backup data structure
                if (!backupData.players || !backupData.teams || !backupData.tournamentName) {
                    throw new Error('Invalid backup file format. Missing required data.');
                }
                
                console.log('?? Backup file imported successfully', {
                    timestamp: backupData.exportedAt,
                    playersCount: backupData.players?.length || 0,
                    teamsCount: Object.keys(backupData.teams || {}).length
                });
                
                callback(backupData);
            } catch (parseError) {
                onError(`Failed to parse backup file: ${parseError.message}`);
            }
        };
        
        reader.onerror = () => {
            onError('Failed to read backup file');
        };
        
        reader.readAsText(file);
    } catch (error) {
        onError(`Failed to import backup: ${error.message}`);
    }
};

// Get formatted info about saved state
export const getSavedStateInfo = () => {
    try {
        const savedData = localStorage.getItem(STORAGE_KEYS.AUCTION_STATE);
        if (!savedData) return null;
        
        const parsedData = JSON.parse(savedData);
        return {
            timestamp: parsedData.timestamp,
            tournamentName: parsedData.tournamentName,
            playersCount: parsedData.players?.length || 0,
            teamsCount: Object.keys(parsedData.teams || {}).length,
            hasAuctionStarted: parsedData.auctionStarted || false,
            selectedCategory: parsedData.selectedCategory || null
        };
    } catch (error) {
        return null;
    }
};