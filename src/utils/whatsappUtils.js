// WhatsApp Integration utilities - Using String.fromCodePoint for proper emoji rendering
export const WHATSAPP_EMOJIS = {
    CRICKET: String.fromCodePoint(0x1F3CF),         // Cricket bat
    TROPHY: String.fromCodePoint(0x1F3C6),          // Trophy
    MONEY: String.fromCodePoint(0x1F4B0),           // Money bag
    FIRE: String.fromCodePoint(0x1F525),            // Fire
    STAR: String.fromCodePoint(0x2B50),             // Star
    PARTY: String.fromCodePoint(0x1F389),           // Party
    HANDSHAKE: String.fromCodePoint(0x1F91D),       // Handshake
    ANNOUNCEMENT: String.fromCodePoint(0x1F4E2),    // Announcement
    PHONE: String.fromCodePoint(0x1F4F1),           // Phone
    TARGET: String.fromCodePoint(0x1F3AF),          // Target
    CHART: String.fromCodePoint(0x1F4CA),           // Chart
    WHATSAPP: String.fromCodePoint(0x1F4F1),        // Phone for WhatsApp
    CHECK_MARK: String.fromCodePoint(0x2705),       // Check mark
    BROKEN_HEART: String.fromCodePoint(0x1F494),    // Broken heart
    CLIPBOARD: String.fromCodePoint(0x1F4CB)        // Clipboard
};

// WhatsApp Web API integration
export const sendWhatsAppMessage = async (message, phoneNumber = null) => {
    try {
        console.log('?? Attempting to send WhatsApp message:', message.substring(0, 100) + '...');
        console.log('?? Raw phone number received:', phoneNumber);
        
        // Encode the message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // Create WhatsApp Web URL
        let whatsappUrl;
        if (phoneNumber && phoneNumber.trim()) {
            // Clean and format phone number properly
            let cleanNumber = phoneNumber.trim();
            
            // Remove all non-digits first
            const digitsOnly = cleanNumber.replace(/\D/g, '');
            console.log('?? Digits only:', digitsOnly);
            
            // Format based on digits length
            let formattedNumber;
            if (digitsOnly.length === 10) {
                // 10 digits: add 91 prefix
                formattedNumber = '91' + digitsOnly;
            } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
                // 12 digits starting with 91: use as is
                formattedNumber = digitsOnly;
            } else if (digitsOnly.length === 13 && digitsOnly.startsWith('91')) {
                // 13 digits starting with 91: remove first digit (probably extra +)
                formattedNumber = digitsOnly.substring(1);
            } else {
                console.warn('?? Unexpected phone number format:', digitsOnly);
                formattedNumber = digitsOnly;
            }
            
            console.log('?? Formatted number for WhatsApp API:', formattedNumber);
            whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodedMessage}`;
        } else {
            // Open WhatsApp Web with pre-filled message (user can choose recipient)
            whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
            console.log('?? Using general WhatsApp Web');
        }
        
        console.log('?? Final WhatsApp URL:', whatsappUrl);
        console.log('?? WhatsApp URL length:', whatsappUrl.length);
        
        // Check if URL is too long (WhatsApp has limits)
        if (whatsappUrl.length > 2000) {
            console.warn('?? WhatsApp URL might be too long, truncating message...');
            const truncatedMessage = message.substring(0, 800) + '\n\n_Message truncated due to length_';
            const encodedTruncated = encodeURIComponent(truncatedMessage);
            
            if (phoneNumber && phoneNumber.trim()) {
                const digitsOnly = phoneNumber.replace(/\D/g, '');
                let formattedNumber;
                if (digitsOnly.length === 10) {
                    formattedNumber = '91' + digitsOnly;
                } else if (digitsOnly.length >= 12) {
                    formattedNumber = digitsOnly.startsWith('91') ? digitsOnly : '91' + digitsOnly;
                } else {
                    formattedNumber = digitsOnly;
                }
                whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodedTruncated}`;
            } else {
                whatsappUrl = `https://web.whatsapp.com/send?text=${encodedTruncated}`;
            }
        }
        
        // Open WhatsApp in new tab - improved approach
        try {
            const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            console.log('? WhatsApp URL opened successfully');
            console.log('?? Window object:', newWindow ? 'returned' : 'null (expected for app links)');
            
            // For WhatsApp URLs, always consider it successful if no error was thrown
            return true;
            
        } catch (windowError) {
            console.error('? Error opening WhatsApp window:', windowError);
            return false;
        }
        
    } catch (error) {
        console.error('? WhatsApp integration error:', error);
        return false;
    }
};

