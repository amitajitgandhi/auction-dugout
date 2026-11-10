import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const PAGE_SIZE = 25;
const EXPORT_BATCH_SIZE = 1000;
const formatDate = (value) => value ? new Date(value).toLocaleString() : '—';
const formatValue = (value) => value == null || value === '' ? '—' : (typeof value === 'object' ? JSON.stringify(value) : String(value));
const displayEvent = (value) => (value || 'EVENT').replaceAll('_', ' ');
const csvCell = (value) => {
    const text = value == null ? '' : (typeof value === 'object' ? JSON.stringify(value) : String(value));
    return '"' + text.replace(/"/g, '""') + '"';
};

export default function ActivityLogsPage({ authUser, tournamentName, onBack }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState('');
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [eventFilter, setEventFilter] = useState('ALL');

    const buildQuery = useCallback(() => {
        let query = supabase
            .from('activity_logs')
            .select('id, created_at, event_category, event_type, description, entity_type, entity_id, status, metadata, old_data, new_data')
            .eq('user_id', authUser.id)
            .order('created_at', { ascending: false });
        if (tournamentName) query = query.eq('tournament_name', tournamentName);
        if (categoryFilter !== 'ALL') query = query.eq('event_category', categoryFilter);
        if (eventFilter !== 'ALL') query = query.eq('event_type', eventFilter);
        const term = searchText.trim().replace(/[,%()]/g, ' ');
        if (term) query = query.or(`description.ilike.%${term}%,event_type.ilike.%${term}%,entity_type.ilike.%${term}%,entity_id.ilike.%${term}%`);
        return query;
    }, [authUser?.id, tournamentName, categoryFilter, eventFilter, searchText]);

    const loadPage = useCallback(async () => {
        if (!authUser?.id) return;
        setLoading(true);
        setError('');
        const { data, error: queryError } = await buildQuery().range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
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
    }, [authUser?.id, buildQuery, page]);

    useEffect(() => { loadPage(); }, [loadPage]);

    const exportCsv = async () => {
        if (!authUser?.id || exporting) return;
        setExporting(true);
        setError('');
        try {
            const allRows = [];
            for (let offset = 0; ; offset += EXPORT_BATCH_SIZE) {
                const { data, error: queryError } = await buildQuery().range(offset, offset + EXPORT_BATCH_SIZE - 1);
                if (queryError) throw queryError;
                const batch = data || [];
                allRows.push(...batch);
                if (batch.length < EXPORT_BATCH_SIZE) break;
            }
            if (!allRows.length) {
                setError('There are no activity records matching the current filters to export.');
                return;
            }
            const headers = ['Date & Time', 'Category', 'Activity', 'Description', 'Entity Type', 'Entity', 'Status', 'Old Values', 'New Values', 'Metadata'];
            const lines = [
                headers.map(csvCell).join(','),
                ...allRows.map(row => [
                    row.created_at, row.event_category, row.event_type, row.description,
                    row.entity_type, row.entity_type === 'PLAYER' ? 'PLAYER' : row.entity_id,
                    row.status, row.old_data, row.new_data, row.metadata
                ].map(csvCell).join(','))
            ];
            const blob = new Blob(['\\uFEFF' + lines.join('\\r\\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `auction-dugout-activity-${(tournamentName || 'all-tournaments').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (exportError) {
            setError(exportError.message || 'Unable to export activity history.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-800 text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Auction Dugout</p>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">Activity History</h1>
                        <p className="text-slate-300 mt-2">{tournamentName || 'All tournaments'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={loadPage} disabled={loading} className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 font-medium">Refresh</button>
                        <button onClick={exportCsv} disabled={exporting || loading} className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-semibold shadow-sm">{exporting ? 'Preparing CSV…' : 'Export CSV ↓'}</button>
                        <button onClick={onBack} className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 font-medium">Back</button>
                    </div>
                </div>

                <section className="bg-white rounded-2xl p-4 md:p-5 mb-5 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="block">
                            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Search activity</span>
                            <input value={searchText} onChange={e => { setSearchText(e.target.value); setPage(0); }} placeholder="Search player, team, event…" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                        </label>
                        <label className="block">
                            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Category</span>
                            <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0); }} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                <option value="ALL">All categories</option><option value="BUSINESS">Business</option><option value="SYSTEM">System</option>
                            </select>
                        </label>
                        <label className="block">
                            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Activity type</span>
                            <select value={eventFilter} onChange={e => { setEventFilter(e.target.value); setPage(0); }} className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                <option value="ALL">All activities</option>
                                {[...new Set(rows.map(row => row.event_type).filter(Boolean))].sort().map(type => <option key={type} value={type}>{displayEvent(type)}</option>)}
                            </select>
                        </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">CSV export includes all records matching these filters, not just the current page.</p>
                </section>

                {error && <div role="alert" className="bg-red-950/70 border border-red-400/50 text-red-100 rounded-xl p-3.5 mb-4 text-sm">{error}</div>}

                <div className="space-y-3">
                    {loading ? <div className="bg-white rounded-2xl p-10 text-center text-slate-600 shadow">Loading activity…</div> :
                    rows.length === 0 ? <div className="bg-white rounded-2xl p-10 text-center text-slate-600 shadow">No activity records found.</div> :
                    rows.map(row => {
                        const changes = row.old_data && row.new_data
                            ? Object.keys(row.new_data).filter(key => JSON.stringify(row.old_data?.[key] ?? null) !== JSON.stringify(row.new_data?.[key] ?? null))
                            : [];
                        const isFailure = row.status && row.status !== 'SUCCESS';
                        return (
                            <article key={row.id} className="bg-white text-slate-900 rounded-2xl shadow-md border border-slate-200/80 overflow-hidden">
                                <div className="p-4 md:p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-sm md:text-base font-extrabold tracking-wide text-slate-900">{displayEvent(row.event_type)}</h2>
                                                {isFailure && <span className="text-[11px] font-bold uppercase rounded-full bg-red-100 text-red-700 px-2.5 py-1">{row.status}</span>}
                                            </div>
                                            <p className="text-sm md:text-[15px] text-slate-700 mt-1.5 leading-relaxed">{row.description || '—'}</p>
                                        </div>
                                        <time className="text-xs text-slate-500 whitespace-nowrap sm:text-right">{formatDate(row.created_at)}</time>
                                    </div>

                                    {changes.length > 0 && (
                                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                                            <div className="px-3.5 py-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">Changes made</div>
                                            <div className="divide-y divide-slate-200">
                                                {changes.map(key => (
                                                    <div key={key} className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-1 sm:gap-4 px-3.5 py-2.5 text-sm">
                                                        <span className="font-semibold text-slate-600 capitalize">{key.replaceAll('_', ' ')}</span>
                                                        <span className="min-w-0 break-words text-slate-800"><span>{formatValue(row.old_data?.[key])}</span><span className="mx-2 text-slate-400">→</span><span className="font-semibold text-slate-950">{formatValue(row.new_data?.[key])}</span></span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {['PLAYER_SOLD', 'UNSOLD_PLAYER_SOLD', 'OWNER_RETENTION'].includes(row.event_type) && row.metadata?.amount != null && (
                                        <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">Sale amount <span className="text-base">₹{Number(row.metadata.amount).toLocaleString('en-IN')}</span></div>
                                    )}
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {row.event_category && <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">{row.event_category}</span>}
                                        {row.entity_type && <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium">{row.entity_type}{row.entity_type === 'PLAYER' ? '' : (row.entity_id ? ` · ${row.entity_id}` : '')}</span>}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 text-sm">
                    <span className="text-slate-300">Page {page + 1}{hasMore ? ' · More records available' : ' · Latest page'}</span>
                    <div className="flex gap-2">
                        <button disabled={page === 0 || loading} onClick={() => setPage(p => Math.max(0, p - 1))} className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40">Previous</button>
                        <button disabled={!hasMore || loading} onClick={() => setPage(p => p + 1)} className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
