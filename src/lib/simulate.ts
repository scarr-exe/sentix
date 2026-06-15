// The simulation engine: takes historical candles and a set of strategy
// rules, replays the strategy candle-by-candle, and returns the trade
// log, equity curve, and summary stats.
//
// Simplifications (documented, not hidden):
// - Only one position open at a time. A new entry signal is ignored
//   while a position is open.
// - Entry happens at the signal candle's CLOSE price (not the next
//   candle's open). This is a common backtesting simplification and
//   avoids needing to model order latency.
// - If both the take-profit and stop-loss levels fall within the same
//   candle's high/low range, the stop loss is assumed to trigger first.
//   This is the conservative assumption — it avoids overstating results
//   when intrabar order is unknown.
// - If a position is still open when the data runs out, it's closed at
//   the final candle's close price with reason "end_of_data".

import { Candle } from "./marketdata";
import { StrategyRules } from "./strategy";

export type TradeExitReason = "target" | "stop" | "end_of_data";

export type Trade = {
  entryTime: number; // ms timestamp
  entryPrice: number;
  exitTime: number; // ms timestamp
  exitPrice: number;
  pnlPct: number; // e.g. 2.0 means +2%, -5.0 means -5%
  reason: TradeExitReason;
};

export type EquityPoint = {
  time: number; // ms timestamp
  equity: number;
};

export type SimulationSummary = {
  totalTrades: number;
  winRate: number; // 0-100
  totalPnLPct: number; // compounded return relative to starting equity
  maxDrawdownPct: number; // positive number, e.g. 6.3 means a 6.3% drawdown
};

export type SimulationResult = {
  trades: Trade[];
  equityCurve: EquityPoint[];
  summary: SimulationSummary;
};

const STARTING_EQUITY = 100;

export function runSimulation(
  candles: Candle[],
  rules: StrategyRules
): SimulationResult {
  const { entry, exit, stopLoss } = rules;

  if (candles.length === 0) {
    return {
      trades: [],
      equityCurve: [],
      summary: emptySummary(),
    };
  }

  if (candles.length <= entry.windowCandles) {
    return {
      trades: [],
      equityCurve: [{ time: candles[0].openTime, equity: STARTING_EQUITY }],
      summary: emptySummary(),
    };
  }

  const trades: Trade[] = [];
  let i = entry.windowCandles;

  while (i < candles.length) {
    const current = candles[i];
    const past = candles[i - entry.windowCandles];
    const priceChangePct = ((current.close - past.close) / past.close) * 100;

    const triggered =
      (entry.direction === "drop" && priceChangePct <= -entry.pct) ||
      (entry.direction === "rise" && priceChangePct >= entry.pct);

    if (!triggered) {
      i++;
      continue;
    }

    const entryPrice = current.close;
    const entryTime = current.openTime;
    const targetPrice = entryPrice * (1 + exit.targetPct / 100);
    const stopPrice = stopLoss
      ? entryPrice * (1 - stopLoss.pct / 100)
      : null;

    let exited = false;

    for (let j = i + 1; j < candles.length; j++) {
      const candle = candles[j];

      // Stop loss checked first — conservative assumption for same-candle hits.
      if (stopPrice !== null && candle.low <= stopPrice) {
        trades.push({
          entryTime,
          entryPrice,
          exitTime: candle.openTime,
          exitPrice: stopPrice,
          pnlPct: ((stopPrice - entryPrice) / entryPrice) * 100,
          reason: "stop",
        });
        i = j + 1;
        exited = true;
        break;
      }

      if (candle.high >= targetPrice) {
        trades.push({
          entryTime,
          entryPrice,
          exitTime: candle.openTime,
          exitPrice: targetPrice,
          pnlPct: ((targetPrice - entryPrice) / entryPrice) * 100,
          reason: "target",
        });
        i = j + 1;
        exited = true;
        break;
      }
    }

    if (!exited) {
      // Ran out of data with a position still open — close at the last candle.
      const last = candles[candles.length - 1];
      trades.push({
        entryTime,
        entryPrice,
        exitTime: last.openTime,
        exitPrice: last.close,
        pnlPct: ((last.close - entryPrice) / entryPrice) * 100,
        reason: "end_of_data",
      });
      break; // no more candles left to scan for new entries
    }
  }

  const equityCurve = buildEquityCurve(candles[0].openTime, trades);
  const summary = buildSummary(equityCurve, trades);

  return { trades, equityCurve, summary };
}

function buildEquityCurve(startTime: number, trades: Trade[]): EquityPoint[] {
  const equityCurve: EquityPoint[] = [{ time: startTime, equity: STARTING_EQUITY }];
  let equity = STARTING_EQUITY;

  for (const trade of trades) {
    equity *= 1 + trade.pnlPct / 100;
    equityCurve.push({ time: trade.exitTime, equity });
  }

  return equityCurve;
}

function buildSummary(equityCurve: EquityPoint[], trades: Trade[]): SimulationSummary {
  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.pnlPct > 0).length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  const finalEquity = equityCurve[equityCurve.length - 1]?.equity ?? STARTING_EQUITY;
  const totalPnLPct = ((finalEquity - STARTING_EQUITY) / STARTING_EQUITY) * 100;

  let peak = STARTING_EQUITY;
  let maxDrawdownPct = 0;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const drawdown = ((peak - point.equity) / peak) * 100;
    if (drawdown > maxDrawdownPct) maxDrawdownPct = drawdown;
  }

  return { totalTrades, winRate, totalPnLPct, maxDrawdownPct };
}

function emptySummary(): SimulationSummary {
  return { totalTrades: 0, winRate: 0, totalPnLPct: 0, maxDrawdownPct: 0 };
}