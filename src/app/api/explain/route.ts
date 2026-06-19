import { NextRequest, NextResponse } from "next/server";
import { explainResults, ExplanationError } from "@/lib/explain";
import { validateStrategyRules, StrategyValidationError } from "@/lib/strategy";
import type { SimulationSummary, Trade } from "@/lib/simulate";

// POST /api/explain
// Body: { rules: StrategyRules, summary: SimulationSummary, trades: Trade[] }
// Returns: { analysis: string, suggestion: string } | { error: string }
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Request body must be a JSON object" },
      { status: 400 }
    );
  }

  const { rules: rawRules, summary, trades } = body as {
    rules?: unknown;
    summary?: SimulationSummary;
    trades?: Trade[];
  };

  if (!summary || !Array.isArray(trades)) {
    return NextResponse.json(
      { error: "summary and trades are required" },
      { status: 400 }
    );
  }

  let rules;
  try {
    rules = validateStrategyRules(rawRules);
  } catch (err) {
    if (err instanceof StrategyValidationError) {
      return NextResponse.json({ error: `Invalid rules: ${err.message}` }, { status: 400 });
    }
    throw err;
  }

  try {
    const explanation = await explainResults(rules, summary, trades);
    return NextResponse.json(explanation);
  } catch (err) {
    if (err instanceof ExplanationError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Unexpected error generating explanation" },
      { status: 500 }
    );
  }
}