// Fetches historical price data from CoinGecko's public market_chart endpoint
// and aggregates it into OHLCV candles at the requested timeframe.
//
// Why this approach:
// - CoinGecko is a data aggregator (not an exchange), so it isn't caught up
//   in exchange-domain blocks that affect Binance/Coinbase/Kraken in some regions.
// - No API key required for this endpoint at normal usage rates.
// - The dedicated /ohlc endpoint has FIXED granularity based on date range
//   (e.g. 90 days -> 4-day candles), which breaks a 1H/4H/1D selector.
//   market_chart returns hourly points for 2-90 day ranges, so we can
//   aggregate those ourselves into 1H, 4H, or 1D candles.
//
// Trade-off: candles are built from price points, not true exchange OHLC.
// open/high/low/close within a candle are derived from the price points
// that fall in that window. This is accurate enough for strategy backtesting.

export type Candle = {
  openTime: number; // ms timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

// Map UI base asset to CoinGecko coin ID.
// Quote currency (USDT) is treated as USD (1:1 peg assumption).
const COIN_ID_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  BNB: "binancecoin",
};

const TIMEFRAME_TO_HOURS: Record<string, number> = {
  "1H": 1,
  "4H": 4,
  "1D": 24,
};

const PERIOD_TO_DAYS: Record<string, number> = {
  "30 days": 30,
  "60 days": 60,
  "90 days": 90,
};

const BASE_URL = "https://api.coingecko.com/api/v3";

export class MarketDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketDataError";
  }
}

function parseSymbol(symbol: string): { coinId: string; base: string } {
  const [base] = symbol.toUpperCase().split("/");
  const coinId = COIN_ID_MAP[base];
  if (!coinId) {
    throw new MarketDataError(
      `Unsupported asset: ${base}. Supported: ${Object.keys(COIN_ID_MAP).join(", ")}`
    );
  }
  return { coinId, base };
}

type MarketChartResponse = {
  prices?: [number, number][]; // [timestamp_ms, price]
  total_volumes?: [number, number][]; // [timestamp_ms, volume]
};

/**
 * Fetches historical OHLCV candles by aggregating CoinGecko's hourly
 * price/volume series into the requested timeframe.
 *
 * @param symbol UI format, e.g. "BTC/USDT"
 * @param timeframe UI format, e.g. "1H" | "4H" | "1D"
 * @param period UI format, e.g. "30 days" | "60 days" | "90 days"
 */
export async function fetchCandles(
  symbol: string,
  timeframe: string,
  period: string
): Promise<Candle[]> {
  const { coinId } = parseSymbol(symbol);

  const aggregateHours = TIMEFRAME_TO_HOURS[timeframe];
  const days = PERIOD_TO_DAYS[period];

  if (!aggregateHours) {
    throw new MarketDataError(`Unsupported timeframe: ${timeframe}`);
  }
  if (!days) {
    throw new MarketDataError(`Unsupported period: ${period}`);
  }

  const url = new URL(`${BASE_URL}/coins/${coinId}/market_chart`);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("days", String(days));

  let response: Response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    throw new MarketDataError(
      `Network error reaching CoinGecko: ${(err as Error).message}`
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new MarketDataError(
      `CoinGecko API error (${response.status}): ${body || response.statusText}`
    );
  }

  const json = (await response.json()) as MarketChartResponse;

  const prices = json.prices ?? [];
  const volumes = json.total_volumes ?? [];

  if (prices.length === 0) {
    throw new MarketDataError(
      `No price data returned for ${coinId}. CoinGecko may be rate-limiting — wait a moment and try again.`
    );
  }

  return aggregateToCandles(prices, volumes, aggregateHours);
}

/**
 * Groups raw [timestamp, price] points into fixed-size buckets (by hour
 * count) and derives OHLCV for each bucket.
 */
function aggregateToCandles(
  prices: [number, number][],
  volumes: [number, number][],
  aggregateHours: number
): Candle[] {
  const bucketMs = aggregateHours * 60 * 60 * 1000;

  // Build a quick lookup for volume at each timestamp.
  const volumeMap = new Map<number, number>();
  for (const [ts, vol] of volumes) {
    volumeMap.set(ts, vol);
  }

  const candles: Candle[] = [];
  let bucketStart: number | null = null;
  let bucketPrices: number[] = [];
  let bucketVolume = 0;

  const flushBucket = () => {
    if (bucketStart === null || bucketPrices.length === 0) return;
    candles.push({
      openTime: bucketStart,
      open: bucketPrices[0],
      high: Math.max(...bucketPrices),
      low: Math.min(...bucketPrices),
      close: bucketPrices[bucketPrices.length - 1],
      volume: bucketVolume,
    });
  };

  for (const [ts, price] of prices) {
    if (bucketStart === null) {
      bucketStart = Math.floor(ts / bucketMs) * bucketMs;
    }

    // If this point falls outside the current bucket, close it and start a new one.
    if (ts >= bucketStart + bucketMs) {
      flushBucket();
      bucketStart = Math.floor(ts / bucketMs) * bucketMs;
      bucketPrices = [];
      bucketVolume = 0;
    }

    bucketPrices.push(price);
    bucketVolume += volumeMap.get(ts) ?? 0;
  }

  flushBucket();

  if (candles.length === 0) {
    throw new MarketDataError("Failed to build candles from price data.");
  }

  return candles;
}
