import React, { useState } from 'react';
import { HelpCircle, BookOpen, PhoneCall, MessageSquarePlus } from 'lucide-react';
import { FaqAccordion } from '../../support/FaqAccordion';
import { KnowledgeBaseList } from '../../support/KnowledgeBaseList';
import { ContactEscalationCard } from '../../support/ContactEscalationCard';
import { SystemFeedbackForm } from '../../support/SystemFeedbackForm';

export function SupportTab() {
  const [activeSubTab, setActiveSubTab] = useState<'faq' | 'kb' | 'contact' | 'feedback'>('faq');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-ink">Bantuan & FAQ</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Tanya jawab umum, basis pengetahuan panduan solusi per aplikasi, eskalasi darurat DevOps, dan umpan balik.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-line gap-2 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveSubTab('faq')}
          className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-colors ${
            activeSubTab === 'faq'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Tanya Jawab (FAQ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('kb')}
          className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-colors ${
            activeSubTab === 'kb'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Basis Pengetahuan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('contact')}
          className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-colors ${
            activeSubTab === 'contact'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <PhoneCall className="h-3.5 w-3.5" />
          <span>Eskalasi DevOps</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('feedback')}
          className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-colors ${
            activeSubTab === 'feedback'
              ? 'border-ink text-ink font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          <span>Umpan Balik</span>
        </button>
      </div>

      {/* Sub Content */}
      <div className="space-y-4">
        {activeSubTab === 'faq' && <FaqAccordion />}
        {activeSubTab === 'kb' && <KnowledgeBaseList />}
        {activeSubTab === 'contact' && <ContactEscalationCard />}
        {activeSubTab === 'feedback' && <SystemFeedbackForm />}
      </div>
    </div>
  );
}
