import { NextResponse } from "next/server";
import { getRequestsSummary } from "@/lib/data";

export async function GET() {
  const summary = getRequestsSummary();
  return NextResponse.json(summary);
}
