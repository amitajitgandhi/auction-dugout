import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to fetch and poll auction data from Supabase for the read-only viewer page.
 * No authentication required — uses the Supabase anon key.
 * 
 * NOTE: For this to work, the `auction_data` table needs a Row Level Security (RLS) policy
 * that allows public SELECT access. Example SQL:
 * 
 *   CREATE POLICY "allow_public_viewer_read" ON auction_data
 *   FOR SELECT USING (true);
 * 
 * Or for more restrictive access, add a `viewer_enabled` boolean column and use:
 *   CREATE POLICY "allow_viewer_read" ON auction_data
 *   FOR SELECT USING (viewer_enabled = true);
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
                .from('auction_data')
                .select('user_id, data, updated_at')
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

    // Poll every 15 seconds to reduce unnecessary Supabase requests
    useEffect(() => {
        if (!userId) return;
        pollRef.current = setInterval(fetchData, 15000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [userId, fetchData]);

    return {
        players: data?.players || [],
        teams: data?.teams || {},
        tournamentName: data?.tournamentName || '',
        sponsorName: data?.sponsorName || '',
        tickerDetails: data?.tickerDetails || '',
        selectedCategory: data?.selectedCategory || '',
        completedCategories: data?.completedCategories || [],
        currentPlayerName: data?.currentPlayerName || null,
        auctionStarted: data?.auctionStarted || false,
        categoryConfigs: data?.categoryConfigs || {},
        loading,
        hasData: data !== null,
        error,
        lastUpdated,
        refetch: fetchData
    };
};
