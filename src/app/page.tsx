"use client";

import { useEffect, useRef, useState } from "react";
import type { StrategyRules } from "@/lib/strategy";
import type { SimulationResult } from "@/lib/simulate";
import type { Explanation } from "@/lib/explain";
import { SummaryCards } from "@/components/SummaryCards";
import { TradeLogTable } from "@/components/TradeLogTable";
import { EquityCurveChart } from "@/components/EquityCurveChart";
import { ExplanationCard } from "@/components/ExplanationCard";
import { useAccount } from "wagmi";
import { WalletButton } from "@/components/WalletButton";
import { LogToBaseButton } from "@/components/LogToBaseButton";
import { ProfileDrawer } from "@/components/ProfileDrawer";

const ASSETS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT", "BNB/USDT"];
const TIMEFRAMES = ["1H", "4H", "1D"];
const PERIODS = ["30 days", "60 days", "90 days"];

type SimulateResponse = {
  rules: StrategyRules;
  result: SimulationResult;
};

function StatusBar({
  loading,
  onProfileOpen,
}: {
  loading: boolean;
  onProfileOpen: () => void;
}) {
  return (
    <div className="w-full border-b border-[var(--border)] px-4 py-1.5 flex items-center justify-between font-mono text-xs text-[var(--fg-dim)]">
      <span className="flex items-center gap-2">
        <span className="dot-pulse w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block" />
        SENTIX v1.0
      </span>
      <span className="flex items-center gap-3">
        <span>{loading ? "RUNNING..." : "READY"}</span>
        <span className="text-[var(--fg-faint)]">|</span>
        <WalletButton onProfileOpen={onProfileOpen} />
      </span>
    </div>
  );
}

