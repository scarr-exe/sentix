import { NextRequest, NextResponse } from "next/server";
import { fetchCandles, MarketDataError } from "@/lib/marketdata";
import { parseStrategy, StrategyParseError } from "@/lib/groq";
import { runSimulation } from "@/lib/simulate";

// POST /api/simulate
// Body: { strategyText: string, symbol?: string, timeframe?: string, period?: string }
// Returns: { rules: StrategyRules, result: SimulationResult } | { error: string }
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

  const { strategyText, symbol, timeframe, period } = body as {
    strategyText?: string;
    symbol?: string;
    timeframe?: string;
    period?: string;
  };

  if (!strategyText || !strategyText.trim()) {
    return NextResponse.json(
      { error: "strategyText is required" },
      { status: 400 }
    );
  }

  const finalSymbol = symbol ?? "BTC/USDT";
  const finalTimeframe = timeframe ?? "1H";
  const finalPeriod = period ?? "90 days";

  try {
    // Parsing the strategy and fetching candles don't depend on each
    // other, so run them concurrently.
    const [rules, candles] = await Promise.all([
      parseStrategy(strategyText, finalTimeframe),
      fetchCandles(finalSymbol, finalTimeframe, finalPeriod),
    ]);

    const result = runSimulation(candles, rules);

    return NextResponse.json({ rules, result });
  } catch (err) {
    if (err instanceof StrategyParseError || err instanceof MarketDataError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Unexpected error running simulation" },
      { status: 500 }
    );
  }
}