import React from "react";
import { EMOJIS } from "../utils/constants";

const TournamentSetup = ({ 
    tournamentName, 
    setTournamentName, 
    onSubmit, 
    isSubmitting = false 
}) => {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            onSubmit();
        }
    };

    return (
        <div className="mb-8 space-y-6 bg-white bg-opacity-90 rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{EMOJIS.TROPHY} Setup Tournament</h2>
                <p className="text-gray-600">Enter your tournament name to get started</p>
            </div>
            <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                    <label htmlFor="tournament-name" className="block font-semibold mb-1 text-gray-700">
                        Tournament Name:
                    </label>
                    <input
                        id="tournament-name"
                        type="text"
                        placeholder="e.g., IPL 2024, Champions League, Local Cricket Cup"
                        value={tournamentName}
                        onChange={(e) => setTournamentName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        maxLength={50}
                        disabled={isSubmitting}
                    />
                </div>
                <button
                    onClick={onSubmit}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50"
                    disabled={!tournamentName.trim() || isSubmitting}
                >
                    {isSubmitting ? 'Setting...' : 'Set Tournament'}
                </button>
            </div>
        </div>
    );
};

export default TournamentSetup;