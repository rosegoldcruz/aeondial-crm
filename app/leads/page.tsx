'use client';
import { useEffect, useState } from 'react';
import { ORG_ID, apiGet } from '@/lib/backend';

type Lead = {
  lead_id?: string;
  contact_id?: string | null;
  status?: string | null;
  source?: string | null;
  assigned_agent?: string | null;
  attempt_count?: number;
  do_not_call?: boolean;
};

export default function LeadPage() {
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<Lead[]>(`/api/leads?org_id=${encodeURIComponent(ORG_ID)}`)
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);


  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Leads</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">contact id</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">status</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">source</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">assigned agent</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">attempt count</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">do not call</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.lead_id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.contact_id ?? '—'}</td><td className="px-3 py-2 text-sm">{row.status ?? '—'}</td><td className="px-3 py-2 text-sm">{row.source ?? '—'}</td><td className="px-3 py-2 text-sm">{row.assigned_agent ?? '—'}</td><td className="px-3 py-2 text-sm">{row.attempt_count ?? '—'}</td><td className="px-3 py-2 text-sm">{row.do_not_call === true ? '✓' : row.do_not_call === false ? '✗' : '—'}</td>
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
