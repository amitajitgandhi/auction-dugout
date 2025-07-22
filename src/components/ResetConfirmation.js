import React from "react";
import { EMOJIS } from "../utils/constants";

const ResetConfirmation = ({ 
    isOpen, 
    onConfirm, 
    onCancel 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-bounce-in">
                <div className="text-center">
                    {/* Warning Icon */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6 animate-pulse">
                        <div className="text-4xl">{EMOJIS.WARNING}</div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Reset Entire Auction?
                    </h3>
                    <div className="mb-6">
                        <p className="text-gray-600 mb-3">
                            This action will permanently delete all auction progress:
                        </p>
                        <div className="bg-red-50 rounded-lg p-3 text-left border border-red-200">
                            <ul className="text-sm text-red-700 space-y-1">
                                <li className="flex items-center gap-2">
                                    <span className="text-red-500">{EMOJIS.BULLET}</span>
                                    <span>All sold players will be unmarked</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-red-500">{EMOJIS.BULLET}</span>
                                    <span>Team squads will be cleared</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-red-500">{EMOJIS.BULLET}</span>
                                    <span>Category progress will be lost</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-red-500">{EMOJIS.BULLET}</span>
                                    <span>Current auction state will be reset</span>
                                </li>
                            </ul>
                        </div>
                        <p className="text-gray-600 mt-3 text-sm flex items-center justify-center gap-2">
                            <span className="text-red-500">{EMOJIS.WARNING}</span>
                            <strong>This action cannot be undone.</strong>
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={onCancel}
                            className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center justify-center gap-2"
                        >
                            <span>{EMOJIS.CROSS_MARK}</span>
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 shadow-lg flex items-center justify-center gap-2"
                        >
                            <span>{EMOJIS.REFRESH}</span>
                            Yes, Reset Auction
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetConfirmation;