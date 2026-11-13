import React, { useState } from 'react';
import { TerminalSquare } from 'lucide-react';
import { useCrm } from '../../../context/CrmContext';
import { useToast } from '../../../context/ToastContext';
import { IntegrationTabContent } from '../../../pages/admin/AdminIntegrationPage';

export function IntegrationsTab() {
  const { settings, updateSettings, t } = useCrm();
  const toast = useToast();

  const [outboundWebhookEnabled, setOutboundWebhookEnabled] = useState(
    settings.outboundWebhookEnabled,
  );
  const [outboundWebhookUrl, setOutboundWebhookUrl] = useState(
    settings.outboundWebhookUrl,
  );

  const handleSaveWebhook = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSettings({
      ...settings,
      outboundWebhookEnabled,
      outboundWebhookUrl: outboundWebhookUrl.trim(),
    });
    toast.success(t('settings.saved'));
  };

  return (
    <div className="space-y-6">
      {/* Embedded Interactive Code Generator */}
      <IntegrationTabContent embedded />

      {/* Outbound Webhook Section */}
      <div className="rounded-lg border border-line bg-panel p-5 shadow-xs text-xs">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <TerminalSquare className="h-4 w-4 text-ink" />
          <h2 className="text-sm font-semibold text-ink">Outbound Webhook</h2>
        </div>
        <p className="mt-2 text-ink-muted">
          Kirimkan payload HTTP POST JSON saat tiket dibuat atau diselesaikan ke endpoint eksternal.
        </p>

        <form onSubmit={handleSaveWebhook} className="mt-4 space-y-3 max-w-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={outboundWebhookEnabled}
              onChange={(e) => setOutboundWebhookEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-line text-ink"
            />
            <span className="font-semibold text-ink">Aktifkan Outbound Webhook</span>
          </label>

          <div>
            <label className="block font-medium text-ink">Target Webhook URL</label>
            <input
              type="url"
              value={outboundWebhookUrl}
              onChange={(e) => setOutboundWebhookUrl(e.target.value)}
              placeholder="https://api.domain.com/webhooks/helpdesk"
              className="mt-1 w-full rounded border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-ink px-4 py-2 font-semibold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            {t('settings.saveChanges')}
          </button>
        </form>
      </div>
    </div>
  );
}
