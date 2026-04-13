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
  metadata?: Record<string, unknown> | null;
};

export default function LeadPage() {
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
  useEffect(() => {
    let mounted = true;
    apiGet<Lead[]>(`/api/leads?org_id=${encodeURIComponent(ORG_ID)}`)
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  const filtered = data.filter((row) => {
    const q = query.toLowerCase();
    if (!q) return true;
    const meta = (row as any).metadata ?? {};
    return (
      (meta.lead_name ?? '').toLowerCase().includes(q) ||
      (meta.phone ?? '').toLowerCase().includes(q) ||
      (meta.email ?? '').toLowerCase().includes(q) ||
      ((row as any).contact_id ?? '').toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Lead Search</h1>
            <input
        className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white w-full max-w-md"
        placeholder="Search by name, phone, or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">contact id</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">status</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">source</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">assigned agent</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">attempt count</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">do not call</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.lead_id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.contact_id ?? '—'}</td><td className="px-3 py-2 text-sm">{row.status ?? '—'}</td><td className="px-3 py-2 text-sm">{row.source ?? '—'}</td><td className="px-3 py-2 text-sm">{row.assigned_agent ?? '—'}</td><td className="px-3 py-2 text-sm">{row.attempt_count ?? '—'}</td><td className="px-3 py-2 text-sm">{row.do_not_call === true ? '✓' : row.do_not_call === false ? '✗' : '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-4 text-sm text-neutral-500 text-center">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

    </div>
  );
}
