"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ASSETS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT", "BNB/USDT"];
const TIMEFRAMES = ["1H", "4H", "1D"];
const PERIODS = ["30 days", "60 days", "90 days"];

export default function Home() {
  const [strategy, setStrategy] = useState("");
  const [asset, setAsset] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("1H");
  const [period, setPeriod] = useState("90 days");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRun = async () => {
    if (!strategy.trim()) return;
    setLoading(true);
    // Will wire up to API in Milestone 3
    setTimeout(() => {
      setLoading(false);
      router.push("/results");
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="mb-12">
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white">
            Strat<span className="text-[#00f5a0]">Sim</span>
          </h1>
          <p className="text-[#666] text-sm mt-1 font-mono">
            AI-powered strategy backtester
          </p>
        </div>

        {/* Headline */}
        <div className="mb-10">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Test your strategy.<br />
            <span className="text-[#00f5a0]">Before it costs you.</span>
          </h2>
          <p className="text-[#888] mt-3 text-base leading-relaxed">
            Describe a trading strategy in plain English. We run it against real
            market history and tell you exactly what would have happened.
          </p>
        </div>

        {/* Strategy Input */}
        <div className="mb-4">
          <label className="block text-xs font-mono text-[#555] uppercase tracking-widest mb-2">
            Your strategy
          </label>
          <textarea
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            placeholder={`e.g. "Buy BTC when price drops 3% in the last hour. Sell when it recovers 2% from entry. Stop loss at 5% below entry."`}
            rows={4}
            className="w-full bg-[#111] border border-[#222] rounded-lg p-4 text-white placeholder-[#444] font-mono text-sm resize-none focus:outline-none focus:border-[#00f5a0] transition-colors"
          />
        </div>

        {/* Config Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div>
            <label className="block text-xs font-mono text-[#555] uppercase tracking-widest mb-2">
              Asset
            </label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00f5a0] transition-colors appearance-none cursor-pointer"
            >
              {ASSETS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#555] uppercase tracking-widest mb-2">
              Timeframe
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00f5a0] transition-colors appearance-none cursor-pointer"
            >
              {TIMEFRAMES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#555] uppercase tracking-widest mb-2">
              Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#00f5a0] transition-colors appearance-none cursor-pointer"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={handleRun}
          disabled={!strategy.trim() || loading}
          className="w-full bg-[#00f5a0] text-black font-mono font-bold py-4 rounded-lg text-sm uppercase tracking-widest hover:bg-[#00e090] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? "Parsing strategy..." : "Run Simulation →"}
        </button>

        {/* Footer note */}
        <p className="text-center text-[#444] text-xs font-mono mt-6">
          Simulated only · No real trades executed
        </p>
      </div>
    </main>
  );
}