// WhatsApp Web API integration (without browser check - assumes user has verified setup)
export const sendWhatsAppMessageDirect = async (message, phoneNumber = null) => {
    try {
        console.log('?? sendWhatsAppMessageDirect called');
        console.log('?? Raw message:', message.substring(0, 100) + '...');
        console.log('?? Raw phone number:', phoneNumber);
        console.log('?? Phone number type:', typeof phoneNumber);
        
        // Encode the message for URL
        const encodedMessage = encodeURIComponent(message);
        console.log('?? Encoded message length:', encodedMessage.length);
        
        // Format phone number directly here
        let formattedNumber = null;
        if (phoneNumber && phoneNumber.toString().trim()) {
            const digitsOnly = phoneNumber.toString().replace(/\D/g, '');
            console.log('?? Digits extracted:', digitsOnly);
            
            if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
                // 10-digit Indian mobile
                formattedNumber = '91' + digitsOnly;
                console.log('?? 10-digit formatted:', formattedNumber);
            } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
                // 12-digit with 91 prefix
                const mobile = digitsOnly.substring(2);
                if (/^[6-9]/.test(mobile)) {
                    formattedNumber = digitsOnly;
                    console.log('?? 12-digit valid:', formattedNumber);
                }
            } else if (digitsOnly.length === 13) {
                // 13-digit, try removing first digit
                const without1st = digitsOnly.substring(1);
                if (without1st.startsWith('91')) {
                    const mobile = without1st.substring(2);
                    if (/^[6-9]/.test(mobile)) {
                        formattedNumber = without1st;
                        console.log('?? 13-digit corrected:', formattedNumber);
                    }
                }
            }
        }
        
        console.log('?? Final formatted number:', formattedNumber);
        
        let whatsappUrl;
        if (formattedNumber) {
            // Use specific phone number
            whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodedMessage}`;
            console.log('?? Using specific number URL');
        } else {
            // Fallback to general WhatsApp Web
            whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
            console.log('?? Using general WhatsApp Web (no valid phone number)');
        }
        
        console.log('?? Final WhatsApp URL:', whatsappUrl);
        console.log('?? URL length:', whatsappUrl.length);
        
        // Check if URL is too long
        if (whatsappUrl.length > 2000) {
            console.warn('?? URL too long, truncating message...');
            const truncatedMessage = message.substring(0, 800) + '\n\n_Message truncated due to length_';
            const encodedTruncated = encodeURIComponent(truncatedMessage);
            
            if (formattedNumber) {
                whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodedTruncated}`;
            } else {
                whatsappUrl = `https://web.whatsapp.com/send?text=${encodedTruncated}`;
            }
            console.log('?? Truncated URL:', whatsappUrl);
        }
        
        // Open WhatsApp - improved approach for WhatsApp URLs
        console.log('?? Opening WhatsApp window...');
        
        try {
            // For WhatsApp URLs, we use a more reliable approach
            // window.open might return null for external app links, but that doesn't mean it failed
            const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            
            console.log('? WhatsApp URL opened successfully');
            console.log('?? Window object:', newWindow ? 'returned' : 'null (expected for app links)');
            
            // For WhatsApp URLs, always consider it successful if no error was thrown
            // The browser will handle the URL appropriately (open app or web)
            return true;
            
        } catch (windowError) {
            console.error('? Error opening WhatsApp window:', windowError);
            return false;
        }
        
    } catch (error) {
        console.error('? WhatsApp integration error:', error);
        return false;
    }
};

// Send a real test message to the user's contact number
export const sendTestWhatsAppMessage = async (phoneNumber) => {
    try {
        console.log('?? sendTestWhatsAppMessage called');
        console.log('?? Test phone number received:', phoneNumber);
        console.log('?? Phone number type:', typeof phoneNumber);
        console.log('?? Phone number length:', phoneNumber ? phoneNumber.length : 'null');
        
        if (!phoneNumber) {
            console.error('? No phone number provided to test function');
            return false;
        }
        
        // Create a test message with simple text for maximum compatibility - no emojis to avoid ?? issues
        const testMessage = `*WhatsApp Integration Test*

Your WhatsApp integration is working correctly!

This test message was sent to: ${phoneNumber}

*Live Cricket Auction Tool*
_Test completed successfully_`;
        
        console.log('?? Test message created, length:', testMessage.length);
        
        // Use the direct WhatsApp message sending function
        const result = await sendWhatsAppMessageDirect(testMessage, phoneNumber);
        console.log('?? sendWhatsAppMessageDirect result:', result);
        
        return result;
        
    } catch (error) {
        console.error('? Test message error:', error);
        return false;
    }
};

