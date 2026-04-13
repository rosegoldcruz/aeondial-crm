'use client';
import { useEffect, useState } from 'react';
import { ORG_ID, apiGet } from '@/lib/backend';

type UserRecord = {
  user_id?: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
};

export default function UserRecordPage() {
  const [data, setData] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<UserRecord[]>(`/api/users?org_id=${encodeURIComponent(ORG_ID)}`)
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);


  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Users</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">full name</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">email</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">role</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.user_id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.full_name ?? '—'}</td><td className="px-3 py-2 text-sm">{row.email ?? '—'}</td><td className="px-3 py-2 text-sm">{row.role ?? '—'}</td><td className="px-3 py-2 text-sm">{row.status ?? '—'}</td>
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
