import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to fetch and poll auction data from Supabase for the read-only viewer page.
 * No authentication required — uses the Supabase anon key.
 * 
 * Reads only the compact `auction_viewer_data` snapshot. The full private auction
 * backup remains in `auction_data` and is not downloaded by public viewers.
 * Run `supabase/auction_viewer_data.sql` before enabling this version.
 */
export const useViewerData = (userId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const pollRef = useRef(null);

    const fetchData = useCallback(async () => {
        if (!userId) {
            setError('No auction ID provided in the viewer link.');
            setLoading(false);
            return;
        }

        try {
            const { data: result, error: fetchError } = await supabase
                .from('auction_viewer_data')
                .select('data, updated_at')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (fetchError) {
                console.error('Viewer fetch error:', fetchError);
                setError(fetchError.message);
            } else if (result?.data) {
                setData(result.data);
                setLastUpdated(result.updated_at);
                setError(null);
            } else {
                setError('No auction data found for this link.');
            }
        } catch (err) {
            console.error('Viewer fetch exception:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Poll every 30 seconds to reduce unnecessary Supabase requests
    useEffect(() => {
        if (!userId) return;
        pollRef.current = setInterval(fetchData, 30000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [userId, fetchData]);

    return {
        tournamentName: data?.tournamentName || '',
        sponsorName: data?.sponsorName || '',
        tickerDetails: data?.tickerDetails || '',
        selectedCategory: data?.selectedCategory || '',
        auctionStarted: data?.auctionStarted || false,
        currentPlayer: data?.currentPlayer || null,
        categoryStats: data?.categoryStats || { sold: 0, unsold: 0, remaining: 0 },
        progress: data?.progress || { total: 0, sold: 0, unsold: 0, remaining: 0, percentage: 0 },
        teams: data?.teams || {},
        loading,
        hasData: data !== null,
        error,
        lastUpdated,
        refetch: fetchData
    };
};
