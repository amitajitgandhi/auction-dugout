import { useState } from 'react';
import { 
    sendWhatsAppMessageDirect,
    sendTestWhatsAppMessage,
    formatAuctionMessage, 
    formatUnsoldMessage,
    formatTeamSummaryMessage
} from '../utils/whatsappUtils';
import { TOAST_STYLES, EMOJIS } from '../utils/constants';

export const useWhatsAppIntegration = (showManagedToast) => {
    const [whatsappSettings, setWhatsappSettings] = useState({
        enabled: true,
        autoSend: false,
        groupNumber: '',
        includePriceInTitle: true,
        includeSkillInfo: true,
        includeCategoryInfo: true
    });

    // WhatsApp notification function
    const sendWhatsAppNotification = async (player, teamName, price, tournamentName, isUnsold = false) => {
        if (!whatsappSettings.enabled) {
            console.log('WhatsApp integration disabled');
            return;
        }

        try {
            let message;
            if (isUnsold) {
                message = formatUnsoldMessage(
                    player.name,
                    tournamentName,
                    whatsappSettings.includeSkillInfo ? player.skill : '',
                    whatsappSettings.includeCategoryInfo ? player.category : ''
                );
            } else {
                message = formatAuctionMessage(
                    player.name,
                    teamName,
                    price,
                    tournamentName,
                    whatsappSettings.includeSkillInfo ? player.skill : '',
                    whatsappSettings.includeCategoryInfo ? player.category : ''
                );
            }

            if (whatsappSettings.autoSend) {
                const success = await sendWhatsAppMessageDirect(message, whatsappSettings.groupNumber);
                if (success) {
                    showManagedToast('success', `WhatsApp message sent automatically! ${EMOJIS.MOBILE}`, {
                        style: TOAST_STYLES.success,
                        icon: EMOJIS.MOBILE,
                        duration: 3000,
                    });
                } else {
                    showManagedToast('error', 'Failed to send WhatsApp message automatically. Please try again.', {
                        style: TOAST_STYLES.error,
                        duration: 4000,
                    });
                }
            } else {
                console.log('Auto Send is OFF - WhatsApp message not sent automatically');
            }
        } catch (error) {
            console.error('WhatsApp notification error:', error);
            showManagedToast('error', 'WhatsApp integration error. Please try again.', {
                style: TOAST_STYLES.error,
                duration: 4000,
            });
        }
    };

    // WhatsApp test message function
    const handleWhatsAppTest = async (phoneNumber) => {
        try {
            console.log('?? handleWhatsAppTest called with phoneNumber:', phoneNumber);
            
            const success = await sendTestWhatsAppMessage(phoneNumber);
            
            if (success) {
                showManagedToast('success', `WhatsApp test message sent to ${phoneNumber}! ${EMOJIS.MOBILE}`, {
                    style: TOAST_STYLES.success,
                    icon: EMOJIS.MOBILE,
                    duration: 3000,
                });
            } else {
                showManagedToast('error', 'Failed to open WhatsApp. Please check your browser settings.', {
                    style: TOAST_STYLES.error,
                    duration: 4000,
                });
            }
        } catch (error) {
            console.error('WhatsApp test error:', error);
            showManagedToast('error', 'WhatsApp test failed. Please try again.', {
                style: TOAST_STYLES.error,
                duration: 4000,
            });
        }
    };

    // WhatsApp team sharing function
    const handleTeamWhatsAppShare = async (teamName, teamData, tournamentName) => {
        try {
            console.log('?? Sharing team details for:', teamName);
            
            const message = formatTeamSummaryMessage(teamName, teamData, tournamentName);
            const success = await sendWhatsAppMessageDirect(message, whatsappSettings.groupNumber);
            
            if (success) {
                showManagedToast('success', `Team ${teamName} details shared to WhatsApp! ${EMOJIS.MOBILE}`, {
                    style: TOAST_STYLES.success,
                    icon: EMOJIS.MOBILE,
                    duration: 3000,
                });
            } else {
                showManagedToast('error', 'Failed to open WhatsApp. Please check your browser settings.', {
                    style: TOAST_STYLES.error,
                    duration: 4000,
                });
            }
        } catch (error) {
            console.error('Team WhatsApp share error:', error);
            showManagedToast('error', 'Failed to share team details. Please try again.', {
                style: TOAST_STYLES.error,
                duration: 4000,
            });
        }
    };

    return {
        whatsappSettings,
        setWhatsappSettings,
        sendWhatsAppNotification,
        handleWhatsAppTest,
        handleTeamWhatsAppShare
    };
};