import PocketBase from 'pocketbase';

export const pb = new PocketBase(
  (import.meta.env as Record<string, string>).VITE_PB_URL ?? 'http://127.0.0.1:8090'
);

// Disable auto-cancel so subscriptions work reliably
pb.autoCancellation(false);

let _online = false;
let _lastCheck = 0;

export async function checkPbOnline(): Promise<boolean> {
  const now = Date.now();
  if (now - _lastCheck < 10_000) return _online;
  _lastCheck = now;
  try {
    const res = await fetch(`${pb.baseUrl}/api/health`, { signal: AbortSignal.timeout(2000) });
    _online = res.ok;
  } catch {
    _online = false;
  }
  return _online;
}

export function isPbOnline(): boolean {
  return _online;
}

// Kick off initial check
checkPbOnline().catch(() => {});
