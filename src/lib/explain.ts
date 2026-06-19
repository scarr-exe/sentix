// Generates a plain-English explanation of simulation results plus one
// concrete improvement suggestion, using Groq.
//
// This is a separate, focused prompt from the strategy parser (groq.ts).
// That one converts text -> rules; this one converts results -> insight.

import Groq from "groq-sdk";
import type { StrategyRules } from "./strategy";
import type { SimulationSummary, Trade } from "./simulate";

const MODEL = "llama-3.3-70b-versatile";

export class ExplanationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExplanationError";
  }
}

export type Explanation = {
  analysis: string;
  suggestion: string;
};

const SYSTEM_PROMPT = `You are a trading strategy analyst. You're given the rules and backtest results for a simple price-action strategy, and you explain the results in plain English, then give one concrete, specific suggestion to improve it.

Output ONLY valid JSON, no markdown or code fences:
{
  "analysis": string,    // 2-4 sentences explaining how the strategy performed and why
  "suggestion": string   // 1-2 sentences with ONE specific, concrete change to try next
}

Guidelines:
- Be specific and reference the actual numbers given (win rate, drawdown, trade count, pnl).
- If there were very few or zero trades, say so plainly and suggest loosening the entry
  condition (lower the pct threshold or widen the window) rather than commenting on win rate.
- If stop losses were hit often, point that out and suggest either widening the stop or
  tightening the entry condition so fewer low-conviction trades trigger.
- If the win rate is high but PnL is low or negative, note the risk/reward ratio is likely
  unfavorable (target too small relative to stop loss) and suggest adjusting the ratio.
- Don't suggest volume filters, indicators (RSI, MACD, moving averages), or anything outside
  of: entry pct, entry window, exit target pct, stop loss pct. Those are the only levers
  available in this tool.
- Never use raw field/variable names like "targetPct", "windowCandles", "entry.pct", or
  "stopLoss.pct" in your output. Use plain English instead: "target", "take-profit",
  "entry threshold", "lookback window", "stop loss", etc.
- Keep the tone direct and useful, not generic or hedging. No "could potentially" — say what
  the data shows.`;

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ExplanationError(
      "GROQ_API_KEY is not set. Add it to .env.local.",
    );
  }
  return new Groq({ apiKey });
}

function buildUserPrompt(
  rules: StrategyRules,
  summary: SimulationSummary,
  trades: Trade[],
): string {
  const stopCount = trades.filter((t) => t.reason === "stop").length;
  const targetCount = trades.filter((t) => t.reason === "target").length;
  const openCount = trades.filter((t) => t.reason === "end_of_data").length;

  return JSON.stringify({
    rules,
    summary,
    tradeBreakdown: {
      hitTarget: targetCount,
      hitStop: stopCount,
      stillOpenAtEnd: openCount,
    },
  });
}

/**
 * Generates an analysis + improvement suggestion for a completed simulation.
 */
export async function explainResults(
  rules: StrategyRules,
  summary: SimulationSummary,
  trades: Trade[],
): Promise<Explanation> {
  const groq = getClient();
  const userPrompt = buildUserPrompt(rules, summary, trades);

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
  } catch (err) {
    throw new ExplanationError(
      `Groq API request failed: ${(err as Error).message}`,
    );
  }

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new ExplanationError("Groq returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new ExplanationError(
      `Groq returned invalid JSON: ${content.slice(0, 200)}`,
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).analysis !== "string" ||
    typeof (parsed as Record<string, unknown>).suggestion !== "string"
  ) {
    throw new ExplanationError(
      "Groq returned JSON that doesn't match the expected { analysis, suggestion } shape.",
    );
  }

  return parsed as Explanation;
}
