import { NextResponse } from "next/server";
import { resetData } from "@/lib/data";

export async function POST() {
  try {
    resetData();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset failed:", error);
    return NextResponse.json(
      { error: "Failed to reset data" },
      { status: 500 }
    );
  }
}
