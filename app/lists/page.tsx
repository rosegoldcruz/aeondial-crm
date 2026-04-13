'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/backend';

type LeadList = {
  list_id?: string;
  name?: string | null;
  source_type?: string | null;
  total_rows?: number | null;
  imported_rows?: number | null;
  status?: string | null;
};

export default function LeadListPage() {
  const [data, setData] = useState<LeadList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<LeadList[]>('/api/lead-lists')
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);


  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Lead Lists</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">name</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">source type</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">total rows</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">imported rows</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.list_id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.name ?? '—'}</td><td className="px-3 py-2 text-sm">{row.source_type ?? '—'}</td><td className="px-3 py-2 text-sm">{row.total_rows ?? '—'}</td><td className="px-3 py-2 text-sm">{row.imported_rows ?? '—'}</td><td className="px-3 py-2 text-sm">{row.status ?? '—'}</td>
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