export default function Home() {
  const [strategy, setStrategy] = useState("");
  const [asset, setAsset] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("1H");
  const [period, setPeriod] = useState("90 days");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SimulateResponse | null>(null);

  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);

  const [refineText, setRefineText] = useState("");
  const { isConnected, address } = useAccount();

  const resultsRef = useRef<HTMLDivElement>(null);

  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (data && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [data]);

  const fetchExplanation = async (response: SimulateResponse) => {
    setExplanationLoading(true);
    setExplanationError(null);
    setExplanation(null);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: response.rules,
          summary: response.result.summary,
          trades: response.result.trades,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate explanation");
      setExplanation(json as Explanation);
    } catch (err) {
      setExplanationError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setExplanationLoading(false);
    }
  };

  const runSimulation = async (text: string) => {
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);
    setData(null);
    setExplanation(null);
    setExplanationError(null);

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyText: text, symbol: asset, timeframe, period }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Simulation failed");

      const response = json as SimulateResponse;
      setStrategy(text);
      setRefineText(text);
      setData(response);
      fetchExplanation(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleRun = () => runSimulation(strategy);
  const handleRefine = () => runSimulation(refineText);

  return (
    <>
      {/* CRT scanline + vignette overlay */}
      <div className="crt-overlay" aria-hidden="true" />

      <div className="min-h-screen flex flex-col font-mono">
        {/* Top status bar */}
        <StatusBar loading={loading} onProfileOpen={() => setProfileOpen(true)} />
        <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />

        <main className="flex flex-col items-center px-4 py-10 flex-1">
          <div className="w-full max-w-2xl space-y-8">

            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--accent)] text-glow">
                SEN<span className="text-[var(--fg)]">TIX</span>
                <span className="cursor-blink text-[var(--accent)] ml-1">_</span>
              </h1>
              <p className="text-[var(--fg-dim)] text-xs mt-1 uppercase tracking-widest">
                trading strategy backtester
              </p>
            </div>

            {/* Input panel */}
            <div className={`border border-[var(--border)] bg-[var(--bg-panel)] relative ${!isConnected ? "opacity-50" : ""}`}>
              <div className="border-b border-[var(--border)] px-4 py-2 text-[var(--fg-faint)] text-xs uppercase tracking-widest flex items-center justify-between">
                <span>[ INPUT ]</span>
                <span className="text-[var(--fg-faint)]">{asset} · {timeframe} · {period}</span>
              </div>

              {/* Lock overlay */}
              {!isConnected && (
                <div className="absolute inset-0 top-[33px] z-10 flex items-center justify-center bg-[var(--bg-panel)]/80">
                  <p className="font-mono text-xs text-[var(--fg-faint)] uppercase tracking-widest">
                    Connect wallet to run simulations
                  </p>
                </div>
              )}

              <div className="p-4 space-y-4">
                {/* Strategy textarea */}
                <div>
                  <label className="block text-xs text-[var(--fg-faint)] uppercase tracking-widest mb-1.5">
                    &gt; Strategy
                  </label>
                  <textarea
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    disabled={!isConnected}
                    placeholder={`"Buy BTC when price drops 3% in the last hour. Sell when it recovers 2% from entry. Stop loss at 5% below entry."`}
                    rows={4}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] p-3 text-[var(--fg)] placeholder-[var(--fg-faint)] text-sm resize-none focus:outline-none focus:border-[var(--accent)] transition-colors disabled:cursor-not-allowed"
                  />
                </div>

                {/* Config row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Asset", value: asset, setter: setAsset, options: ASSETS },
                    { label: "Timeframe", value: timeframe, setter: setTimeframe, options: TIMEFRAMES },
                    { label: "Period", value: period, setter: setPeriod, options: PERIODS },
                  ].map(({ label, value, setter, options }) => (
                    <div key={label}>
                      <label className="block text-xs text-[var(--fg-faint)] uppercase tracking-widest mb-1.5">
                        &gt; {label}
                      </label>
                      <select
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        disabled={!isConnected}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] px-2 py-2 text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)] transition-colors appearance-none cursor-pointer disabled:cursor-not-allowed"
                      >
                        {options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Run button */}
                <button
                  onClick={handleRun}
                  disabled={!strategy.trim() || loading || !isConnected}
                  className="w-full border border-[var(--accent)] text-[var(--accent)] py-3 text-sm uppercase tracking-widest hover:bg-[var(--accent)] hover:text-black transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[var(--accent)] font-bold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-[var(--accent-dim)] border-t-[var(--accent)] rounded-full animate-spin" />
                      RUNNING SIMULATION...
                    </span>
                  ) : !isConnected ? (
                    "[ CONNECT WALLET ]"
                  ) : (
                    "[ RUN SIMULATION ]"
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="border border-[var(--danger)] bg-[var(--danger-dim)] p-4 text-[var(--danger)] text-sm">
                ERR: {error}
              </div>
            )}

            {/* Results */}
            {data && (
              <div ref={resultsRef} className="space-y-6 animate-fade-in">

                {/* Summary */}
                <div className="border border-[var(--border)] bg-[var(--bg-panel)]">
                  <div className="border-b border-[var(--border)] px-4 py-2 text-[var(--fg-faint)] text-xs uppercase tracking-widest">
                    [ SUMMARY ]
                  </div>
                  <div className="p-4">
                    <SummaryCards summary={data.result.summary} />
                  </div>
                </div>

                {/* Equity curve */}
                <div className="border border-[var(--border)] bg-[var(--bg-panel)]">
                  <div className="border-b border-[var(--border)] px-4 py-2 text-[var(--fg-faint)] text-xs uppercase tracking-widest">
                    [ EQUITY CURVE ]
                  </div>
                  <div className="p-4">
                    <EquityCurveChart data={data.result.equityCurve} />
                  </div>
                </div>

                {/* Trade log */}
                <div className="border border-[var(--border)] bg-[var(--bg-panel)]">
                  <div className="border-b border-[var(--border)] px-4 py-2 text-[var(--fg-faint)] text-xs uppercase tracking-widest flex items-center justify-between">
                    <span>[ TRADE LOG ]</span>
                    <span>{data.result.trades.length} TRADES</span>
                  </div>
                  <TradeLogTable trades={data.result.trades} />
                </div>

                {/* Analysis */}
                <div className="border border-[var(--border)] bg-[var(--bg-panel)]">
                  <div className="border-b border-[var(--border)] px-4 py-2 text-[var(--fg-faint)] text-xs uppercase tracking-widest">
                    [ ANALYSIS ]
                  </div>
                  <div className="p-4">
                    <ExplanationCard
                      analysis={explanation?.analysis ?? null}
                      suggestion={explanation?.suggestion ?? null}
                      loading={explanationLoading}
                      error={explanationError}
                    />
                  </div>
                </div>

                {/* Log to Base */}
                <div className="border border-[var(--border)] bg-[var(--bg-panel)]">
                  <div className="border-b border-[var(--border)] px-4 py-2 text-[var(--fg-faint)] text-xs uppercase tracking-widest flex items-center justify-between">
                    <span>[ LOG TO BASE ]</span>
                    <span className="text-[var(--fg-faint)]">Base Sepolia · On-chain record</span>
                  </div>
                  <div className="p-4">
                    <p className="text-[var(--fg-dim)] text-xs font-mono mb-3">
                      Write this backtest result permanently to Base. Verifiable on Basescan.
                    </p>
                    <LogToBaseButton
                      rules={data.rules}
                      summary={data.result.summary}
                      symbol={asset}
                      timeframe={timeframe}
                      period={period}
                      strategyText={strategy}
                    />
                  </div>
                </div>

                {/* Refine */}
                <div className="border border-[var(--border)] bg-[var(--bg-panel)]">
                  <div className="border-b border-[var(--border)] px-4 py-2 text-[var(--fg-faint)] text-xs uppercase tracking-widest">
                    [ REFINE ]
                  </div>
                  <div className="p-4 space-y-3">
                    <label className="block text-xs text-[var(--fg-faint)] uppercase tracking-widest mb-1.5">
                      &gt; Updated strategy
                    </label>
                    <textarea
                      value={refineText}
                      onChange={(e) => setRefineText(e.target.value)}
                      rows={3}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] p-3 text-[var(--fg)] text-sm resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                    <button
                      onClick={handleRefine}
                      disabled={!refineText.trim() || loading}
                      className="w-full border border-[var(--fg-dim)] text-[var(--fg-dim)] py-3 text-sm uppercase tracking-widest hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-25 disabled:cursor-not-allowed font-bold"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-3 h-3 border-2 border-[var(--accent-dim)] border-t-[var(--accent)] rounded-full animate-spin" />
                          RUNNING...
                        </span>
                      ) : (
                        "[ RUN AGAIN ]"
                      )}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Footer */}
            <div className="border-t border-[var(--border)] pt-4 flex items-center justify-between text-[var(--fg-faint)] text-xs">
              <span>SENTIX</span>
              <span>DISCLAIMER: NO REAL TRADES PERFORMED</span>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
