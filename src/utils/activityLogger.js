import { supabase } from '../supabaseClient';

// Best-effort activity telemetry. Never await this from auction transactions.
// Events are buffered and inserted in batches; a logging failure is intentionally
// isolated from auction state, persistence, and UI workflows.
const queue = [];
let flushTimer = null;
let flushing = false;

const flush = async () => {
    if (flushing || queue.length === 0) return;
    flushing = true;
    const batch = queue.splice(0, 50);
    try {
        const { error } = await supabase.from('activity_logs').insert(batch);
        if (error) {
            console.warn('[ACTIVITY_LOG] Batch was not persisted:', error.message);
            // Do not retry indefinitely or allow telemetry to grow without bound.
        }
    } catch (error) {
        console.warn('[ACTIVITY_LOG] Logging unavailable:', error?.message || error);
    } finally {
        flushing = false;
        if (queue.length) scheduleFlush(100);
    }
};

const scheduleFlush = (delay = 1200) => {
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
        flushTimer = null;
        void flush();
    }, delay);
};

export const logActivity = (user, tournamentName, eventType, details = {}) => {
    if (!user?.id || !eventType) return;
    const event = {
        user_id: user.id,
        user_email: user.email || null,
        tournament_name: tournamentName || null,
        event_category: details.eventCategory || 'BUSINESS',
        event_type: String(eventType).slice(0, 100),
        description: String(details.description || eventType).slice(0, 500),
        entity_type: details.entityType || null,
        entity_id: details.entityId == null ? null : String(details.entityId),
        old_data: details.oldData ?? null,
        new_data: details.newData ?? null,
        metadata: details.metadata || {},
        status: details.status || 'SUCCESS'
    };
    // Cap pending events so a prolonged offline session cannot consume memory.
    if (queue.length >= 500) queue.splice(0, queue.length - 499);
    queue.push(event);
    scheduleFlush();
};

export const flushActivityLogs = () => flush();
