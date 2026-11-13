export type AppSlaTier = 'internal' | 'pro_sla' | 'enterprise';

export interface AppQuota {
  appId: string;
  appName: string;
  tier: AppSlaTier;
  storageUsedKb: number;
  storageLimitKb: number;
  monthlyTicketsCount: number;
  monthlyTicketsLimit: number;
  costShareRp: number;
}

export interface InfrastructureInvoice {
  invoiceNumber: string;
  period: string;
  appId: string;
  appName: string;
  items: { description: string; amountRp: number }[];
  totalRp: number;
  status: 'allocated' | 'internal_charge';
}
