import { NextResponse } from "next/server";
export async function DELETE() {
  return NextResponse.json(
    {
      error:
        "Use Staff Access to disable an account while preserving its history.",
    },
    { status: 405 },
  );
}
