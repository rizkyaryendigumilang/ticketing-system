import React, { useState } from 'react';
import { HelpCircle, BookOpen, PhoneCall, MessageSquarePlus } from 'lucide-react';
import { FaqAccordion } from '../../components/support/FaqAccordion';
import { KnowledgeBaseList } from '../../components/support/KnowledgeBaseList';
import { ContactEscalationCard } from '../../components/support/ContactEscalationCard';
import { SystemFeedbackForm } from '../../components/support/SystemFeedbackForm';

export function AdminSupportPage() {
  const [activeTab, setActiveTab] = useState<'faq' | 'kb' | 'contact' | 'feedback'>('faq');

  return (
    <div className="space-y-6 p-5 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Bantuan, Panduan & Dukungan Teknis
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            Tanya jawab (FAQ), basis pengetahuan solusi per aplikasi, eskalasi darurat DevOps, dan umpan balik sistem.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'faq'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Tanya Jawab (FAQ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kb')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'kb'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Basis Pengetahuan (KB)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'contact'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <PhoneCall className="h-3.5 w-3.5" />
          <span>Eskalasi DevOps</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'feedback'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          <span>Umpan Balik</span>
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'faq' && <FaqAccordion />}
        {activeTab === 'kb' && <KnowledgeBaseList />}
        {activeTab === 'contact' && <ContactEscalationCard />}
        {activeTab === 'feedback' && <SystemFeedbackForm />}
      </div>
    </div>
  );
}
