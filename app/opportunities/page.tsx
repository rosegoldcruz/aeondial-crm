'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/backend';

type Opportunity = {
  opportunity_id?: string;
  title?: string | null;
  value?: number | null;
  status?: string | null;
  stage_id?: string | null;
  assigned_agent?: string | null;
  close_date?: string | null;
};

export default function OpportunityPage() {
  const [data, setData] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<Opportunity[]>('/api/opportunities')
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);


  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Opportunities</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">title</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">value</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">status</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">stage id</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">assigned agent</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">close date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.opportunity_id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.title ?? '—'}</td><td className="px-3 py-2 text-sm">{row.value ?? '—'}</td><td className="px-3 py-2 text-sm">{row.status ?? '—'}</td><td className="px-3 py-2 text-sm">{row.stage_id ?? '—'}</td><td className="px-3 py-2 text-sm">{row.assigned_agent ?? '—'}</td><td className="px-3 py-2 text-sm">{row.close_date ? new Date(row.close_date).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-4 text-sm text-neutral-500 text-center">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

    </div>
  );
}
