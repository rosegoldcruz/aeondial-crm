'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/backend';

type Campaign = {
  campaign_id?: string;
  name?: string | null;
  status?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

export default function CampaignPage() {
  const [data, setData] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<Campaign[]>('/api/campaigns')
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);


  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Campaign Reports</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">name</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">status</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">starts at</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">ends at</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.campaign_id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.name ?? '—'}</td><td className="px-3 py-2 text-sm">{row.status ?? '—'}</td><td className="px-3 py-2 text-sm">{row.starts_at ? new Date(row.starts_at).toLocaleString() : '—'}</td><td className="px-3 py-2 text-sm">{row.ends_at ? new Date(row.ends_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-4 text-sm text-neutral-500 text-center">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

    </div>
  );
}
