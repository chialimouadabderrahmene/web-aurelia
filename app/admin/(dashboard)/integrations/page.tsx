"use client";

import { useEffect, useState } from "react";
import { Check, Copy, RefreshCw, PlugZap } from "lucide-react";

type Settings = {
  ecotrackBaseUrl: string | null;
  ecotrackApiToken: string | null;
  ecotrackEnabled: boolean;
  ecotrackWebhookSecret: string | null;
};

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  function load() {
    fetch("/api/admin/integrations")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings));
  }

  useEffect(() => {
    load();
    setOrigin(window.location.origin);
  }, []);

  async function save(patch: Partial<Settings> & { regenerateSecret?: boolean }) {
    setSaving(true);
    const res = await fetch("/api/admin/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  if (!settings) return <p className="font-body text-sm text-ink/50">Loading…</p>;

  const webhookUrl = settings.ecotrackWebhookSecret
    ? `${origin || "https://your-domain.com"}/api/webhooks/ecotrack?secret=${settings.ecotrackWebhookSecret}`
    : null;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Integrations</h1>
      <p className="mt-1 font-body text-sm text-ink/50">
        Connect EcoTrack so confirmed orders auto-create parcels and delivery status syncs back automatically.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save({
            ecotrackBaseUrl: settings.ecotrackBaseUrl,
            ecotrackApiToken: settings.ecotrackApiToken,
          });
        }}
        className="mt-8 space-y-5 rounded-xl3 bg-white p-6 shadow-soft"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">EcoTrack Delivery</h2>
          <button
            type="button"
            onClick={() => save({ ecotrackEnabled: !settings.ecotrackEnabled })}
            className={`rounded-full px-4 py-1.5 font-body text-xs uppercase ${
              settings.ecotrackEnabled ? "bg-emerald-100 text-emerald-700" : "bg-sand text-ink/50"
            }`}
          >
            {settings.ecotrackEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <div>
          <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">
            Platform Base URL
          </label>
          <input
            value={settings.ecotrackBaseUrl ?? ""}
            onChange={(e) => setSettings({ ...settings, ecotrackBaseUrl: e.target.value })}
            placeholder="https://world-express.ecotrack.dz"
            className="input"
          />
          <p className="mt-1 font-body text-xs text-ink/40">
            Your EcoTrack platform domain — no trailing path, just the base (e.g. https://world-express.ecotrack.dz).
          </p>
        </div>

        <div>
          <label className="mb-1.5 block font-body text-xs uppercase tracking-wide text-ink/60">
            API Token
          </label>
          <input
            value={settings.ecotrackApiToken ?? ""}
            onChange={(e) => setSettings({ ...settings, ecotrackApiToken: e.target.value })}
            placeholder="Your EcoTrack API token"
            className="input"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            disabled={testing}
            onClick={async () => {
              setTesting(true);
              setTestResult(null);
              const res = await fetch("/api/admin/integrations/test", { method: "POST" });
              const data = await res.json();
              setTestResult(data);
              setTesting(false);
            }}
            className="btn-secondary !px-5 !py-3 text-xs disabled:opacity-50"
          >
            <PlugZap size={14} className="mr-1.5" />
            {testing ? "Testing…" : "Test Connection"}
          </button>
          {testResult && (
            <span className={`font-body text-xs ${testResult.ok ? "text-emerald-600" : "text-red-600"}`}>
              {testResult.message}
            </span>
          )}
        </div>
      </form>

      <div className="mt-8 rounded-xl3 bg-white p-6 shadow-soft">
        <h2 className="font-display text-lg text-ink">Webhook</h2>
        <p className="mt-1 font-body text-sm text-ink/50">
          Paste this URL into EcoTrack's webhook / callback settings so delivery status updates flow back
          automatically. Only works once this site is live on a public domain — replace the domain below if
          it still shows localhost.
        </p>

        {webhookUrl ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl2 bg-sand p-4">
            <code className="flex-1 overflow-x-auto font-body text-xs text-ink">{webhookUrl}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="shrink-0 text-ink/50 hover:text-ink"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
          </div>
        ) : (
          <p className="mt-4 font-body text-sm text-ink/40">
            No webhook secret yet — generate one below.
          </p>
        )}

        <button
          type="button"
          onClick={() => save({ regenerateSecret: true })}
          disabled={saving}
          className="btn-secondary mt-4 !px-5 !py-3 text-xs disabled:opacity-50"
        >
          <RefreshCw size={14} className="mr-1.5" />
          {settings.ecotrackWebhookSecret ? "Regenerate secret" : "Generate webhook URL"}
        </button>
      </div>
    </div>
  );
}
