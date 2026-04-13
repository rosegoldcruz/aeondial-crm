'use client';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/backend';

type Appointment = {
  appointment_id?: string;
  title?: string | null;
  type?: string | null;
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  assigned_agent_id?: string | null;
  notes?: string | null;
};

export default function AppointmentPage() {
  const [data, setData] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<Appointment[]>('/api/appointments')
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);


  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Appointments</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">title</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">type</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">status</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">start time</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">end time</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">assigned agent id</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">notes</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.appointment_id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.title ?? '—'}</td><td className="px-3 py-2 text-sm">{row.type ?? '—'}</td><td className="px-3 py-2 text-sm">{row.status ?? '—'}</td><td className="px-3 py-2 text-sm">{row.start_time ? new Date(row.start_time).toLocaleString() : '—'}</td><td className="px-3 py-2 text-sm">{row.end_time ? new Date(row.end_time).toLocaleString() : '—'}</td><td className="px-3 py-2 text-sm">{row.assigned_agent_id ?? '—'}</td><td className="px-3 py-2 text-sm">{row.notes ?? '—'}</td>
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
