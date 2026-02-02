# Trust Officer Dashboard

A dashboard for trust officers to monitor financial health and process beneficiary distribution requests. Built for Sava's trust management workflow, where unstructured requests (plain text from beneficiaries) are parsed by AI, checked against trust policy rules, and processed by the officer with full audit trails.

## Features

**Core**
- Ledger view with dynamic balance calculation, transaction history, and summary cards
- Request queue with AI-powered parsing of raw text into structured data (amount, category, urgency, policy flags)
- Approve/deny workflow with officer overrides (amount, category, urgency) and required notes
- Server-side policy engine that independently validates every request against trust rules
- Audit trail on every request — who decided, when, what amount, and why

**Beyond the requirements**
- Partial approvals — approve a different amount than what was requested
- Pending exposure — total pending amount shown alongside available balance
- Keyboard navigation — `j`/`k` to move through requests, `Enter` to open details
- Batch actions — select multiple requests for bulk processing
- Beneficiary profiles — view request history per beneficiary
- Analytics charts — balance over time, category breakdown, monthly trends
- Filtering, sorting, search, and time range controls on both pages
- CSV export for ledger transactions
- Dark mode toggle
- Error boundaries with retry

## Tech Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand 5, Recharts, OpenAI SDK (GPT-5.2), Sonner, Lucide, vaul

## Getting Started

**Prerequisites:** Node.js 18+, pnpm

```bash
# Clone and install
git clone <repo-url>
cd trust-officer-dashboard
pnpm install

# Set up environment
cp .env.example .env.local
# Add your OpenAI API key to .env.local

# Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to the Queue page, where pending requests are auto-parsed on load.

## Architecture

### Data Flow

```
React components → Zustand stores → Next.js API routes → lib/data.ts (in-memory cache + JSON files)
```

Persistence is JSON files in `data/` with an in-memory cache layer. All server-side reads and writes go through `lib/data.ts`. No database — keeps setup to zero external dependencies beyond the OpenAI API key.

### State Management

Three Zustand stores instead of one monolithic store:

- **Dashboard store** — all business data: requests, ledger entries, balances, and actions (approve, deny, parse). Tracks per-request loading states and uses optimistic updates with automatic rollback on failure.
- **Dialog store** — generic modal container. Accepts any `ReactNode` as content.
- **Drawer store** — same pattern for the right-side detail panel.

The dialog and drawer stores are mounted once in the layout. Any component can open a modal or drawer by calling into the store directly — no prop drilling, no context providers.

### AI + Policy Double-Check

Two independent validation layers:

1. **AI parsing** (`lib/openai.ts`) — GPT-5.2 with JSON mode extracts amount, category, urgency, summary, and flags from raw request text. Policy rules are encoded in the system prompt.
2. **Policy engine** (`lib/policy.ts`) — pure TypeScript function that checks the parsed result against trust rules independently. Catches prohibited categories, monthly caps ($5k for General Support), large purchase thresholds ($20k+), and unknown beneficiaries.

Even if the AI misclassifies a request, the policy engine will flag it. Prohibited requests have the Approve button disabled at the UI level.

### Key Modules

| Module | Purpose |
|--------|---------|
| `lib/data.ts` | Server-side data access with in-memory cache + JSON file backing |
| `lib/policy.ts` | Trust policy rules — `checkPolicy()` returns typed flags |
| `lib/openai.ts` | AI parsing with GPT-5.2, temperature 0.1, JSON response format |
| `lib/types.ts` | All TypeScript interfaces for the domain |
| `lib/constants.ts` | Categories, urgency levels, badge color mappings, flag config |
| `stores/dashboard-store.ts` | Main Zustand store with optimistic updates and derived selectors |

## Technical Decisions

**JSON files + in-memory cache over a database.** Keeps the project to zero infrastructure — no Docker, no migrations, no connection strings. The in-memory cache makes reads fast. The trade-off is no safety for concurrent writes and the cache resets on server restart. For production: Postgres with transactions.

**Three Zustand stores over one.** The main store handles all business logic. The dialog and drawer stores are generic containers — they accept any React component as content and are mounted once in the layout. This keeps modal/drawer logic completely decoupled from the components that trigger them.

**Optimistic updates with rollback.** When the officer approves or denies a request, the UI updates immediately. The store saves the previous state, sends the API call in the background, and rolls back automatically if the server rejects it. This makes the app feel instant.

**Auto-parse on load with `Promise.allSettled`.** All pending unparsed requests are parsed when the Queue page loads, so everything is ready for review. Using `allSettled` instead of `all` means one failed parse doesn't block the rest.

**Client state for filters instead of URL params.** Filters and sorting live in local component state, not in the URL. This keeps the implementation simpler but means you can't share a filtered view via link. For a multi-officer team, URL search params would be better.

**Types-first development.** All domain types are defined upfront in `lib/types.ts`. The stores, API routes, and components all reference the same interfaces. This made it easier to work with AI assistance — the types serve as a contract that keeps everything consistent.

## Project Structure

```
app/
  (dashboard)/          # Route group with shared sidebar layout
    ledger/page.tsx     # Financial health view
    queue/page.tsx      # Request processing view
    layout.tsx          # Dashboard shell, data init, global containers
  api/                  # API routes for ledger, requests, parsing
components/
  ui/                   # shadcn primitives
  dialogs/              # Reusable confirmation dialog content
  ledger/               # Ledger page components
  queue/                # Queue page components
stores/                 # Zustand stores
lib/                    # Data access, policy engine, AI parsing, types, utils
data/                   # JSON persistence (ledger.json, requests.json)
hooks/                  # Keyboard shortcuts
```

## Scripts

```bash
pnpm dev       # Development server (Turbopack)
pnpm build     # Production build
pnpm start     # Production server
pnpm lint      # ESLint
```
