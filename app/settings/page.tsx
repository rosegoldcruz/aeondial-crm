'use client';
import { useEffect, useState } from 'react';
import { apiGet, apiPatch } from '@/lib/backend';

type TenantAiSettings = {
  id?: string;
  llm_provider?: string | null;
  tts_provider?: string | null;
  stt_provider?: string | null;
};

export default function TenantAiSettingsPage() {
  const [data, setData] = useState<TenantAiSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGet<TenantAiSettings[]>('/api/tenant-ai-settings')
      .then((d) => { if (mounted) { setData(d); setLoading(false); } })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const handleSave = async () => {
    if (!data[0]) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiPatch(`/api/tenant-ai-settings/${(data[0] as any).id}`, form);
      setSaveMsg('Saved successfully.');
    } catch (e: any) {
      setSaveMsg('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Populate form when data loads
  useEffect(() => {
    if (data[0]) setForm({ llm_provider: data[0].llm_provider ?? '', tts_provider: data[0].tts_provider ?? '', stt_provider: data[0].stt_provider ?? '' });
  }, [data]);
  if (loading) return <div className="p-6 text-neutral-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">AI Settings</h1>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">llm provider</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">tts provider</th><th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase">stt provider</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id ?? String(Math.random())} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-sm">{row.llm_provider ?? '—'}</td><td className="px-3 py-2 text-sm">{row.tts_provider ?? '—'}</td><td className="px-3 py-2 text-sm">{row.stt_provider ?? '—'}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-4 text-sm text-neutral-500 text-center">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      <div className="mt-6 space-y-4 max-w-lg">
        <h2 className="text-lg font-semibold">Edit AI Settings</h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400 uppercase">llm provider</label>
          <input
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
            value={form.llm_provider as string ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, llm_provider: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400 uppercase">tts provider</label>
          <input
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
            value={form.tts_provider as string ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, tts_provider: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400 uppercase">stt provider</label>
          <input
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white"
            value={form.stt_provider as string ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, stt_provider: e.target.value }))}
          />
        </div>
        <button
          className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saveMsg && <p className="text-sm text-neutral-400">{saveMsg}</p>}
      </div>
    </div>
  );
}
