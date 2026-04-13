'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/backend';

type AgentSession = {
  session_id?: string;
  agent_id?: string | null;
  state?: string | null;
  campaign_id?: string | null;
  started_at?: string | null;
  registration_verified?: boolean | null;
};

export default function AgentSessionPage() {
  const [data, setData] = useState<AgentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<AgentSession[]>('/api/agent-sessions')
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);


  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Agent Status</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">agent id</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">state</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">campaign id</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">started at</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">registration verified</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.session_id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.agent_id ?? '—'}</td><td className="px-3 py-2 text-sm">{row.state ?? '—'}</td><td className="px-3 py-2 text-sm">{row.campaign_id ?? '—'}</td><td className="px-3 py-2 text-sm">{row.started_at ? new Date(row.started_at).toLocaleString() : '—'}</td><td className="px-3 py-2 text-sm">{row.registration_verified === true ? '✓' : row.registration_verified === false ? '✗' : '—'}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-4 text-sm text-neutral-500 text-center">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

    </div>
  );
}
