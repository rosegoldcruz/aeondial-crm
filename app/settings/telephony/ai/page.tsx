'use client';

import { useEffect, useState } from 'react';
import { Bot, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type LlmProvider = 'openai' | 'deepseek' | 'anthropic';
type TtsProvider = 'elevenlabs';
type SttProvider = 'openai' | 'deepgram';

interface TenantSettings {
  llm_provider: LlmProvider;
  tts_provider: TtsProvider;
  stt_provider: SttProvider;
}

interface CampaignSettings {
  campaignId?: string;
  llm_provider?: LlmProvider | null;
  tts_provider?: TtsProvider | null;
  stt_provider?: SttProvider | null;
}

interface AiSettingsResponse {
  tenant: TenantSettings;
  campaign: CampaignSettings | null;
}

interface FormState {
  tenantId: string;
  campaignId: string;
  llm_provider: LlmProvider;
  tts_provider: TtsProvider;
  stt_provider: SttProvider;
}

function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/^['"]|['"]$/g, '');
}

const BACKEND_URL =
  sanitizeEnv(process.env.NEXT_PUBLIC_AEONDIAL_BACKEND_URL) ||
  sanitizeEnv(process.env.NEXT_PUBLIC_BACKEND_URL) ||
  'http://localhost:4000';

const ENV_DEFAULTS: TenantSettings = {
  llm_provider: 'openai',
  tts_provider: 'elevenlabs',
  stt_provider: 'openai',
};

/** Apply campaign > tenant > env defaults hierarchy */
function resolveEffective(
  tenant: TenantSettings,
  campaign: CampaignSettings | null,
): TenantSettings {
  if (!campaign) return tenant;
  return {
    llm_provider: campaign.llm_provider ?? tenant.llm_provider,
    tts_provider: campaign.tts_provider ?? tenant.tts_provider,
    stt_provider: campaign.stt_provider ?? tenant.stt_provider,
  };
}

export default function AiSettingsPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>({
    tenantId: 'default-tenant',
    campaignId: '',
    ...ENV_DEFAULTS,
  });
  const [effective, setEffective] = useState<TenantSettings>(ENV_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ tenantId: 'default-tenant' });
        const res = await fetch(`${BACKEND_URL}/settings/ai?${params}`);
        if (!res.ok) throw new Error('Failed to load AI settings');
        const data: AiSettingsResponse = await res.json();
        const tenant = data.tenant ?? ENV_DEFAULTS;
        const resolved = resolveEffective(tenant, data.campaign);
        setForm((prev) => ({ ...prev, ...resolved }));
        setEffective(resolved);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to load AI settings';
        toast({
          title: 'Failed to load AI settings',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        tenantId: form.tenantId,
        llm_provider: form.llm_provider,
        tts_provider: form.tts_provider,
        stt_provider: form.stt_provider,
      };
      if (form.campaignId) payload.campaignId = form.campaignId;
      const res = await fetch(`${BACKEND_URL}/settings/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save AI settings');
      setEffective({
        llm_provider: form.llm_provider,
        tts_provider: form.tts_provider,
        stt_provider: form.stt_provider,
      });
      toast({
        title: 'Saved',
        description: 'AI settings saved successfully.',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save AI settings';
      toast({
        title: 'Failed to save AI settings',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-3 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-orange-500 flex items-center gap-3">
              <Bot className="w-8 h-8" />
              AI Settings
            </h1>
            <p className="text-gray-400 mt-1">
              Controls AI provider behaviour for telephony and campaigns.
              Campaign settings override tenant settings.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading AI settings...</div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Scope */}
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-white mb-1">Scope</h2>
            <p className="text-gray-500 text-sm mb-4">
              Specify a Tenant ID and optionally a Campaign ID. Leaving Campaign
              ID blank applies settings to all campaigns under this tenant.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tenant ID
                </label>
                <Input
                  value={form.tenantId}
                  onChange={(e) => handleChange('tenantId', e.target.value)}
                  className="bg-black border-neutral-700 text-white"
                  placeholder="default-tenant"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Campaign ID{' '}
                  <span className="text-neutral-600 font-normal">(optional)</span>
                </label>
                <Input
                  value={form.campaignId}
                  onChange={(e) => handleChange('campaignId', e.target.value)}
                  className="bg-black border-neutral-700 text-white"
                  placeholder="Leave blank to apply to all campaigns"
                />
              </div>
            </div>
          </Card>

          {/* Providers */}
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-white mb-1">Providers</h2>
            <p className="text-gray-500 text-sm mb-4">
              {form.campaignId
                ? `Overrides for campaign "${form.campaignId}". Blank fields fall back to tenant settings.`
                : 'Tenant-level defaults. Campaigns may override these individually.'}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  LLM Provider
                </label>
                <select
                  value={form.llm_provider}
                  onChange={(e) =>
                    handleChange('llm_provider', e.target.value as LlmProvider)
                  }
                  className="w-full bg-black border border-neutral-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="openai">OpenAI</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Text-to-Speech (TTS) Provider
                </label>
                <select
                  value={form.tts_provider}
                  onChange={(e) =>
                    handleChange('tts_provider', e.target.value as TtsProvider)
                  }
                  className="w-full bg-black border border-neutral-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="elevenlabs">ElevenLabs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Speech-to-Text (STT) Provider
                </label>
                <select
                  value={form.stt_provider}
                  onChange={(e) =>
                    handleChange('stt_provider', e.target.value as SttProvider)
                  }
                  className="w-full bg-black border border-neutral-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="openai">OpenAI</option>
                  <option value="deepgram">Deepgram</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Active resolved configuration */}
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <h2 className="text-xl font-bold text-white mb-1">
              Active Configuration
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Effective values after applying campaign &rsaquo; tenant &rsaquo;
              environment hierarchy.
            </p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">LLM Provider:</span>
                <span className="text-white capitalize">
                  {effective.llm_provider}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">TTS Provider:</span>
                <span className="text-white capitalize">
                  {effective.tts_provider}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">STT Provider:</span>
                <span className="text-white capitalize">
                  {effective.stt_provider}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tenant:</span>
                <span className="text-white font-mono text-xs">
                  {form.tenantId}
                </span>
              </div>
              {form.campaignId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Campaign:</span>
                  <span className="text-white font-mono text-xs">
                    {form.campaignId}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
