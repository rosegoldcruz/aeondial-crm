'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ORG_ID, apiGet } from '@/lib/backend';

type Campaign = {
  campaign_id?: string;
  id?: string;
  name?: string;
  status?: string;
  channel?: string;
  starts_at?: string;
  ends_at?: string;
};

export default function CampaignsPage() {
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

  if (loading) return <div className="p-6 text-neutral-400">Loading campaigns…</div>;
  if (error)   return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Campaign Management</h1>
      <Card className="p-4">
        <div className="space-y-2">
          {data.length === 0 && <p className="text-neutral-500 text-sm">No campaigns found.</p>}
          {data.map((row) => {
            const key = row.campaign_id ?? row.id ?? String(Math.random());
            return (
              <div key={key} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <div className="font-medium">{row.name ?? key}</div>
                  <div className="text-neutral-500 text-xs">
                    {row.starts_at ? new Date(row.starts_at).toLocaleDateString() : '—'}
                    {' → '}
                    {row.ends_at ? new Date(row.ends_at).toLocaleDateString() : '—'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {row.channel && <Badge variant="outline">{row.channel}</Badge>}
                  <Badge variant="outline">{row.status ?? 'unknown'}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
