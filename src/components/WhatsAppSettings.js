import React, { useState, useEffect } from "react";
import { EMOJIS } from "../utils/constants";
import { isWhatsAppAvailable, validateIndianPhoneNumber, WHATSAPP_EMOJIS } from "../utils/whatsappUtils";

const WhatsAppSettings = ({ 
    isOpen, 
    onClose, 
    settings, 
    onSave,
    onTest
}) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [showPhoneValidation, setShowPhoneValidation] = useState(false);
    const [setupStatusChecked, setSetupStatusChecked] = useState(false);
    const [browserCheckResult, setBrowserCheckResult] = useState(null); // Store browser check result

    // Reset state when popup opens - ensure localSettings match passed settings
    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings); // Reset to original settings when popup opens
            setSetupStatusChecked(false);
            setBrowserCheckResult(null); // Reset browser check result
            
            // Auto-validate phone number if one exists in saved settings
            if (settings.groupNumber && settings.groupNumber.trim()) {
                console.log('?? Auto-validating saved phone number:', settings.groupNumber);
                setShowPhoneValidation(true); // Show validation messages for existing number
            } else {
                setShowPhoneValidation(false); // Hide validation for empty number
            }
        }
    }, [isOpen, settings]);

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const handleReset = () => {
        setLocalSettings({
            enabled: true,
            autoSend: false,
            groupNumber: '',
            includePriceInTitle: true,
            includeSkillInfo: true,
            includeCategoryInfo: true
        });
        setShowPhoneValidation(false);
        setSetupStatusChecked(false);
        setBrowserCheckResult(null); // Reset browser check result
    };

    const handlePhoneBlur = () => {
        setShowPhoneValidation(true);
    };

    const handleCheckSetupStatus = async () => {
        setSetupStatusChecked(true);
        const result = await isWhatsAppAvailable(); // Now async
        setBrowserCheckResult(result);
    };

    const handleCancel = () => {
        setLocalSettings(settings); // Reset to original settings
        setShowPhoneValidation(false);
        setSetupStatusChecked(false);
        setBrowserCheckResult(null); // Reset browser check result
        onClose();
    };

    const isPhoneValid = localSettings.groupNumber && 
                         localSettings.groupNumber.replace(/^\+?91/, '').length === 10 && 
                         validateIndianPhoneNumber(localSettings.groupNumber);
    const isAllValid = localSettings.enabled && browserCheckResult === true && isPhoneValid;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            {/* WhatsApp Company Logo */}
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-6 h-6 fill-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"/>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                WhatsApp Settings
                            </h2>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            {EMOJIS.CROSS_MARK}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Enable/Disable WhatsApp */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-semibold text-gray-700">Enable WhatsApp Notifications</label>
                                <p className="text-sm text-gray-500">Send auction updates to WhatsApp</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.enabled}
                                    onChange={(e) => setLocalSettings({...localSettings, enabled: e.target.checked})}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {localSettings.enabled && (
                            <>
                                {/* Auto Send */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="font-semibold text-gray-700">Auto Send Messages</label>
                                        <p className="text-sm text-gray-500">ON : Auto-send WhatsApp message when player is sold/unsold</p><p className="text-sm text-gray-500"> OFF : Don't send any messages automatically</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localSettings.autoSend}
                                            onChange={(e) => setLocalSettings({...localSettings, autoSend: e.target.checked})}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                </div>

                                {/* Group Number */}
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-2">
                                        WhatsApp Contact Number/Group ID <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                                            +91
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="9876543210"
                                            value={localSettings.groupNumber.replace(/^\+?91/, '')}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                                if (value.length <= 10) {
                                                    setLocalSettings({
                                                        ...localSettings, 
                                                        groupNumber: value ? `+91${value}` : ''
                                                    });
                                                    // Clear setup status when phone number changes
                                                    setSetupStatusChecked(false);
                                                    setBrowserCheckResult(null);
                                                    // Also clear phone validation when typing
                                                    if (value.length === 0) {
                                                        setShowPhoneValidation(false);
                                                    }
                                                }
                                            }}
                                            onBlur={handlePhoneBlur}
                                            className="flex-1 border rounded-r-lg px-3 py-2 focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-400"
                                            maxLength="10"
                                            required
                                        />
                                    </div>
                                    
                                    {/* Only show validation messages after blur */}
                                    {showPhoneValidation && (
                                        <>
                                            {!localSettings.groupNumber && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {EMOJIS.CROSS_MARK} Phone number is required for WhatsApp integration
                                                </p>
                                            )}
                                            {localSettings.groupNumber && localSettings.groupNumber.replace(/^\+?91/, '').length < 10 && localSettings.groupNumber.replace(/^\+?91/, '').length > 0 && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {EMOJIS.CROSS_MARK} Phone number must be exactly 10 digits
                                                </p>
                                            )}
                                            {localSettings.groupNumber && localSettings.groupNumber.replace(/^\+?91/, '').length === 10 && !validateIndianPhoneNumber(localSettings.groupNumber) && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {EMOJIS.CROSS_MARK} Indian mobile numbers must start with 6, 7, 8, or 9
                                                </p>
                                            )}
                                            {localSettings.groupNumber && validateIndianPhoneNumber(localSettings.groupNumber) && localSettings.groupNumber.replace(/^\+?91/, '').length === 10 && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    {EMOJIS.CHECK_MARK} Valid Indian mobile number: {localSettings.groupNumber}
                                                </p>
                                            )}
                                        </>
                                    )}
                                    
                                    <p className="text-xs text-gray-500 mt-1">
                                        Enter your WhatsApp contact number or group id for auction notifications
                                    </p>
                                </div>

                                {/* Message Content Options */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-700">Message Content</h3>
                                    
                                    <div className="flex items-center justify-between">
                                        <label className="text-gray-700">Include Skill Information</label>
                                        <input
                                            type="checkbox"
                                            checked={localSettings.includeSkillInfo}
                                            onChange={(e) => setLocalSettings({...localSettings, includeSkillInfo: e.target.checked})}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <label className="text-gray-700">Include Category Information</label>
                                        <input
                                            type="checkbox"
                                            checked={localSettings.includeCategoryInfo}
                                            onChange={(e) => setLocalSettings({...localSettings, includeCategoryInfo: e.target.checked})}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Setup Status Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-700">Setup Status</h3>
                                            {setupStatusChecked && browserCheckResult === true && (
                                                <span className="text-green-500 text-lg">{EMOJIS.CHECK_MARK}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={handleCheckSetupStatus}
                                            disabled={!isPhoneValid || !showPhoneValidation}
                                            className={`px-4 py-2 rounded-lg font-semibold shadow-md transition flex items-center gap-2 text-sm ${
                                                (isPhoneValid && showPhoneValidation)
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            <span>{String.fromCodePoint(0x1F50D)}</span>
                                            Check Status
                                        </button>
                                    </div>
                                    
                                    {/* Show error message only if setup status checked and browser not valid */}
                                    {setupStatusChecked && browserCheckResult === false && (
                                        <div className="p-4 rounded-lg border bg-red-50 border-red-200">
                                            <div className="flex items-start gap-3">
                                                <span className="text-xl text-red-500">
                                                    {EMOJIS.CROSS_MARK}
                                                </span>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-red-800">Setup Issue Detected</h4>
                                                    <p className="text-sm mt-1 text-red-700">
                                                        Either popups are blocked or internet connectivity is unavailable
                                                    </p>
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-xs text-red-600 font-medium">Check these requirements:</p>
                                                        <p className="text-xs text-red-600">• Popups must be allowed in your browser</p>
                                                        <p className="text-xs text-red-600">• Internet connection must be active</p>
                                                        <div className="mt-2 space-y-1">
                                                            <a 
                                                                href="https://support.google.com/chrome/answer/95472" 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                                            >
                                                                {String.fromCodePoint(0x1F517)} Enable popups in Chrome
                                                            </a>
                                                            <br />
                                                            <a 
                                                                href="https://support.microsoft.com/en-us/microsoft-edge/allow-or-block-pop-ups-in-microsoft-edge-92c02d91-9de6-4b34-94d0-e6a84d67b2f9" 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                                            >
                                                                {String.fromCodePoint(0x1F517)} Enable popups in Edge
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Test WhatsApp Button - Only show when setup status is checked, browser is valid, and phone is valid */}
                                {setupStatusChecked && browserCheckResult === true && isPhoneValid && localSettings.enabled && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="text-xl text-blue-500">
                                                {EMOJIS.WHATSAPP}
                                            </span>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-blue-800">Test WhatsApp Integration</h4>
                                                <p className="text-sm text-blue-700 mt-1">
                                                    Send a test message directly to {localSettings.groupNumber} to verify WhatsApp integration works correctly
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onTest(localSettings.groupNumber)}
                                            className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-4 py-3 rounded-lg font-semibold shadow-md hover:from-teal-600 hover:to-cyan-700 transition transform hover:scale-105 flex items-center justify-center gap-2"
                                        >
                                            Send Test Message
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
                        >
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppSettings;