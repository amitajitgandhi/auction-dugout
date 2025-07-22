import React from "react";
import { EMOJIS } from "../utils/constants";

const CategorySelection = ({ 
    isOpen, 
    categories, 
    onSelect, 
    onClose,
    onViewTeams
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4 text-center text-purple-800">Select Category</h2>
                
                <div className="flex flex-col gap-4">
                    {categories.length > 0 ? (
                        <>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => onSelect(cat)}
                                    className="w-full bg-gradient-to-r from-yellow-400 to-pink-400 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:from-yellow-500 hover:to-pink-500 transition"
                                >
                                    {cat}
                                </button>
                            ))}
                            
                            {/* View Teams Button - only show when there are categories to select */}
                            {onViewTeams && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={onViewTeams}
                                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:from-blue-600 hover:to-cyan-700 transition flex items-center justify-center gap-2"
                                    >
                                        {EMOJIS.PEOPLE} View Teams Summary
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">{EMOJIS.PARTY}</div>
                            <h3 className="text-xl font-bold text-purple-800 mb-2">Congratulations!</h3>
                            <p className="text-gray-600 mb-4">All categories have been completed!</p>
                            <button
                                onClick={onViewTeams || onClose}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:from-green-600 hover:to-emerald-700 transition"
                            >
                                {onViewTeams ? 'View Teams Summary' : 'Close'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategorySelection;