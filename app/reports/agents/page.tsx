'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/backend';

type AgentStateHistory = {
  history_id?: string;
  agent_id?: string | null;
  from_state?: string | null;
  to_state?: string | null;
  reason?: string | null;
  occurred_at?: string | null;
};

export default function AgentStateHistoryPage() {
  const [data, setData] = useState<AgentStateHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<AgentStateHistory[]>('/api/agent-state-history')
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);


  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Agent State History</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">agent id</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">from state</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">to state</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">reason</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">occurred at</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.history_id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.agent_id ?? '—'}</td><td className="px-3 py-2 text-sm">{row.from_state ?? '—'}</td><td className="px-3 py-2 text-sm">{row.to_state ?? '—'}</td><td className="px-3 py-2 text-sm">{row.reason ?? '—'}</td><td className="px-3 py-2 text-sm">{row.occurred_at ? new Date(row.occurred_at).toLocaleString() : '—'}</td>
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
