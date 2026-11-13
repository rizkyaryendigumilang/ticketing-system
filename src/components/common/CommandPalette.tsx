import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppWindow,
  ExternalLink,
  Globe,
  Inbox,
  LayoutDashboard,
  Search,
  Settings,
  Ticket as TicketIcon,
  Users,
  X,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { VPS_APPS } from '../../config/vpsAppsConfig';
import { AppBadge } from './AppBadge';
import { StatusBadge } from './StatusBadge';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  badge?: React.ReactNode;
}

export function CommandPalette({ open, onClose }: Props) {
  const { data, t, lang, updateSettings, settings } = useCrm();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
        else {
          // Open handled by parent or toggle
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];

    // 1. Navigation items
    list.push(
      {
        id: 'nav-dash',
        category: 'Navigasi',
        title: t('nav.dashboard') || 'Dashboard',
        subtitle: 'Buka ringkasan tren dan analitik',
        icon: LayoutDashboard,
        action: () => {
          navigate('/admin');
          onClose();
        },
      },
      {
        id: 'nav-inbox',
        category: 'Navigasi',
        title: t('nav.tickets') || 'Kotak Masuk Tiket',
        subtitle: 'Daftar semua kendala dan tiket aktif',
        icon: Inbox,
        action: () => {
          navigate('/admin/tickets');
          onClose();
        },
      },
      {
        id: 'nav-contacts',
        category: 'Navigasi',
        title: t('nav.contacts') || 'Kontak Pelapor',
        subtitle: 'Daftar pengguna dan identitas pelapor',
        icon: Users,
        action: () => {
          navigate('/admin/contacts');
          onClose();
        },
      },
      {
        id: 'nav-settings',
        category: 'Navigasi',
        title: t('nav.settings') || 'Pengaturan',
        subtitle: 'Kelola preferensi, keamanan, integrasi, dan data',
        icon: Settings,
        action: () => {
          navigate('/admin/settings');
          onClose();
        },
      },
      {
        id: 'nav-portal',
        category: 'Navigasi',
        title: 'Buka Portal Pelapor (User Portal)',
        subtitle: 'Buka pusat bantuan sisi pelapor',
        icon: ExternalLink,
        action: () => {
          window.open(`${(import.meta.env.BASE_URL || '/').replace(/\/+$/, '')}/portal`, '_blank');
          onClose();
        },
      },
    );

    // 2. Language Switcher
    list.push(
      {
        id: 'lang-id',
        category: 'Bahasa',
        title: 'Gunakan Bahasa Indonesia',
        subtitle: lang === 'id' ? 'Aktif saat ini' : 'Ganti bahasa antarmuka ke Indonesia',
        icon: Globe,
        action: () => {
          updateSettings({ ...settings, language: 'id' });
          onClose();
        },
      },
      {
        id: 'lang-en',
        category: 'Language',
        title: 'Switch to English',
        subtitle: lang === 'en' ? 'Currently active' : 'Change interface language to English',
        icon: Globe,
        action: () => {
          updateSettings({ ...settings, language: 'en' });
          onClose();
        },
      },
    );

    // 3. VPS Apps Direct Filter
    for (const app of VPS_APPS) {
      list.push({
        id: `app-${app.id}`,
        category: 'Filter Aplikasi',
        title: `Tiket Aplikasi: ${app.name}`,
        subtitle: `Lihat tiket dengan prefix [${app.prefix}]`,
        icon: AppWindow,
        action: () => {
          navigate(`/admin/tickets?app=${app.id}`);
          onClose();
        },
      });
    }

    // 4. Tickets Search
    for (const t of data.tickets.slice(0, 50)) {
      list.push({
        id: `ticket-${t.id}`,
        category: 'Tiket',
        title: `${t.ticketNumber} — ${t.subject}`,
        subtitle: `${t.requesterName} (${t.appId})`,
        icon: TicketIcon,
        badge: <StatusBadge status={t.status} />,
        action: () => {
          navigate(`/admin/tickets/${t.id}`);
          onClose();
        },
      });
    }

    return list;
  }, [data.tickets, lang, navigate, onClose, settings, t, updateSettings]);

  // Filter based on query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default initial view: show Navigasi + Language + first 5 tickets
      return items.filter((item) => item.category === 'Navigasi' || item.category === 'Bahasa' || item.category === 'Language');
    }
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [items, query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 sm:pt-24 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-panel shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="h-4 w-4 text-ink-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ketik tujuan, nomor tiket (misal: SNK-001), atau perintah..."
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded p-1 text-ink-muted hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-line/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              Tidak ada hasil yang cocok dengan &quot;{query}&quot;.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                    isSelected ? 'bg-subtle text-ink font-medium' : 'text-ink-muted hover:bg-subtle/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`rounded-md p-1.5 border border-line ${isSelected ? 'bg-panel text-ink' : 'bg-subtle text-ink-muted'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-ink font-medium">{item.title}</div>
                      {item.subtitle && (
                        <div className="truncate text-[11px] text-ink-muted">{item.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge}
                    <span className="rounded bg-subtle px-1.5 py-0.5 text-[10px] text-ink-faint font-mono">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="flex items-center justify-between border-t border-line bg-subtle/50 px-4 py-2 text-[11px] text-ink-muted">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono">↑↓</kbd> Navigasi
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> Pilih
            </span>
            <span>
              <kbd className="font-mono">esc</kbd> Tutup
            </span>
          </div>
          <span>Helpdesk App Command</span>
        </div>
      </div>
    </div>
  );
}
