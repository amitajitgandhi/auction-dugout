import React from "react";
import { EMOJIS } from "../utils/constants";

const ConfirmationDialogs = ({
    showSoldConfirm,
    showUnsoldConfirm,
    showCategoryChangeConfirm,
    currentPlayer,
    teamNameInput,
    bidAmountInput,
    onConfirmSold,
    onCancelSold,
    onConfirmUnsold,
    onCancelUnsold,
    onConfirmCategoryChange,
    onCancelCategoryChange
}) => {
    return (
        <>
            {/* SOLD Confirmation Dialog */}
            {showSoldConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">
                            {EMOJIS.CHECK_MARK} Confirm Sale
                        </h3>
                        <div className="text-center mb-6">
                            <p className="text-gray-600 mb-2">
                                Are you sure you want to sell <strong>{currentPlayer?.name}</strong> to:
                            </p>
                            <p className="text-lg font-bold text-blue-600 mb-1">{teamNameInput}</p>
                            <p className="text-lg font-bold text-green-600">
                                for {EMOJIS.CURRENCY_RUPEE}{parseInt(bidAmountInput, 10)?.toLocaleString()}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onCancelSold}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-lg font-semibold transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirmSold}
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-200"
                            >
                                {EMOJIS.CHECK_MARK} Confirm Sale
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UNSOLD Confirmation Dialog */}
            {showUnsoldConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">
                            {EMOJIS.CROSS_MARK} Mark as Unsold
                        </h3>
                        <div className="text-center mb-6">
                            <p className="text-gray-600 mb-2">
                                Are you sure you want to mark <strong>{currentPlayer?.name}</strong> as unsold?
                            </p>
                            <p className="text-sm text-gray-500">
                                This player will be available in the next unsold round.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onCancelUnsold}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-lg font-semibold transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirmUnsold}
                                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-200"
                            >
                                {EMOJIS.CROSS_MARK} Mark Unsold
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Change Confirmation Dialog */}
            {showCategoryChangeConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 text-center">
                            {EMOJIS.WARNING} Change Category?
                        </h3>
                        <p className="text-gray-600 mb-6 text-center">
                            Are you sure you want to change the category? This will reset the current auction round and return to category selection.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onCancelCategoryChange}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2.5 rounded-lg font-semibold transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirmCategoryChange}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-200"
                            >
                                {EMOJIS.REFRESH} Yes, Change
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ConfirmationDialogs;