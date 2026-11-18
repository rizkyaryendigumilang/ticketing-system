# Plan 003: Establish Automated Unit Tests for Local Store and Sync Engine

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat e0e49f8..HEAD -- package.json src/services/storageService.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-isolate-ticket-messages-api-rule.md, plans/002-integrate-indexeddb-attachment-store.md
- **Category**: tests
- **Planned at**: commit `e0e49f8`, 2026-11-18

## Why this matters

The core offline-first storage and sync operations (`storageService.ts` and `pbClient.ts`) currently have zero unit test files.
While 48 tests cover CRM logic, deflection, audit logs, and escalation, regressions in outbox queuing, conflict resolution, or optimistic rollbacks could silently break data synchronization for end users without tripping existing tests.

## Current state

- Existing test suite is run with Node's native test runner (`node --test`).
- `package.json` test script specifies individual test files explicitly:
```json
"test": "node --test src/services/crmLogic.test.ts src/services/ticketCrmService.test.ts src/i18n/translations.test.ts src/services/notificationService.test.ts src/services/backupSyncService.test.ts src/services/sanitizer.test.ts src/services/auditLogService.test.ts src/services/deflectionService.test.ts src/services/slaEscalationService.test.ts src/services/apiKeyService.test.ts"
```
- There is no `src/services/storageService.test.ts`.

## Commands you will need

| Purpose | Command | Expected on success |
| :--- | :--- | :--- |
| Test single file | `node --test src/services/storageService.test.ts` | exit 0 |
| Test suite | `npm test` | exit 0, all tests pass |

## Scope

**In scope**:
- `src/services/storageService.test.ts` (create)
- `package.json` (add new test file to test script)

**Out of scope**:
- Source code in `storageService.ts` (unless a latent bug is exposed by the test)

## Implementation Steps

1. Create `src/services/storageService.test.ts` covering:
   - `upsertLocal()` inserts new items and updates existing items.
   - `upsertLocal()` with `isServerRealtime=true` preserves pending outbox mutations.
   - `removeLocal()` removes items by id.
   - `enqueue()` and `setOutbox()` update outbox state and trigger listeners.
   - `pruneOldClosedTickets()` correctly filters closed tickets older than cutoff while preserving tickets with pending outbox mutations.
2. Update `package.json` to include `src/services/storageService.test.ts` in the `test` script.
3. Run `npm test` and verify that all test cases pass.

## STOP Conditions

- If mocking localStorage in Node fails, use Node's built-in global or mock storage wrapper.
