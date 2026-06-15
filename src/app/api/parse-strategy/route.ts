import { NextRequest, NextResponse } from "next/server";
import { parseStrategy, StrategyParseError } from "@/lib/groq";

// POST /api/parse-strategy
// Body: { strategyText: string, timeframe: string }
// Returns: { rules: StrategyRules } | { error: string }
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).strategyText !== "string"
  ) {
    return NextResponse.json(
      { error: "strategyText (string) is required" },
      { status: 400 }
    );
  }

  const { strategyText, timeframe } = body as {
    strategyText: string;
    timeframe?: string;
  };

  if (!strategyText.trim()) {
    return NextResponse.json(
      { error: "strategyText cannot be empty" },
      { status: 400 }
    );
  }

  try {
    const rules = await parseStrategy(strategyText, timeframe ?? "1H");
    return NextResponse.json({ rules });
  } catch (err) {
    if (err instanceof StrategyParseError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Unexpected error parsing strategy" },
      { status: 500 }
    );
  }
}