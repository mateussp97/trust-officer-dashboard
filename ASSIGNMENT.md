# Assignment: Trust Officer Dashboard

## Context

Sava is building the operating system for trusts. We're the actual regulated trustee — we hold assets, manage financial truth, and execute the wishes of families.

A core workflow is **Distributions**: taking unstructured requests from beneficiaries (e.g., "I need tuition money") and turning them into immutable financial records.

## The Mission

Build an interface for a Trust Officer who needs to:

1. **Monitor the trust's financial health** (The Ledger)
2. **Review and process incoming requests** against trust rules (The Queue)

---

## What We're Looking For

- **Architectural thinking** — How you structure code, manage state, and model data
- **Thoughtful UX** — Making complex financial workflows feel simple
- **Opinions** — Deliberate choices about what to build and what to skip
- **Initiative** — Add features if you have time and ideas

Tests are optional. We care more about your thinking than coverage.

---

## Constraints

- **Stack:** Next.js, TypeScript, Tailwind (or your preferred stack if you feel strongly)
- **AI:** Use OpenAI API to parse requests. Read key from `.env.local`. Don't commit it.
- **Time:** 72 hours

---

## The Data

In `starter-files/data/`:

- **`ledger.json`** — Transaction history
- **`requests.json`** — Pending beneficiary requests

---

## Trust Policy

| Category | Rule |
|----------|------|
| **Education** | Fully covered. Includes tuition, materials, academic travel. |
| **Medical** | Fully covered. |
| **General Support** | Capped at $5,000/month per beneficiary. |
| **Large Purchases** | Over $20,000 requires high-priority review. |
| **Prohibited** | No speculative investments, luxury vehicles, or luxury goods. |

---

## Core Requirements

### 1. Ledger View

- Display transactions from `ledger.json`
- Show **current balance** calculated dynamically (CREDITs - DEBITs)
- Balance updates immediately when requests are approved

### 2. Request Queue

- Display requests sorted by submission date
- Use **OpenAI API** to parse `raw_text` into:
  - Amount
  - Category (Education, Medical, General Support, Other)
  - Urgency (High, Medium, Low)
  - Policy notes (flags like "Exceeds $20k" or "Prohibited")
- Officer can review and override AI suggestions

### 3. Approve/Deny Workflow

**Approved:**
- Creates a DEBIT transaction in the ledger
- Balance updates immediately
- Request moves to processed state (visible for audit)

**Denied:**
- Balance unchanged
- Request marked denied (visible for audit)

Requests should never disappear — always maintain an audit trail.

---

## Bonus Ideas

- **Pending exposure** — Show total pending amount vs available balance
- **Request age** — Surface how long requests have been waiting
- **Partial approvals** — Approve for a different amount
- **Audit trail** — Who approved what, when, and why

---

## Deliverables

1. **GitHub repo** with:
   - Source code
   - `.env.example`
   - README with setup instructions and your technical decisions

2. **Loom video** (~5 min):
   - Demo processing 2-3 requests (approvals and denials)
   - Walk through your architecture
   - Mention one trade-off you made and how you'd improve it