// Format auction message for WhatsApp
export const formatAuctionMessage = (playerName, teamName, price, tournamentName, skill = '', category = '') => {
    return `*${tournamentName.toUpperCase()}* *AUCTION UPDATE*

*-------PLAYER SOLD-------*

* Player: *${playerName}*
* Team: ${teamName}
* Points: ${price.toLocaleString()}${skill ? `
* Skill: ${skill}` : ''}${category ? `
* Category: ${category}` : ''}

Congratulations to *${teamName}*!

_Auction Dugout Tool - AG VERCEL TECH_`;
};

// Format unsold message for WhatsApp  
export const formatUnsoldMessage = (playerName, tournamentName, skill = '', category = '') => {
    return `*${tournamentName.toUpperCase()}* *AUCTION UPDATE*

*-------PLAYER UNSOLD-------*

* Player: *${playerName}*${skill ? `
* Skill: ${skill}` : ''}${category ? `
* Category: ${category}` : ''}

No bids received - player remains unsold

_Auction Dugout Tool - AG VERCEL TECH_`;
};

// Format team summary message for WhatsApp
export const formatTeamSummaryMessage = (teamName, teamData, tournamentName) => {
    const totalSpent = teamData.players.reduce((sum, player) => sum + player.soldPrice, 0);
    
    let message = `*${tournamentName.toUpperCase()}* *TEAM SUMMARY*

*Team: ${teamName}*
*Owner: ${teamData.owner}*

*SQUAD DETAILS:*
*Players: ${teamData.players.length}*
*Remaining Purse: Rs.${teamData.purse.toLocaleString()}*
*Players to Buy: ${teamData.playersToBuy}*
*Total Spent: Rs.${totalSpent.toLocaleString()}*

*PLAYER LIST:*`;

    if (teamData.players.length > 0) {
        teamData.players.forEach((player, index) => {
            message += `\n${index + 1}. *${player.name}*`;
            message += `\n   - Price: Rs.${player.soldPrice.toLocaleString()}`;
            if (player.skill) message += `\n   - Skill: ${player.skill}`;
            if (player.category) message += `\n   - Category: ${player.category}`;
            message += '\n';
        });
    } else {
        message += '\n\nNo players purchased yet.';
    }

    message += '\n_Live Cricket Auction Tool_';
    
    return message;
};

// Check if system is ready for WhatsApp - only check popups and internet connectivity
export const isWhatsAppAvailable = async () => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        console.log('? Not in browser environment');
        return false;
    }
    
    try {
        // Check 1: Test if popups are allowed
        console.log('?? Checking popup capability...');
        if (typeof window.open !== 'function') {
            console.log('? window.open function not available');
            return false;
        }
        
        // Test popup capability with a minimal window
        const testWindow = window.open('about:blank', 'popup_test', 'width=1,height=1,left=9999,top=9999');
        
        if (!testWindow) {
            console.log('? Popups are blocked by browser');
            return false;
        }
        
        // Close test window immediately
        try {
            testWindow.close();
        } catch (e) {
            // Ignore close errors
        }
        console.log('? Popup capability verified');
        
        // Check 2: Test internet connectivity
        console.log('?? Checking internet connectivity...');
        try {
            // Simple connectivity test - try to fetch a lightweight resource
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            console.log('? Internet connectivity verified');
            return true;
        } catch (connectivityError) {
            console.log('? Internet connectivity issue:', connectivityError.message);
            return false;
        }
        
    } catch (error) {
        console.log('? Error during system check:', error);
        return false;
    }
};

// Validate Indian phone number
export const validateIndianPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false; // Empty is now invalid (mandatory)
    
    // Remove all non-digits
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    // Check for valid Indian mobile number patterns
    if (digitsOnly.length === 10) {
        // 10 digits: should start with 6,7,8,9 (Indian mobile)
        return /^[6-9]/.test(digitsOnly);
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        // 12 digits with 91 prefix: check if the mobile part is valid
        const mobileNumber = digitsOnly.substring(2);
        return /^[6-9]/.test(mobileNumber);
    }
    
    return false;
};

// Format phone number for display
export const formatPhoneNumberForDisplay = (phoneNumber) => {
    if (!phoneNumber) return '';
    
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    if (digitsOnly.length === 10) {
        return `+91${digitsOnly}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        return `+${digitsOnly}`;
    }
    
    return phoneNumber; // Return as-is if doesn't match expected patterns
};

// WhatsApp configuration settings
export const WHATSAPP_CONFIG = {
    enabled: true, // Can be toggled by user
    autoSend: false, // If true, automatically opens WhatsApp; if false, shows confirmation
    groupNumber: '', // Optional: Pre-configured group/contact number
    includePriceInTitle: true,
    includeSkillInfo: true,
    includeCategoryInfo: true
};