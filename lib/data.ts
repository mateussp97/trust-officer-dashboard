import fs from "fs";
import path from "path";
import type { LedgerEntry, TrustRequest, LedgerSummary, RequestsSummary } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const LEDGER_PATH = path.join(DATA_DIR, "ledger.json");
const REQUESTS_PATH = path.join(DATA_DIR, "requests.json");

// In-memory cache — persists across API requests within the same server process
let ledgerCache: LedgerEntry[] | null = null;
let requestsCache: TrustRequest[] | null = null;

function readLedger(): LedgerEntry[] {
  if (ledgerCache) return ledgerCache;
  const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
  ledgerCache = JSON.parse(raw) as LedgerEntry[];
  return ledgerCache;
}

function readRequests(): TrustRequest[] {
  if (requestsCache) return requestsCache;
  const raw = fs.readFileSync(REQUESTS_PATH, "utf-8");
  const seedRequests = JSON.parse(raw) as Array<{
    id: string;
    beneficiary: string;
    submitted_at: string;
    raw_text: string;
  }>;
  // Seed requests don't have status — default to pending
  requestsCache = seedRequests.map((r) => ({
    ...r,
    status: (r as TrustRequest).status || "pending" as const,
  })) as TrustRequest[];
  return requestsCache;
}

function writeLedger(entries: LedgerEntry[]): void {
  ledgerCache = entries;
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

function writeRequests(requests: TrustRequest[]): void {
  requestsCache = requests;
  fs.writeFileSync(REQUESTS_PATH, JSON.stringify(requests, null, 2), "utf-8");
}

// --- Public API ---

export function getLedgerSummary(): LedgerSummary {
  const entries = readLedger();
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let totalCredits = 0;
  let totalDebits = 0;

  for (const entry of sorted) {
    if (entry.type === "CREDIT") {
      totalCredits += entry.amount;
    } else {
      totalDebits += entry.amount;
    }
  }

  return {
    entries: sorted,
    balance: totalCredits - totalDebits,
    totalCredits,
    totalDebits,
  };
}

export function getRequestsSummary(): RequestsSummary {
  const requests = readRequests();
  const sorted = [...requests].sort(
    (a, b) =>
      new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );

  const pending = sorted.filter((r) => r.status === "pending");
  const pendingExposure = pending.reduce(
    (sum, r) => sum + (r.parsed?.amount ?? 0),
    0
  );

  return {
    requests: sorted,
    pendingCount: pending.length,
    pendingExposure,
  };
}

export function getRequestById(id: string): TrustRequest | undefined {
  const requests = readRequests();
  return requests.find((r) => r.id === id);
}

export function updateRequest(
  id: string,
  updates: Partial<TrustRequest>
): TrustRequest {
  const requests = readRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) {
    throw new Error(`Request ${id} not found`);
  }
  requests[index] = { ...requests[index], ...updates };
  writeRequests(requests);
  return requests[index];
}

export function addLedgerEntry(entry: LedgerEntry): LedgerEntry {
  const entries = readLedger();
  entries.push(entry);
  writeLedger(entries);
  return entry;
}

export function getBalance(): number {
  const { balance } = getLedgerSummary();
  return balance;
}
