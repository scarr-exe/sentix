// Shared types for parsed trading strategy rules, plus validation.
//
// Scope (deliberately narrow): every strategy is reduced to a single
// entry condition based on a price change over a lookback window, an
// exit target, and an optional stop loss. This covers dip-buy,
// breakout, and momentum-style strategies described in plain English,
// and keeps the simulation engine (Milestone 4) simple.
//
// Volume-based conditions are explicitly out of scope (CoinGecko's free
// tier doesn't provide per-candle volume).

export type StrategyRules = {
  entry: {
    type: "price_change_pct";
    direction: "drop" | "rise";
    pct: number; // positive number, e.g. 3 means "3%"
    windowCandles: number; // lookback window, in candles at the chart's timeframe
  };
  exit: {
    targetPct: number; // positive number, e.g. 2 means "2% gain from entry"
  };
  stopLoss: {
    pct: number; // positive number, e.g. 5 means "5% loss from entry"
  } | null;
};

export class StrategyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StrategyValidationError";
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

/**
 * Validates and narrows an unknown value (typically parsed JSON from the
 * LLM) into a StrategyRules object. Throws StrategyValidationError with a
 * descriptive message if the shape is invalid.
 */
export function validateStrategyRules(data: unknown): StrategyRules {
  if (!isPlainObject(data)) {
    throw new StrategyValidationError("Strategy rules must be a JSON object.");
  }

  const entry = data.entry;
  if (!isPlainObject(entry)) {
    throw new StrategyValidationError("Missing or invalid 'entry' object.");
  }
  if (entry.type !== "price_change_pct") {
    throw new StrategyValidationError(
      `Unsupported entry.type: ${String(entry.type)}. Expected "price_change_pct".`
    );
  }
  if (entry.direction !== "drop" && entry.direction !== "rise") {
    throw new StrategyValidationError(
      `Invalid entry.direction: ${String(entry.direction)}. Expected "drop" or "rise".`
    );
  }
  if (!isPositiveNumber(entry.pct)) {
    throw new StrategyValidationError("entry.pct must be a positive number.");
  }
  if (!isPositiveInteger(entry.windowCandles)) {
    throw new StrategyValidationError("entry.windowCandles must be a positive integer.");
  }

  const exit = data.exit;
  if (!isPlainObject(exit)) {
    throw new StrategyValidationError("Missing or invalid 'exit' object.");
  }
  if (!isPositiveNumber(exit.targetPct)) {
    throw new StrategyValidationError("exit.targetPct must be a positive number.");
  }

  let stopLoss: StrategyRules["stopLoss"] = null;
  if (data.stopLoss !== null && data.stopLoss !== undefined) {
    if (!isPlainObject(data.stopLoss)) {
      throw new StrategyValidationError("stopLoss must be an object or null.");
    }
    if (!isPositiveNumber(data.stopLoss.pct)) {
      throw new StrategyValidationError("stopLoss.pct must be a positive number.");
    }
    stopLoss = { pct: data.stopLoss.pct };
  }

  return {
    entry: {
      type: "price_change_pct",
      direction: entry.direction,
      pct: entry.pct,
      windowCandles: entry.windowCandles,
    },
    exit: {
      targetPct: exit.targetPct,
    },
    stopLoss,
  };
}