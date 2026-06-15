import { NextRequest, NextResponse } from "next/server";
import { fetchCandles, MarketDataError } from "@/lib/marketdata";

// GET /api/candles?symbol=BTC/USDT&timeframe=1H&period=90 days
//
// This route exists mainly so the data-fetching logic stays server-side
// (avoids CORS issues and keeps API details out of client code).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const symbol = searchParams.get("symbol") ?? "BTC/USDT";
  const timeframe = searchParams.get("timeframe") ?? "1H";
  const period = searchParams.get("period") ?? "90 days";

  try {
    const candles = await fetchCandles(symbol, timeframe, period);
    return NextResponse.json({ symbol, timeframe, period, candles });
  } catch (err) {
    if (err instanceof MarketDataError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Unexpected error fetching market data" },
      { status: 500 }
    );
  }
}
