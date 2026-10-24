import React, { useMemo, useState } from "react";
import { EMOJIS } from "../utils/constants";

// Booster popup:
// - "Points Per Booster" is a single tournament-wide value (same for every team,
//   for the whole tournament) — never a per-team value.
// - Each team just shows its current booster count with a "+" button. Clicking it
//   increments that team's booster count by 1 and immediately recalculates its purse.
const BoosterPopup = ({ isOpen, onClose, teams, boosterPointsPerBooster, onIncrementTeamBooster, onUpdatePointsPerBooster, showManagedToast }) => {
    const [ppbInput, setPpbInput] = useState(String(boosterPointsPerBooster ?? 10));
    const [busyTeam, setBusyTeam] = useState(null);
    const teamNames = useMemo(() => Object.keys(teams || {}), [teams]);

    // Keep the input in sync whenever the popup is (re)opened with the latest value
    React.useEffect(() => {
        if (isOpen) {
            setPpbInput(String(boosterPointsPerBooster ?? 10));
        }
    }, [isOpen, boosterPointsPerBooster]);

    if (!isOpen) return null;

    const handlePpbBlur = async () => {
        const ppb = parseInt(ppbInput, 10);
        if (Number.isNaN(ppb) || ppb <= 0) {
            showManagedToast?.("error", "Enter a valid points-per-booster value.", { icon: EMOJIS.WARNING, duration: 3000 });
            setPpbInput(String(boosterPointsPerBooster ?? 10));
            return;
        }
        if (ppb === boosterPointsPerBooster) return;

        const ok = await onUpdatePointsPerBooster?.(ppb);
        if (ok) {
            showManagedToast?.(
                "success",
                `${EMOJIS.ZAP} Points per booster set to ${ppb} for all teams.`,
                { icon: EMOJIS.CHECK_MARK, duration: 3000 }
            );
        } else {
            setPpbInput(String(boosterPointsPerBooster ?? 10));
        }
    };

    const handleAddBooster = async (teamName) => {
        setBusyTeam(teamName);
        try {
            const ok = await onIncrementTeamBooster?.(teamName);
            if (ok) {
                const newCount = (teams?.[teamName]?.boosterCount ?? 0) + 1;
                showManagedToast?.(
                    "success",
                    `${EMOJIS.ZAP} ${teamName} booster count: ${newCount}`,
                    { icon: EMOJIS.CHECK_MARK, duration: 2500 }
                );
            }
        } finally {
            setBusyTeam(null);
        }
    };
    
    const handleRemoveBooster = async (teamName) => {
    const currentCount = teams?.[teamName]?.boosterCount ?? 0;
    // Prevent booster count from going below zero
    if (currentCount <= 0) {
        showManagedToast?.(
            "error",
            "Booster count cannot be less than 0.",
            { icon: EMOJIS.WARNING, duration: 2500 }
        );
        return;
    }
    setBusyTeam(teamName);
    try {
        const ok = await onDecrementTeamBooster?.(teamName);
        if (ok) {
            showManagedToast?.(
                "success",
                `${EMOJIS.ZAP} ${teamName} booster count: ${currentCount - 1}`,
                { icon: EMOJIS.CHECK_MARK, duration: 2500 }
            );
        }
    } finally {
        setBusyTeam(null);
    }
};

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xl w-full mx-4 max-h-[85vh] overflow-y-auto">
                    <div className="text-center mb-5">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                            <span className="text-3xl">{EMOJIS.ZAP}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">Boosters</h3>
                        <p className="text-gray-600 text-sm">
                            Booster increases team budget everywhere: Auction, Teams, Viewer, and Max Bid.
                        </p>
                    </div>

                    {/* Tournament-wide Points Per Booster — one value, applies to every team */}
                    <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                            Points Per Booster <span className="font-normal text-gray-500">(applies to all teams, for the whole tournament)</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={ppbInput}
                            onChange={(e) => setPpbInput(e.target.value)}
                            onBlur={handlePpbBlur}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>

                    {/* Per-team booster count with a simple + button */}
                    <div className="space-y-2">
                        {teamNames.length === 0 && (
                            <p className="text-center text-gray-500 text-sm py-4">No teams available.</p>
                        )}
                        {teamNames.map((name) => {
                            const team = teams[name];
                            const count = team?.boosterCount ?? 0;
                            return (
                                <div key={name} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3">
                                    <div className="min-w-0 flex-1 pr-3">
                                        <div className="font-semibold text-gray-800 truncate">{name}</div>
                                        <div className="text-xs text-gray-500">
                                            {EMOJIS.CURRENCY_RUPEE}{(team?.initialPurse ?? team?.purse ?? 0).toLocaleString()} total
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
    {/* Decrease booster count */}
    <button
        onClick={() => handleRemoveBooster(name)}
        disabled={busyTeam === name || count <= 0}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-bold text-xl shadow hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
        title={`Remove booster from ${name}`}
    >
        −
    </button>
    {/* Current booster count */}
    <span className="text-lg font-bold text-gray-800 min-w-[2ch] text-center">
        {count}
    </span>
    {/* Increase booster count */}
    <button
        onClick={() => handleAddBooster(name)}
        disabled={busyTeam === name}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-lg shadow hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50"
        title={`Add booster to ${name}`}
    >
        +
    </button>
</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
            <div className="fixed inset-0 z-40" onClick={onClose}></div>
        </>
    );
};

export default BoosterPopup;
