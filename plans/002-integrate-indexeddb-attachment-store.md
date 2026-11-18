# Plan 002: Integrate IndexedDB Attachment Store to Prevent LocalStorage Quota Crashes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat e0e49f8..HEAD -- src/services/attachmentStore.ts src/services/storageService.ts`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `e0e49f8`, 2026-11-18

## Why this matters

Screenshots attached to tickets and messages are currently serialized as raw base64 data URLs inside `vps-crm:data:v4` in `localStorage`.
Because browser `localStorage` is capped at approximately 5MB per origin, attaching 2-3 high-resolution screenshots causes `localStorage.setItem` to throw a `QuotaExceededError`.
When this occurs, `storageService.ts` logs a warning and falls back to in-memory state, causing newly created tickets or outbox changes to be lost if the user refreshes their browser while offline.
Integrating the already implemented `src/services/attachmentStore.ts` IndexedDB adapter keeps large blobs in IndexedDB and stores lightweight IDs/references in `localStorage`.

## Current state

- `src/services/attachmentStore.ts` provides `saveAttachment(id, dataUrl)`, `loadAttachment(id)`, and `deleteAttachment(id)`. However, it is never called by the application.
- `src/services/storageService.ts` (lines 103-112) swallows the quota exception:
```ts
function write(key: string, value: unknown) {
  try {
    if (hasLocalStorage()) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    // shortcut: screenshots are base64 in localStorage (~5 MB quota); past it, changes live in memory until reload.
    console.warn('Penyimpanan browser penuh, perubahan hanya ada di memori sampai PocketBase aktif.', e);
  }
}
```

## Commands you will need

| Purpose | Command | Expected on success |
| :--- | :--- | :--- |
| Test | `npm test` | exit 0, all 48 tests pass |
| Build | `npm run build -- --base=/helpdesk/` | exit 0, clean build |

## Scope

**In scope**:
- `src/services/attachmentStore.ts`
- `src/services/storageService.ts`
- `src/components/common/ScreenshotUploader.tsx`

**Out of scope**:
- PocketBase server backend or init scripts

## Implementation Steps

1. In `src/services/storageService.ts`:
   Before persisting `data` to `localStorage` in `write()`, extract base64 attachment payloads from tickets and messages, save them into IndexedDB via `saveAttachment(id, blob)`, and store only a reference token (`attachment:id`) in localStorage.
2. In `loadAttachment()`:
   Ensure UI components reading `ticket.attachments` resolve the data URL asynchronously from `attachmentStore.ts` if it starts with `attachment:`.
3. Provide a fallback: if IndexedDB is unavailable (e.g. private mode in older browsers), continue using the in-memory fallback map in `attachmentStore.ts`.
4. Run verification commands:
   `npm test`
   `npm run build -- --base=/helpdesk/`

## STOP Conditions

- If IndexedDB transactions fail in test environments (e.g. Node.js environment where `indexedDB` is undefined), ensure the memory fallback in `attachmentStore.ts` handles it gracefully without throwing.
