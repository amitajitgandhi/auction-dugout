import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

const PAGE_SIZE = 25;
const EXPORT_BATCH_SIZE = 1000;
const formatDate = (value) => value ? new Date(value).toLocaleString() : '—';
const displayEvent = (value) => (value || 'EVENT').replaceAll('_', ' ');
const csvCell = (value) => {
    const text = value == null ? '' : (typeof value === 'object' ? JSON.stringify(value) : String(value));
    return '"' + text.replace(/"/g, '""') + '"';
};
const getChangesJson = (row) => {
    if (!row.old_data && !row.new_data) return null;
    const oldData = row.old_data || {};
    const newData = row.new_data || {};
    const keys = [...new Set([...Object.keys(oldData), ...Object.keys(newData)])];
    const changes = {};
    keys.forEach(key => {
        const oldValue = oldData[key] ?? null;
        const newValue = newData[key] ?? null;
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[key] = { old: oldValue, new: newValue };
        }
    });
    return Object.keys(changes).length ? changes : null;
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
    const [selectedJson, setSelectedJson] = useState(null);

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

    const eventOptions = useMemo(() => [...new Set(rows.map(row => row.event_type).filter(Boolean))].sort(), [rows]);

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
            const headers = ['Date & Time', 'Category', 'Activity', 'Description', 'Entity Type', 'Entity', 'Status', 'Changes (JSON)', 'Metadata'];
            const lines = [
                headers.map(csvCell).join(','),
                ...allRows.map(row => [
                    row.created_at, row.event_category, row.event_type, row.description,
                    row.entity_type, row.entity_type === 'PLAYER' ? 'PLAYER' : row.entity_id,
                    row.status, getChangesJson(row), row.metadata
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

    const openChanges = (row) => {
        const changes = getChangesJson(row);
        if (changes) setSelectedJson({ title: displayEvent(row.event_type), json: changes });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-800 text-white p-4 md:p-8">
            <div className="max-w-[1600px] mx-auto">
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
                                {eventOptions.map(type => <option key={type} value={type}>{displayEvent(type)}</option>)}
                            </select>
                        </label>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">CSV export includes all records matching these filters, not just the current page.</p>
                </section>

                {error && <div role="alert" className="bg-red-950/70 border border-red-400/50 text-red-100 rounded-xl p-3.5 mb-4 text-sm">{error}</div>}

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {loading ? <div className="p-10 text-center text-slate-600">Loading activity…</div> :
                    rows.length === 0 ? <div className="p-10 text-center text-slate-600">No activity records found.</div> : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] table-fixed text-left">
                                <colgroup>
                                    <col className="w-[165px]" />
                                    <col className="w-[175px]" />
                                    <col className="w-[27%]" />
                                    <col className="w-[38%]" />
                                    <col className="w-[115px]" />
                                </colgroup>
                                <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
                                    <tr className="text-[11px] uppercase tracking-wider text-slate-600">
                                        <th className="px-4 py-3.5 font-bold">Date &amp; Time</th>
                                        <th className="px-4 py-3.5 font-bold">Activity</th>
                                        <th className="px-4 py-3.5 font-bold">Description</th>
                                        <th className="px-4 py-3.5 font-bold">Changes (JSON)</th>
                                        <th className="px-4 py-3.5 font-bold">Category</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rows.map(row => {
                                        const changes = getChangesJson(row);
                                        const jsonText = changes ? JSON.stringify(changes) : '—';
                                        const isFailure = row.status && row.status !== 'SUCCESS';
                                        return (
                                            <tr key={row.id} className="h-[58px] hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(row.created_at)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="truncate text-xs font-extrabold tracking-wide text-slate-800" title={displayEvent(row.event_type)}>{displayEvent(row.event_type)}</span>
                                                        {isFailure && <span className="shrink-0 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">{row.status}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    <div className="truncate" title={row.description || ''}>{row.description || '—'}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {changes ? (
                                                        <button type="button" onClick={() => openChanges(row)} className="group flex w-full min-w-0 items-center gap-2 text-left rounded-md px-2 py-1.5 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400" title="View complete JSON">
                                                            <code className="block min-w-0 flex-1 truncate whitespace-nowrap text-xs text-slate-600">{jsonText}</code>
                                                            <span className="shrink-0 text-[11px] font-semibold text-blue-700 group-hover:text-blue-900">View</span>
                                                        </button>
                                                    ) : <span className="px-2 text-sm text-slate-400">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.event_category ? <span className="inline-flex rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">{row.event_category}</span> : <span className="text-slate-400">—</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 text-sm">
                    <span className="text-slate-300">Page {page + 1}{hasMore ? ' · More records available' : ' · Latest page'}</span>
                    <div className="flex gap-2">
                        <button disabled={page === 0 || loading} onClick={() => setPage(p => Math.max(0, p - 1))} className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40">Previous</button>
                        <button disabled={!hasMore || loading} onClick={() => setPage(p => p + 1)} className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40">Next</button>
                    </div>
                </div>
            </div>

            {selectedJson && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedJson(null); }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="activity-json-title" className="w-full max-w-3xl max-h-[75vh] flex flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
                        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                            <div className="min-w-0">
                                <h2 id="activity-json-title" className="font-bold text-lg">Changes JSON</h2>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{selectedJson.title}</p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                                <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(selectedJson.json, null, 2))} className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">Copy JSON</button>
                                <button onClick={() => setSelectedJson(null)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200" aria-label="Close JSON dialog">Close</button>
                            </div>
                        </header>
                        <pre className="overflow-auto p-5 text-xs leading-6 text-slate-800"><code>{JSON.stringify(selectedJson.json, null, 2)}</code></pre>
                    </section>
                </div>
            )}
        </div>
    );
}
