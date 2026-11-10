import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const PAGE_SIZE = 25;
const formatDate = (value) => new Date(value).toLocaleString();

export default function ActivityLogsPage({ authUser, tournamentName, onBack }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [eventFilter, setEventFilter] = useState('');
    const [error, setError] = useState('');

    const loadPage = useCallback(async () => {
        if (!authUser?.id) return;
        setLoading(true);
        setError('');
        let query = supabase
            .from('activity_logs')
            .select('id, created_at, event_category, event_type, description, entity_type, entity_id, status, metadata', { count: 'exact' })
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (tournamentName) query = query.eq('tournament_name', tournamentName);
        if (eventFilter.trim()) query = query.ilike('event_type', `%${eventFilter.trim()}%`);
        const { data, error: queryError, count } = await query;
        if (queryError) {
            setError(queryError.message);
            setRows([]);
            setTotal(0);
        } else {
            setRows(data || []);
            setTotal(count || 0);
        }
        setLoading(false);
    }, [authUser?.id, tournamentName, page, eventFilter]);

    useEffect(() => { loadPage(); }, [loadPage]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div>
                        <p className="text-sm uppercase tracking-widest text-cyan-300">Auction Dugout</p>
                        <h1 className="text-3xl md:text-4xl font-bold">Activity History</h1>
                        <p className="text-gray-300 mt-1">{tournamentName || 'All tournaments'} · {total} events</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={loadPage} className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600">Refresh</button>
                        <button onClick={onBack} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Back</button>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 mb-4 shadow">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Filter by event type</label>
                    <input value={eventFilter} onChange={e => { setPage(0); setEventFilter(e.target.value); }} placeholder="e.g. PLAYER_SOLD, BOOSTER..." className="w-full md:w-96 border border-gray-300 rounded-lg px-3 py-2 text-gray-900" />
                    <p className="text-xs text-gray-500 mt-2">Loads only 25 records per page to keep database reads and egress low.</p>
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
                                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                    <span className="bg-slate-100 px-2 py-1 rounded">{row.event_category}</span>
                                    {row.entity_type && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{row.entity_type}{row.entity_id ? ` · ${row.entity_id}` : ''}</span>}
                                    {row.status && row.status !== 'SUCCESS' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded">{row.status}</span>}
                                </div>
                            </div>
                        ))}
                    </div>}
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-gray-300">Page {page + 1} of {totalPages}</span>
                    <div className="flex gap-2">
                        <button disabled={page === 0 || loading} onClick={() => setPage(p => Math.max(0, p - 1))} className="px-4 py-2 rounded bg-gray-700 disabled:opacity-40">Previous</button>
                        <button disabled={page + 1 >= totalPages || loading} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded bg-gray-700 disabled:opacity-40">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
