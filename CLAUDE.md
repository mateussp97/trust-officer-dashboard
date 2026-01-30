# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server (Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

No test framework is configured.

## Environment

Requires `OPENAI_API_KEY` in `.env.local`. See `.env.example`.

## Architecture

Trust Officer Dashboard for reviewing and processing beneficiary distribution requests against trust policy rules. Two pages: Ledger (financial health) and Queue (request processing).

### Data Flow

```
Client (Zustand store) → API routes → lib/data.ts (in-memory cache + JSON files)
```

- **Persistence**: JSON files in `data/` with in-memory caching in `lib/data.ts`. No database. Cache resets on server restart.
- **State management**: Single Zustand store at `stores/dashboard-store.ts`. Components import `useDashboardStore` directly (no provider needed).
- **AI parsing**: `lib/openai.ts` calls GPT-4o-mini with JSON mode to extract structured fields (amount, category, urgency, flags) from raw request text. Policy rules are encoded in the system prompt and also enforced server-side via `lib/policy.ts`.

### Route Structure

- `app/(dashboard)/` — Route group wrapping both pages in a shared sidebar layout
- `app/(dashboard)/ledger/page.tsx` — Summary cards, balance chart, transaction table
- `app/(dashboard)/queue/page.tsx` — Request list with filter tabs, auto-parse on load, detail dialog for approve/deny
- `app/api/ledger/route.ts` — GET (summary), POST (add entry)
- `app/api/requests/route.ts` — GET (all requests)
- `app/api/requests/[id]/route.ts` — PATCH (approve/deny/update)
- `app/api/parse/route.ts` — POST (OpenAI parse + policy check)

### Key Modules

- `lib/data.ts` — Server-side data access. All reads/writes go through here. In-memory cache with JSON file backing.
- `lib/policy.ts` — Trust policy rules as constants. `checkPolicy()` returns flags (prohibited, over_limit, requires_review, unknown_beneficiary, exceeds_monthly_cap).
- `lib/openai.ts` — `parseRequestWithAI()` using gpt-4o-mini, temperature 0.1, JSON response format.
- `lib/types.ts` — All TypeScript interfaces: `LedgerEntry`, `TrustRequest`, `ParsedRequest`, `PolicyFlag`, etc.
- `lib/format.ts` — Currency and date formatting utilities.

### Component Organization

- `components/ui/` — shadcn primitives (do not edit manually; use `pnpm dlx shadcn@latest add`)
- `components/ledger/` — Ledger page components (summary cards, table, chart)
- `components/queue/` — Queue page components (request list, detail dialog, policy display)
- `components/app-sidebar.tsx` — Navigation sidebar with pending request count badge
- `components/site-header.tsx` — Reusable page header

## Tech Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (radix-vega style), Zustand 5, Recharts, OpenAI SDK, Sonner (toasts), Lucide icons.

## Domain Context

- **Known beneficiaries**: Sam Miller, Katie Miller
- **Trust officer**: Margaret Chen (hardcoded identity)
- **Policy rules**: Education and Medical fully covered. General Support capped at $5k/month. Purchases over $20k require review. Speculative investments, luxury vehicles/goods are prohibited.
- Approving a request creates a DEBIT ledger entry. Denying does not affect the ledger.
- Prohibited requests have the Approve button disabled.
