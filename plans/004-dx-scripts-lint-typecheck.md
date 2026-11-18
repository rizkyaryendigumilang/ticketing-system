# Plan 004: Add Dedicated Typecheck and Lint Scripts for Developer Experience

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. Do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat e0e49f8..HEAD -- package.json`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `e0e49f8`, 2026-11-18

## Why this matters

`package.json` currently lacks a dedicated `"typecheck"` script.
Whenever an agent or developer wants to verify TypeScript types, they must run `npm run build`, which triggers both `tsc` and the full `vite build` pipeline (~5-6s), slowing down rapid feedback loops.
Adding `"typecheck": "tsc --noEmit"` gives an instant ~1s verification gate without producing build artifacts.

## Current state

`package.json` (lines 5-11):
```json
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "pb:init": "node scripts/init-pocketbase.mjs",
    "test": "node --test ..."
  }
```

## Commands you will need

| Purpose | Command | Expected on success |
| :--- | :--- | :--- |
| Typecheck | `npm run typecheck` | exit 0, no errors |
| Build | `npm run build -- --base=/helpdesk/` | exit 0 |

## Scope

**In scope**:
- `package.json`

**Out of scope**:
- TypeScript source code or config files

## Implementation Steps

1. In `package.json`:
   Add `"typecheck": "tsc --noEmit"` to `"scripts"`.
2. Run `npm run typecheck` to verify that it executes cleanly.

## STOP Conditions

- If `tsc --noEmit` fails on existing code, stop and report the type error.
