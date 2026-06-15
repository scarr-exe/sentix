// Wraps Groq's chat completions API to turn a plain-English strategy
// description into structured StrategyRules JSON.

import Groq from "groq-sdk";
import {
  StrategyRules,
  StrategyValidationError,
  validateStrategyRules,
} from "./strategy";

const MODEL = "llama-3.3-70b-versatile";

export class StrategyParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StrategyParseError";
  }
}

const SYSTEM_PROMPT = `You convert plain-English crypto trading strategy descriptions into a fixed JSON schema for backtesting.

Output ONLY valid JSON. No markdown, no code fences, no explanation — just the JSON object.

Schema:
{
  "entry": {
    "type": "price_change_pct",
    "direction": "drop" | "rise",
    "pct": number,           // positive, e.g. 3 means a 3% move
    "windowCandles": number  // positive integer, lookback window in candles
  },
  "exit": {
    "targetPct": number      // positive, gain target from entry price, e.g. 2 means +2%
  },
  "stopLoss": {
    "pct": number             // positive, loss limit from entry price, e.g. 5 means -5%
  } | null
}

Rules for mapping:
- "Buy when price drops X% ..." -> direction: "drop"
- "Buy when price rises/recovers/breaks out X% ..." -> direction: "rise"
- A time window like "in the last hour" / "over 4 hours" should be converted to a number
  of candles based on the chart's timeframe (provided to you). For example, if the
  timeframe is "1H" and the strategy says "in the last hour", windowCandles = 1.
  If the timeframe is "4H" and the strategy says "in the last hour", round to the
  nearest valid candle count (minimum 1).
- If no window is mentioned, default windowCandles to 1.
- "Sell when it recovers/gains X% from entry" -> exit.targetPct = X
- "Stop loss at X% below entry" -> stopLoss.pct = X
- If no stop loss is mentioned, set stopLoss to null.
- Ignore any mention of volume, indicators, or conditions outside this schema —
  approximate the closest equivalent using only price-change entry/exit/stop logic.
- All pct values must be positive numbers (the direction/field names already encode
  whether it's a gain or loss).

Examples:

Input: timeframe="1H", strategy="Buy BTC when price drops 3% in the last hour. Sell when it recovers 2% from entry. Stop loss at 5% below entry."
Output: {"entry":{"type":"price_change_pct","direction":"drop","pct":3,"windowCandles":1},"exit":{"targetPct":2},"stopLoss":{"pct":5}}

Input: timeframe="1H", strategy="Enter long when price rises 5% over the last 4 hours. Take profit at 10%. No stop loss."
Output: {"entry":{"type":"price_change_pct","direction":"rise","pct":5,"windowCandles":4},"exit":{"targetPct":10},"stopLoss":null}

Input: timeframe="4H", strategy="Buy the dip when price falls 4%. Exit at break-even plus 1.5%. Cut losses at 6%."
Output: {"entry":{"type":"price_change_pct","direction":"drop","pct":4,"windowCandles":1},"exit":{"targetPct":1.5},"stopLoss":{"pct":6}}`;

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new StrategyParseError(
      "GROQ_API_KEY is not set. Add it to .env.local."
    );
  }
  return new Groq({ apiKey });
}

/**
 * Converts a plain-English strategy description into validated StrategyRules.
 *
 * @param strategyText User's plain-English strategy description
 * @param timeframe Chart timeframe, e.g. "1H" | "4H" | "1D" — used to
 *   interpret time windows like "in the last hour"
 */
export async function parseStrategy(
  strategyText: string,
  timeframe: string
): Promise<StrategyRules> {
  const groq = getClient();

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `timeframe="${timeframe}", strategy="${strategyText}"`,
        },
      ],
    });
  } catch (err) {
    throw new StrategyParseError(
      `Groq API request failed: ${(err as Error).message}`
    );
  }

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new StrategyParseError("Groq returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new StrategyParseError(
      `Groq returned invalid JSON: ${content.slice(0, 200)}`
    );
  }

  try {
    return validateStrategyRules(parsed);
  } catch (err) {
    if (err instanceof StrategyValidationError) {
      throw new StrategyParseError(
        `Groq returned JSON that doesn't match the expected schema: ${err.message}`
      );
    }
    throw err;
  }
}