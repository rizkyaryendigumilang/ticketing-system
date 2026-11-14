/**
 * Real-time agent presence and collision detection service.
 * Tracks which operators are currently viewing or drafting replies on the same ticket.
 * Uses BroadcastChannel and storage events for cross-tab synchronization.
 */

export interface AgentPresence {
  ticketId: string;
  actorId: string;
  actorName: string;
  isTyping: boolean;
  lastPing: number;
}

const PRESENCE_STORAGE_KEY = 'helpdesk_agent_presence_v1';
const HEARTBEAT_TTL_MS = 15_000; // Agent considered inactive after 15s without ping
const listeners = new Set<() => void>();

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel('crm_ticket_presence');
    channel.onmessage = () => {
      notify();
    };
  } catch {
    channel = null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === PRESENCE_STORAGE_KEY) {
      notify();
    }
  });
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in presence listener', e);
    }
  });
}

function getStoredPresence(): AgentPresence[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRESENCE_STORAGE_KEY);
    if (!raw) return [];
    const list: AgentPresence[] = JSON.parse(raw);
    const now = Date.now();
    return list.filter((p) => now - p.lastPing < HEARTBEAT_TTL_MS);
  } catch {
    return [];
  }
}

function saveStoredPresence(list: AgentPresence[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PRESENCE_STORAGE_KEY, JSON.stringify(list));
    channel?.postMessage({ type: 'presence_updated' });
    notify();
  } catch {
    // Ignore quota errors
  }
}

export function pingPresence(
  ticketId: string,
  actor: { id: string; name: string },
  isTyping = false,
) {
  const current = getStoredPresence().filter(
    (p) => !(p.ticketId === ticketId && p.actorId === actor.id),
  );
  current.push({
    ticketId,
    actorId: actor.id,
    actorName: actor.name,
    isTyping,
    lastPing: Date.now(),
  });
  saveStoredPresence(current);
}

export function leavePresence(ticketId: string, actorId: string) {
  const current = getStoredPresence().filter(
    (p) => !(p.ticketId === ticketId && p.actorId === actorId),
  );
  saveStoredPresence(current);
}

export function getTicketViewers(
  ticketId: string,
  currentActorId: string,
): AgentPresence[] {
  const all = getStoredPresence();
  return all.filter((p) => p.ticketId === ticketId && p.actorId !== currentActorId);
}

export function subscribePresence(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
