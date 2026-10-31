import React from "react";
import { EMOJIS } from "../utils/constants";

const TournamentSetup = ({
    tournamentName,
    setTournamentName,
    sponsorName,
    setSponsorName,
    tickerDetails,
    setTickerDetails,
    onSubmit,
    onLogout,
    isSubmitting = false
}) => {
    const handleKeyPress = (e) => {
        if (e.key === "Enter") onSubmit();
    };

    const inputClass = "block w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-100";

    return (
        <div className="mb-8 space-y-5 bg-white bg-opacity-95 rounded-xl shadow-lg p-5 md:p-6">
            {onLogout && (
                <div className="flex justify-end">
                    <button type="button" onClick={onLogout} className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
                        Logout
                    </button>
                </div>
            )}
            <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{EMOJIS.TROPHY} Setup Tournament</h2>
                <p className="text-gray-600">Add your tournament branding and custom ticker message</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="tournament-name" className="block font-semibold mb-1 text-gray-700">Tournament Name <span className="text-red-500">*</span></label>
                    <input id="tournament-name" type="text" placeholder="e.g., Champions League" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} onKeyDown={handleKeyPress} className={inputClass} maxLength={50} disabled={isSubmitting} />
                </div>
                <div>
                    <label htmlFor="sponsor-name" className="block font-semibold mb-1 text-gray-700">Sponsored By <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input id="sponsor-name" type="text" placeholder="e.g., ABC Developers" value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} onKeyDown={handleKeyPress} className={inputClass} maxLength={80} disabled={isSubmitting} />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="ticker-details" className="block font-semibold mb-1 text-gray-700">Ticker Details <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input id="ticker-details" type="text" placeholder="e.g., Welcome to the Season 4 Auction • Best of luck to all teams!" value={tickerDetails} onChange={(e) => setTickerDetails(e.target.value)} onKeyDown={handleKeyPress} className={inputClass} maxLength={180} disabled={isSubmitting} />
                    <p className="text-xs text-gray-500 mt-1">This exact message will scroll in the ticker. Leave blank to hide it.</p>
                </div>
            </div>
            <div className="flex justify-center pt-1">
                <button onClick={onSubmit} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50" disabled={!tournamentName.trim() || isSubmitting}>
                    {isSubmitting ? "Setting..." : "Set Tournament"}
                </button>
            </div>
        </div>
    );
};

export default TournamentSetup;
