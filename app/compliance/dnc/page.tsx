'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/backend';

type DncNumber = {
  id?: string;
  phone_number?: string | null;
  reason?: string | null;
  source?: string | null;
  added_by?: string | null;
  created_at?: string | null;
};

export default function DncNumberPage() {
  const [data, setData] = useState<DncNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<DncNumber[]>('/api/dnc-numbers')
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);


  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">DNC Numbers</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">phone number</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">reason</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">source</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">added by</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">created at</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.phone_number ?? '—'}</td><td className="px-3 py-2 text-sm">{row.reason ?? '—'}</td><td className="px-3 py-2 text-sm">{row.source ?? '—'}</td><td className="px-3 py-2 text-sm">{row.added_by ?? '—'}</td><td className="px-3 py-2 text-sm">{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</td>
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
