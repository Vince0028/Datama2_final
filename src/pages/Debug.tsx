import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';

export default function Debug() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string, data?: any) => {
        const timestamp = new Date().toLocaleTimeString();
        const content = data ? `${msg}\n${JSON.stringify(data, null, 2)}` : msg;
        setLogs(prev => [`[${timestamp}] ${content}`, ...prev]);
    };

    const runDiagnostics = async () => {
        setLoading(true);
        setLogs([]);
        addLog("Starting Diagnostics (Isolated Mode)...");

        try {
            // 0. Check Environment
            addLog("Checking Environment Variables...");
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
            addLog("URL:", url ? "Present" : "MISSING");
            addLog("KEY:", key ? "Present" : "MISSING");

            if (!url || !key) throw new Error("Missing Environment Variables");

            // 1. Create LOCAL Client (bypass global)
            addLog("Creating Local Supabase Client...");
            // Use a fresh client to rule out any global configuration or middleware issues
            const localClient = createClient(url, key, {
                auth: {
                    persistSession: false, // Disable persistence to rule out localStorage issues
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            });

            // 2. Test Raw Query (No Auth)
            addLog("Test 1: Fetching RoomType (Raw/No Auth)...");
            const { data: rawData, error: rawError } = await localClient
                .from('roomtype')
                .select('*')
                .limit(3);

            addLog("RoomType Result:", { count: rawData?.length, data: rawData, error: rawError });

            // 3. Test Room Table
            addLog("Test 2: Fetching Room (Raw/No Auth)...");
            const { data: roomData, error: roomError } = await localClient
                .from('room')
                .select('*')
                .limit(3);
            addLog("Room Result:", { count: roomData?.length, error: roomError });

            // 4. NOW Check Auth
            addLog("Test 3: Checking Auth Session (Local Client)...");
            const { data: sessionData, error: sessionError } = await localClient.auth.getSession();
            addLog("Session Result:", { session: sessionData.session ? "Active" : "None", error: sessionError });

        } catch (err: any) {
            addLog("CRITICAL ERROR:", err.message || err);
        } finally {
            setLoading(false);
            addLog("Diagnostics Complete.");
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">System Diagnostics (Isolated)</h1>

            <div className="flex gap-4">
                <Button onClick={runDiagnostics} disabled={loading}>
                    {loading ? 'Running...' : 'Run Diagnostics'}
                </Button>
            </div>

            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm h-[600px] overflow-auto whitespace-pre-wrap">
                {logs.length === 0 ? "Click 'Run Diagnostics' to start..." : logs.join('\n\n')}
            </div>
        </div>
    );
}
