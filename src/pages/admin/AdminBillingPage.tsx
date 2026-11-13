import React, { useMemo } from 'react';
import { CreditCard, HardDrive, Receipt } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { computeAppQuotas, generateAppInvoices } from '../../services/billingService';
import { AppQuotaAllocationCard } from '../../components/billing/AppQuotaAllocationCard';
import { ServicePlanTierSelector } from '../../components/billing/ServicePlanTierSelector';
import { CostAttributionInvoice } from '../../components/billing/CostAttributionInvoice';

export function AdminBillingPage() {
  const { data } = useCrm();

  const quotas = useMemo(() => computeAppQuotas(data.tickets), [data.tickets]);
  const invoices = useMemo(() => generateAppInvoices(quotas), [quotas]);

  return (
    <div className="space-y-6 p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Alokasi Kuota & Tagihan VPS (Billing)
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            Pengelolaan batas penyimpanan data, kuota tiket bulanan, paket SLA, dan atribusi biaya operasional infrastruktur VPS.
          </p>
        </div>
      </div>

      {/* 1. App Quotas */}
      <AppQuotaAllocationCard quotas={quotas} />

      {/* 2. Service Plan Tiers */}
      <ServicePlanTierSelector />

      {/* 3. Invoices */}
      <CostAttributionInvoice invoices={invoices} />
    </div>
  );
}
