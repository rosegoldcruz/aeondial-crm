'use client';
import { useEffect, useState } from 'react';
import { ORG_ID, apiGet } from '@/lib/backend';

type CallRecord = {
  call_id?: string;
  campaign_id?: string | null;
  direction?: string | null;
  status?: string | null;
  started_at?: string | null;
  duration_seconds?: number | null;
  assigned_agent?: string | null;
};

export default function CallRecordPage() {
  const [data, setData] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<CallRecord[]>(`/api/calls?org_id=${encodeURIComponent(ORG_ID)}`)
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);


  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Call Reports</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">call id</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">campaign id</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">direction</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">status</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">started at</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">duration seconds</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">assigned agent</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.call_id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.call_id ?? '—'}</td><td className="px-3 py-2 text-sm">{row.campaign_id ?? '—'}</td><td className="px-3 py-2 text-sm">{row.direction ?? '—'}</td><td className="px-3 py-2 text-sm">{row.status ?? '—'}</td><td className="px-3 py-2 text-sm">{row.started_at ? new Date(row.started_at).toLocaleString() : '—'}</td><td className="px-3 py-2 text-sm">{row.duration_seconds ?? '—'}</td><td className="px-3 py-2 text-sm">{row.assigned_agent ?? '—'}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-4 text-sm text-neutral-500 text-center">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

    </div>
  );
}
