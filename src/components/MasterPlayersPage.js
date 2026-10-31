import React, { useMemo, useState } from 'react';
import { EMOJIS } from '../utils/constants';
import { getCategoryRequirementStatus } from '../utils/centralizedTeamData';

// Master assignment uses the same normal sale logic as the auction.
const getPlayerStatus = (p) => {
    if (p.sold && p.soldTo !== 'Unsold') return 'SOLD';
    if (p.soldTo === 'Unsold') return 'UNSOLD';
    return 'AVAILABLE';
};

const STATUS_BADGE = {
    AVAILABLE: 'bg-blue-100 text-blue-700',
    SOLD: 'bg-green-100 text-green-700',
    UNSOLD: 'bg-red-100 text-red-700'
};

const FILTERS = [
    { key: 'ALL', label: 'All Players' },
    { key: 'AVAILABLE', label: 'Available Players' },
    { key: 'UNSOLD', label: 'Unsold Players' }
];

const MasterPlayersPage = ({
    players,
    teams,
    tournamentName,
    tickerDetails = "",
    categoryConfigs = {},
    onBackToTeams,
    onSellPlayer,
    showManagedToast
}) => {
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [rowInputs, setRowInputs] = useState({});
    const [submittingId, setSubmittingId] = useState(null);

    const teamNames = useMemo(() => Object.keys(teams || {}), [teams]);

    // Unique, non-empty categories actually present in the imported CSV —
    // never a hardcoded Platinum/Gold/Silver list.
    const categories = useMemo(() => {
        const cats = new Set((players || []).map(p => p.category).filter(Boolean));
        return Array.from(cats);
    }, [players]);

    // Has real auction bidding happened yet (as opposed to only owner
    // retentions)? Derived live from the player list, not a second lifecycle
    // flag — used only to warn, never to silently block an admin override.
    const biddingHasBegun = useMemo(
        () => (players || []).some(p =>
            p.soldTo === 'Unsold' || (p.sold && p.soldTo !== 'Unsold' && p.retentionSource !== 'OWNER_RETENTION')
        ),
        [players]
    );

    const filteredPlayers = useMemo(() => {
        return (players || []).filter(p => {
            // This page is for assigning/selling players; already-sold players are intentionally hidden.
            if (getPlayerStatus(p) === 'SOLD') return false;
            if (statusFilter !== 'ALL' && getPlayerStatus(p) !== statusFilter) return false;
            if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
            return true;
        });
    }, [players, statusFilter, categoryFilter]);

    const getRowInputs = (playerId) =>
        rowInputs[playerId] || { team: '', category: '', amount: '' };

    const handleInputChange = (playerId, field, value) => {
        setRowInputs(prev => ({
            ...prev,
            [playerId]: { ...getRowInputs(playerId), [field]: value }
        }));
    };

    const handleSubmitSale = async (player) => {
        if (submittingId === player.id) return;
        const inputs = getRowInputs(player.id);
        const teamName = inputs.team;
        const category = inputs.category || player.category;
        const amount = parseInt(inputs.amount, 10);
        if (!teamName || !category || isNaN(amount) || amount <= 0) {
            showManagedToast?.('error', 'Select a team and category, and enter a valid sale price.', { icon: EMOJIS.WARNING, duration: 3000 });
            return;
        }
        setSubmittingId(player.id);
        try {
            const result = player.soldTo === 'Unsold'
                ? await onSellPlayer?.(player, teamName, amount, true, category)
                : await onSellPlayer?.(player, teamName, amount, false, category);
            if (result?.success) {
                showManagedToast?.('success', result.message || `${player.name} sold to ${teamName}.`, { icon: EMOJIS.CHECK_MARK, duration: 3500 });
                setRowInputs(prev => { const next = { ...prev }; delete next[player.id]; return next; });
            } else {
                showManagedToast?.('error', result?.message || 'Sale failed.', { icon: EMOJIS.CROSS_MARK, duration: 3500 });
            }
        } finally {
            setSubmittingId(null);
        }
    };

    const counts = { ALL: visiblePlayers.length, AVAILABLE: 0, RETAINED: 0, UNSOLD: 0 };
        visiblePlayers.forEach(p => { counts[getPlayerStatus(p)] += 1; });
        return counts;
    }, [players]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 bg-fixed relative overflow-x-hidden">
            <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white py-2 shadow-lg">
                <div className="overflow-hidden whitespace-nowrap">
                    <div className="animate-marquee inline-block font-bold text-lg">
                        {tickerDetails}
                    </div>
                </div>
            </div>

            <div className="pt-16 pb-20 px-4">
                <div className="w-full max-w-6xl mx-auto">
                    <div className="mb-6 text-center">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-lg bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-500 bg-clip-text text-transparent">
                            {EMOJIS.CROWN} Master Players
                        </h1>
                        <p className="text-gray-300 text-lg mb-6">
                            Review every player and retain available or unsold players directly to a team before bidding begins.
                        </p>
                        <button
                            onClick={onBackToTeams}
                            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:from-gray-600 hover:to-gray-700 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center gap-3 mx-auto text-lg"
                        >
                            <span className="text-xl">{EMOJIS.BACK_ARROW}</span>Back to Team Summary Page
                        </button>
                    </div>

                    {biddingHasBegun && (
                        <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-center">
                            <p className="text-amber-800 font-semibold">
                                {EMOJIS.WARNING} Bidding has already started. Retaining a player now is an administrative
                                override — the player will be pulled out of the live auction immediately, just like
                                marking a sale or editing a team manually. Proceed only if that's intended.
                            </p>
                        </div>
                    )}

                    {/* Team balances & category requirements — derived live from each team's roster */}
                    {teamNames.length > 0 && Object.keys(categoryConfigs).length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-white mb-3 text-center">
                                {EMOJIS.CLIPBOARD} Team Balances &amp; Category Requirements
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {teamNames.map(teamName => {
                                    const team = teams[teamName];
                                    const reqStatus = getCategoryRequirementStatus(team, categoryConfigs);
                                    return (
                                        <div key={teamName} className="bg-white bg-opacity-95 rounded-xl shadow-md p-4">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-gray-800 truncate" title={teamName}>{teamName}</span>
                                                <span className="text-emerald-600 font-bold text-sm">
                                                    {EMOJIS.CURRENCY_RUPEE}{(team.purse || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {Object.entries(reqStatus).map(([cat, s]) => (
                                                    <span
                                                        key={cat}
                                                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.remaining > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}
                                                        title={`${cat}: ${s.filled} filled of ${s.required} required`}
                                                    >
                                                        {cat} {s.filled}/{s.required}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="mb-4 flex flex-wrap gap-2 justify-center">
                        {FILTERS.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setStatusFilter(f.key)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 ${
                                    statusFilter === f.key
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {f.label} ({statusCounts[f.key] ?? 0})
                            </button>
                        ))}
                        {categories.length > 0 && (
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-3 py-2 rounded-lg text-sm font-semibold shadow-sm bg-white text-gray-700 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >
                                <option value="ALL">All Categories</option>
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        )}
                    </div>

                    <div className="bg-white bg-opacity-95 rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <span>{EMOJIS.CLIPBOARD}</span>Master Player List
                                </h3>
                                <p className="text-gray-600 text-sm mt-1">Showing {filteredPlayers.length} of {players?.length || 0} players</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Player Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Category</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Assigned Team</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Sale / Retention Price</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPlayers.length === 0 && (
                                        <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500 text-sm">No players match this filter.</td></tr>
                                    )}
                                    {filteredPlayers.map((player, idx) => {
                                        const status = getPlayerStatus(player);
                                        const inputs = getRowInputs(player.id);
                                        const isSubmitting = submittingId === player.id;
                                        return (
                                            <tr key={player.id} className="border-t border-gray-200 hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm font-medium text-gray-700">{idx + 1}</td>
                                                <td className="px-4 py-2 text-sm font-semibold text-gray-800">{player.name}</td>
                                                <td className="px-4 py-2 text-sm text-gray-600">{player.category || '-'}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${STATUS_BADGE[status]}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-700">{player.soldTo && player.soldTo !== 'Unsold' ? player.soldTo : '-'}</td>
                                                <td className="px-4 py-2 text-sm text-gray-700">
                                                    {status === 'SOLD' && player.soldPrice
                                                        ? `${EMOJIS.CURRENCY_RUPEE}${player.soldPrice.toLocaleString()}`
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {(status === 'AVAILABLE' || status === 'UNSOLD') ? (
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <select
                                                                value={inputs.team}
                                                                onChange={(e) => handleInputChange(player.id, 'team', e.target.value)}
                                                                disabled={isSubmitting}
                                                                className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                                            >
                                                                <option value="">Team</option>
                                                                {teamNames.map(t => <option key={t} value={t}>{t}</option>)}
                                                            </select>
                                                            <select
                                                                value={inputs.category || player.category || ''}
                                                                onChange={(e) => handleInputChange(player.id, 'category', e.target.value)}
                                                                disabled={isSubmitting}
                                                                className="border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                                            >
                                                                {categories.length === 0 && <option value="">Category</option>}
                                                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                            </select>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={inputs.amount}
                                                                onChange={(e) => handleInputChange(player.id, 'amount', e.target.value)}
                                                                disabled={isSubmitting}
                                                                placeholder="Amount"
                                                                className="w-24 border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                                                            />
                                                            <button
                                                                onClick={() => handleSubmitSale(player)}
                                                                disabled={isSubmitting}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {isSubmitting ? 'Retaining…' : status === 'UNSOLD' ? 'Retain Again' : 'Retain'}
                                                            </button>

                                                        </div>
                                                    ) : status === 'UNSOLD' ? (
                                                        <span className="text-xs text-gray-500"></span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="w-full text-center py-4 mt-8 text-white bg-black bg-opacity-60 text-lg font-semibold tracking-wide fixed bottom-0 left-0 z-50">Product by Amit Gandhi</footer>
        </div>
    );
};

export default MasterPlayersPage;
