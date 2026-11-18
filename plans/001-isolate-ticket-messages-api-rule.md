# Plan 001: Isolate Ticket Messages API Rule in PocketBase Schema

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat e0e49f8..HEAD -- src/config/pbSchema.ts src/services/pbClient.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `e0e49f8`, 2026-11-18

## Why this matters

In `src/config/pbSchema.ts`, the `ticket_messages` collection currently has `listRule: 'is_internal_note = false'`.
Because there is no tenant or ticket-ownership check, any external user querying PocketBase directly can enumerate messages from every ticket across all VPS applications.
Updating the PocketBase schema rule enforces strict multi-tenant boundary checks: only superusers or requesters matching the ticket's owner credentials can read or subscribe to messages.

## Current state

The affected files:
- `src/config/pbSchema.ts` (lines 180-184) defines the collection schema:
```ts
  {
    name: 'ticket_messages',
    type: 'base',
    listRule: 'is_internal_note = false', viewRule: 'is_internal_note = false',
    createRule: '@request.body.is_internal_note != true && @request.body.sender_role != "admin"',
    updateRule: null, deleteRule: null,
```
- `src/services/pbClient.ts` (lines 253-263) subscribes guest users to `ticket_messages`:
```ts
      await pb.collection('ticket_messages').subscribe('*', (e) => {
        if (e.action === 'delete') removeLocal('ticket_messages', e.record.id);
        else {
          const msg = fromPb<TicketMessage>('ticket_messages', e.record);
          if (!msg.isInternalNote) {
            upsertLocal('ticket_messages', msg, true);
          }
        }
      });
```

## Commands you will need

| Purpose | Command | Expected on success |
| :--- | :--- | :--- |
| Test | `npm test` | exit 0, all 48 tests pass |
| Build | `npm run build -- --base=/helpdesk/` | exit 0, bundle generated |

## Scope

**In scope**:
- `src/config/pbSchema.ts`
- `src/services/pbClient.ts`

**Out of scope**:
- UI message components (`src/components/common/MessageThread.tsx`)
- Audit log collections

## Implementation Steps

1. In `src/config/pbSchema.ts`:
   Update `listRule` and `viewRule` for `ticket_messages` to ensure tenant isolation:
   ```ts
   listRule: '@request.auth.id != "" || (is_internal_note = false && @request.query.requester_uid:isset = true && ticket_id.requester_uid = @request.query.requester_uid && ticket_id.app_id = @request.query.app_id)',
   viewRule: '@request.auth.id != "" || (is_internal_note = false && @request.query.requester_uid:isset = true && ticket_id.requester_uid = @request.query.requester_uid && ticket_id.app_id = @request.query.app_id)',
   ```

2. In `src/services/pbClient.ts`:
   In `subscribeRealtime()`, when subscribing as non-superuser, verify that the incoming message's `ticketId` matches a ticket currently belonging to the logged-in requester before calling `upsertLocal('ticket_messages', msg, true)`.

3. Run verification commands:
   `npm test`
   `npm run build -- --base=/helpdesk/`

## STOP Conditions

- If PocketBase schema validator throws an error on `ticket_id.requester_uid` relation syntax, check PocketBase relation field naming and revert to direct filter query parameter.
