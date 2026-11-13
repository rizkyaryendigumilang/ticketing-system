import { VPS_APPS } from '../config/vpsAppsConfig';
import type { AppQuota, AppSlaTier, InfrastructureInvoice } from '../types/billing';
import type { Ticket } from '../types/crm';

const TIERS_CONFIG: Record<
  AppSlaTier,
  { label: string; limitTickets: number; limitKb: number; baseCostRp: number; slaHours: number }
> = {
  internal: {
    label: 'Internal Standar',
    limitTickets: 500,
    limitKb: 10 * 1024,
    baseCostRp: 50000,
    slaHours: 24,
  },
  pro_sla: {
    label: 'Pro SLA (Urgensi Tinggi)',
    limitTickets: 2500,
    limitKb: 50 * 1024,
    baseCostRp: 150000,
    slaHours: 4,
  },
  enterprise: {
    label: 'Enterprise Dedicated Support',
    limitTickets: 10000,
    limitKb: 250 * 1024,
    baseCostRp: 350000,
    slaHours: 1,
  },
};

export function getTierConfig(tier: AppSlaTier) {
  return TIERS_CONFIG[tier] || TIERS_CONFIG.internal;
}

export function computeAppQuotas(tickets: Ticket[]): AppQuota[] {
  return VPS_APPS.map((app, idx) => {
    const appTickets = tickets.filter((t) => t.appId === app.id);
    const tier: AppSlaTier = idx === 0 || idx === 1 ? 'pro_sla' : 'internal';
    const cfg = getTierConfig(tier);

    // Approximate size in KB based on ticket subject/desc
    const bytes = appTickets.reduce(
      (acc, t) => acc + (t.subject.length + (t.description?.length || 0)) * 2,
      1024 * (idx + 1) * 12,
    );
    const storageUsedKb = Math.round(bytes / 1024);

    return {
      appId: app.id,
      appName: app.name,
      tier,
      storageUsedKb,
      storageLimitKb: cfg.limitKb,
      monthlyTicketsCount: appTickets.length,
      monthlyTicketsLimit: cfg.limitTickets,
      costShareRp: cfg.baseCostRp,
    };
  });
}

export function generateAppInvoices(quotas: AppQuota[]): InfrastructureInvoice[] {
  const currentPeriod = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  return quotas.map((q, idx) => {
    const cfg = getTierConfig(q.tier);
    const serverShare = Math.round(cfg.baseCostRp * 0.6);
    const backupStorageShare = Math.round(cfg.baseCostRp * 0.25);
    const supportOpsShare = cfg.baseCostRp - serverShare - backupStorageShare;

    return {
      invoiceNumber: `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${(idx + 1).toString().padStart(3, '0')}`,
      period: currentPeriod,
      appId: q.appId,
      appName: q.appName,
      items: [
        { description: `Alokasi Server VPS & RAM (:8094) - Paket ${cfg.label}`, amountRp: serverShare },
        { description: 'Cadangan SQLite Harian & Retensi 14 Hari', amountRp: backupStorageShare },
        { description: `Operasional SLA Helpdesk (${cfg.slaHours} Jam Respons)`, amountRp: supportOpsShare },
      ],
      totalRp: cfg.baseCostRp,
      status: 'allocated',
    };
  });
}
