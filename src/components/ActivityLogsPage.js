import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const PAGE_SIZE = 25;
const formatDate = (value) => new Date(value).toLocaleString();

export default function ActivityLogsPage({ authUser, tournamentName, onBack }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState('');
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [eventFilter, setEventFilter] = useState('ALL');

    const loadPage = useCallback(async () => {
        if (!authUser?.id) return;
        setLoading(true);
        setError('');
        let query = supabase
            .from('activity_logs')
            .select('id, created_at, event_category, event_type, description, entity_type, entity_id, status, metadata')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
        if (tournamentName) query = query.eq('tournament_name', tournamentName);
        if (categoryFilter !== 'ALL') query = query.eq('event_category', categoryFilter);
        if (eventFilter !== 'ALL') query = query.eq('event_type', eventFilter);
        const term = searchText.trim().replace(/[,%()]/g, ' ');
        if (term) query = query.or(`description.ilike.%${term}%,event_type.ilike.%${term}%,entity_type.ilike.%${term}%,entity_id.ilike.%${term}%`);
        const { data, error: queryError } = await query;
        if (queryError) {
            setError(queryError.message);
            setRows([]);
            setHasMore(false);
        } else {
            const resultRows = data || [];
            setHasMore(resultRows.length > PAGE_SIZE);
            setRows(resultRows.slice(0, PAGE_SIZE));
        }
        setLoading(false);
    }, [authUser?.id, tournamentName, page, categoryFilter, eventFilter, searchText]);

    useEffect(() => { loadPage(); }, [loadPage]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div>
                        <p className="text-sm uppercase tracking-widest text-cyan-300">Auction Dugout</p>
                        <h1 className="text-3xl md:text-4xl font-bold">Activity History</h1>
                        <p className="text-gray-300 mt-1">{tournamentName || 'All tournaments'}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={loadPage} className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600">Refresh</button>
                        <button onClick={onBack} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Back</button>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 mb-4 shadow grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input value={searchText} onChange={e => { setSearchText(e.target.value); setPage(0); }} placeholder="Search player, team, event..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm">
                        <option value="ALL">All categories</option><option value="BUSINESS">Business</option><option value="SYSTEM">System</option>
                    </select>
                    <select value={eventFilter} onChange={e => { setEventFilter(e.target.value); setPage(0); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 text-sm">
                        <option value="ALL">All activities</option>
                        {[...new Set(rows.map(row => row.event_type).filter(Boolean))].sort().map(type => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
                    </select>
                </div>
                {error && <div className="bg-red-900/60 border border-red-500 rounded-lg p-3 mb-4">Unable to load activity history: {error}. Confirm the activity_logs SQL setup and RLS policies have been applied.</div>}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    {loading ? <div className="p-8 text-center text-gray-600">Loading activity...</div> :
                    rows.length === 0 ? <div className="p-8 text-center text-gray-600">No activity records found.</div> :
                    <div className="divide-y divide-gray-200">
                        {rows.map(row => (
                            <div key={row.id} className="p-4 text-gray-900">
                                <div className="flex flex-wrap justify-between gap-2">
                                    <div className="font-bold">{(row.event_type || 'EVENT').replaceAll('_', ' ')}</div>
                                    <div className="text-xs text-gray-500">{formatDate(row.created_at)}</div>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">{row.description || '—'}</p>
                                {['PLAYER_SOLD', 'UNSOLD_PLAYER_SOLD', 'OWNER_RETENTION'].includes(row.event_type) && row.metadata?.amount != null && <p className="text-sm font-semibold text-emerald-700 mt-1">Sold amount: ₹{Number(row.metadata.amount).toLocaleString('en-IN')}</p>}
                                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                    <span className="bg-slate-100 px-2 py-1 rounded">{row.event_category}</span>
                                    {row.entity_type && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{row.entity_type}{row.event_type === 'PLAYER_SELECTED' ? '' : (row.entity_id ? ` · ${row.entity_id}` : '')}</span>}
                                    {row.status && row.status !== 'SUCCESS' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded">{row.status}</span>}
                                </div>
                            </div>
                        ))}
                    </div>}
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-gray-300">Page {page + 1}{hasMore ? ' · More records available' : ' · Latest page'}</span>
                    <div className="flex gap-2">
                        <button disabled={page === 0 || loading} onClick={() => setPage(p => Math.max(0, p - 1))} className="px-4 py-2 rounded bg-gray-700 disabled:opacity-40">Previous</button>
                        <button disabled={!hasMore || loading} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded bg-gray-700 disabled:opacity-40">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
