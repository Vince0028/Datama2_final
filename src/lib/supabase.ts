import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// The supabase-js client — still used for auth & realtime (those work fine).
// Data queries use rawQuery() below because supabase.from().select() hangs.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cached auth token — updated by AuthContext whenever session changes.
// Avoids calling supabase.auth.getSession() which can hang.
let _cachedToken: string | null = null;
export function setCachedToken(token: string | null) { _cachedToken = token; }
export function getCachedToken() { return _cachedToken; }

// ── Raw REST helper — bypasses supabase-js for data fetching ────────────
// supabase.from().select() hangs in this environment, but raw fetch works.
export async function rawQuery<T = any>(
    table: string,
    options?: {
        select?: string;
        filters?: string;        // e.g. "room_id=eq.1"
        order?: string;          // e.g. "room_id.asc"
        single?: boolean;
        token?: string;          // pass token directly to avoid getSession()
    }
): Promise<{ data: T[] | null; error: any }> {
    try {
        const token = options?.token || _cachedToken || supabaseAnonKey;

        const select = options?.select || '*';
        let url = `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
        if (options?.filters) url += `&${options.filters}`;
        if (options?.order) url += `&order=${options.order}`;

        const res = await fetch(url, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            const text = await res.text();
            return { data: null, error: { message: `HTTP ${res.status}: ${text}`, code: res.status } };
        }

        const data = await res.json();
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
}

// Raw INSERT/UPDATE/DELETE helper
export async function rawMutate<T = any>(
    table: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    options: {
        body?: any;
        filters?: string;       // for PATCH/DELETE: "reservation_id=eq.5"
        returnData?: boolean;    // if true, returns inserted/updated rows
        single?: boolean;
        token?: string;          // pass token directly to avoid getSession()
    } = {}
): Promise<{ data: T | null; error: any }> {
    try {
        const token = options.token || _cachedToken || supabaseAnonKey;

        let url = `${supabaseUrl}/rest/v1/${table}`;
        if (options.filters) url += `?${options.filters}`;

        const headers: Record<string, string> = {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
        if (options.returnData) {
            headers['Prefer'] = options.single
                ? 'return=representation,count=exact'
                : 'return=representation';
        }

        const res = await fetch(url, {
            method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!res.ok) {
            const text = await res.text();
            return { data: null, error: { message: `HTTP ${res.status}: ${text}`, code: res.status } };
        }

        if (options.returnData) {
            const data = await res.json();
            return { data: options.single ? data[0] : data, error: null };
        }
        return { data: null, error: null };
    } catch (err: any) {
        return { data: null, error: { message: err.message } };
    }
}
