import React, { useMemo, useState } from "react";
import { EMOJIS } from "../utils/constants";

const BoosterPopup = ({ isOpen, onClose, teams, onApplyBoosterPoints, showManagedToast }) => {
    const [teamName, setTeamName] = useState("");
    const [boosterCount, setBoosterCount] = useState("");
    const [pointsPerBooster, setPointsPerBooster] = useState("10");
    const teamNames = useMemo(() => Object.keys(teams || {}), [teams]);

    if (!isOpen) return null;

    const selectedTeam = teamName ? teams?.[teamName] : null;

    const handleApply = async () => {
        const count = parseInt(boosterCount, 10);
        const ppb = parseInt(pointsPerBooster, 10);
        if (!teamName || !selectedTeam) {
            showManagedToast?.("error", "Please select a team first.", { icon: EMOJIS.WARNING, duration: 3000 });
            return;
        }
        if (Number.isNaN(count) || count < 0) {
            showManagedToast?.("error", "Enter valid booster count (0 or more).", { icon: EMOJIS.WARNING, duration: 3000 });
            return;
        }
        if (Number.isNaN(ppb) || ppb <= 0) {
            showManagedToast?.("error", "Enter valid points per booster.", { icon: EMOJIS.WARNING, duration: 3000 });
            return;
        }

        const base = selectedTeam.baseInitialPurse ?? selectedTeam.initialPurse ?? selectedTeam.purse ?? 0;
        const spent = (selectedTeam.players || []).reduce((sum, p) => sum + (p.soldPrice || 0), 0);
        const projectedTotal = base + count * ppb;
        if (projectedTotal < spent) {
            showManagedToast?.("error", "Booster count too low for already spent points.", { icon: EMOJIS.WARNING, duration: 3000 });
            return;
        }

        const ok = await onApplyBoosterPoints?.(teamName, count, ppb);
        if (ok) {
            showManagedToast?.(
                "success",
                `${EMOJIS.ZAP} Booster set: ${teamName} -> ${count} booster(s) x ${ppb} points.`,
                { icon: EMOJIS.CHECK_MARK, duration: 3500 }
            );
            setBoosterCount("");
            onClose?.();
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xl w-full mx-4">
                    <div className="text-center mb-5">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                            <span className="text-3xl">{EMOJIS.ZAP}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">Set Booster Count</h3>
                        <p className="text-gray-600 text-sm">
                            Booster increases team budget everywhere: Auction, Teams, Viewer, and Max Bid.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                            <select
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                                <option value="">Select Team</option>
                                {teamNames.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Booster Count</label>
                            <input
                                type="number"
                                min="0"
                                value={boosterCount}
                                onChange={(e) => setBoosterCount(e.target.value)}
                                placeholder="Enter booster count"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Points Per Booster</label>
                            <input
                                type="number"
                                min="1"
                                value={pointsPerBooster}
                                onChange={(e) => setPointsPerBooster(e.target.value)}
                                placeholder="Default 10"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                        </div>

                        {selectedTeam && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                                <div><strong>Base Points:</strong> {EMOJIS.CURRENCY_RUPEE}{(selectedTeam.baseInitialPurse ?? selectedTeam.initialPurse ?? selectedTeam.purse ?? 0).toLocaleString()}</div>
                                <div><strong>Current Booster:</strong> {(selectedTeam.boosterCount ?? 0)} x {(selectedTeam.pointsPerBooster ?? 10)}</div>
                                <div><strong>Current Total Points:</strong> {EMOJIS.CURRENCY_RUPEE}{(selectedTeam.initialPurse ?? selectedTeam.purse ?? 0).toLocaleString()}</div>
                                <div><strong>Current Points Left:</strong> {EMOJIS.CURRENCY_RUPEE}{(selectedTeam.purse ?? 0).toLocaleString()}</div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600"
                        >
                            Apply Booster
                        </button>
                    </div>
                </div>
            </div>
            <div className="fixed inset-0 z-40" onClick={onClose}></div>
        </>
    );
};

export default BoosterPopup;