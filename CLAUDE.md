# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server (Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint (flat config, ESLint 9+)
```

No test framework is configured. Add new shadcn components with `pnpm dlx shadcn@latest add <component>`.

## Environment

Requires `OPENAI_API_KEY` in `.env.local`. See `.env.example`.

## Architecture

Trust Officer Dashboard for reviewing and processing beneficiary distribution requests against trust policy rules. Two pages: Ledger (financial health) and Queue (request processing).

### Data Flow

```
Client (Zustand stores) → API routes → lib/data.ts (in-memory cache + JSON files)
```

- **Persistence**: JSON files in `data/` with in-memory caching in `lib/data.ts`. No database. Cache resets on server restart. All server-side reads/writes go through `lib/data.ts`.
- **AI parsing**: `lib/openai.ts` calls GPT-4o-mini with JSON mode to extract structured fields (amount, category, urgency, flags) from raw request text. Policy rules are encoded in the system prompt and also enforced server-side via `lib/policy.ts`.

### State Management

Three Zustand stores, no providers needed — components import hooks directly:

- **`stores/dashboard-store.ts`** — Main store. Holds `ledger[]`, `requests[]`, balance totals, and per-request loading states (`isParsingRequest{}`, `isProcessingRequest{}` keyed by ID). Uses optimistic updates with rollback on failure. Exports selector functions (`selectPendingCount`, `selectPendingExposure`) for derived values.
- **`stores/dialog-store.ts`** — Minimal store for modal dialogs. Accepts arbitrary `ReactNode` content via `openDialog({content})`.
- **`stores/drawer-store.ts`** — Same pattern as dialog store but for the right-side drawer. `openDrawer({content})`.

### Global Containers

`DialogContainer` and `DrawerContainer` are mounted once in `app/(dashboard)/layout.tsx` and render content from their respective stores. To show a modal or drawer from anywhere, call `useDialogStore.getState().openDialog({content: <MyComponent />})` or the drawer equivalent. No need to add portals in individual components.

### Initialization

The dashboard layout (`app/(dashboard)/layout.tsx`) is a client component that:
1. Calls `fetchAll()` on mount to load ledger + requests from API
2. Auto-parses all pending unparsed requests once (guarded by `useRef`)

### Route Structure

- `app/(dashboard)/` — Route group wrapping both pages in a shared sidebar layout
- `app/(dashboard)/ledger/page.tsx` — Summary cards, balance chart, transaction table
- `app/(dashboard)/queue/page.tsx` — Request list with filter tabs, detail drawer for approve/deny
- `app/api/ledger/route.ts` — GET (summary), POST (add entry)
- `app/api/requests/route.ts` — GET (all requests)
- `app/api/requests/[id]/route.ts` — PATCH (approve/deny/update)
- `app/api/parse/route.ts` — POST (OpenAI parse + policy check)

### Key Modules

- `lib/data.ts` — Server-side data access with in-memory cache + JSON file backing.
- `lib/policy.ts` — Trust policy rules. `checkPolicy()` returns flags: `prohibited`, `over_limit`, `requires_review`, `unknown_beneficiary`, `exceeds_monthly_cap`.
- `lib/openai.ts` — `parseRequestWithAI()` using gpt-4o-mini, temperature 0.1, JSON response format.
- `lib/types.ts` — All TypeScript interfaces: `LedgerEntry`, `TrustRequest`, `ParsedRequest`, `PolicyFlag`, `ActivityEvent`, `RequestResolution`, `OfficerOverride`.
- `lib/constants.ts` — Domain constants with `as const` typing: categories, urgency levels/ordering, badge color mappings (`CATEGORY_COLORS`, `URGENCY_COLORS`, `STATUS_COLORS`), and `FLAG_CONFIG` (labels + severity).
- `lib/format.ts` — Currency and date formatting utilities.

### Component Organization

- `components/ui/` — shadcn primitives (do not edit manually; use the add command above)
- `components/ledger/` — Ledger page components (summary cards, table, analytics charts)
- `components/queue/` — Queue page components (request row, request detail content, batch actions, policy display, beneficiary profile, activity timeline)
- `components/app-sidebar.tsx` — Navigation sidebar with pending request count badge
- `components/dialog-container.tsx` / `components/drawer-container.tsx` — Global container components (see Global Containers above)
- `components/error-boundary.tsx` — Class-based React error boundary with retry
- `hooks/use-keyboard-shortcuts.ts` — Global keyboard shortcut registration, auto-ignores when focus is on input fields

### Styling Conventions

- **Tailwind CSS 4** with `@theme inline {}` in `app/globals.css`. Colors use OKLCH color space via CSS custom properties.
- **Dark mode**: `.dark` class toggle via `next-themes`. Both light and dark palettes defined in globals.css.
- **shadcn config**: `radix-vega` style, CSS variables mode. Config in `components.json`.
- **Fonts**: DM Serif Display (serif headings), Inter (sans body), Geist Mono (monospace). Loaded in root layout.

## Tech Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (radix-vega style), Zustand 5, Recharts, OpenAI SDK, Sonner (toasts), Lucide icons, vaul (drawer).

## Domain Context

- **Known beneficiaries**: Sam Miller, Katie Miller
- **Trust officer**: Margaret Chen (hardcoded identity)
- **Policy rules**: Education and Medical fully covered. General Support capped at $5k/month. Purchases over $20k require review. Speculative investments, luxury vehicles/goods are prohibited.
- Approving a request creates a DEBIT ledger entry. Denying does not affect the ledger.
- Prohibited requests have the Approve button disabled.
