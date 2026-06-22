"use client";

import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { SENTIX_LOGGER_ADDRESS, SENTIX_LOGGER_ABI } from "@/lib/contract";
import { targetChain } from "@/lib/wagmi";
import type { SimulationSummary } from "@/lib/simulate";
import type { StrategyRules } from "@/lib/strategy";

type Props = {
  rules: StrategyRules;
  summary: SimulationSummary;
  symbol: string;
  timeframe: string;
  period: string;
  strategyText: string;
};

function pnlToBps(pct: number): bigint {
  return BigInt(Math.round(pct * 100));
}

function rateToBps(pct: number): bigint {
  return BigInt(Math.round(pct * 100));
}

export function LogToBaseButton({
  summary,
  symbol,
  timeframe,
  period,
  strategyText,
}: Props) {
  const { isConnected } = useAccount();
  const [logged, setLogged] = useState(false);

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isConfirmed) setLogged(true);
  }, [isConfirmed]);

  const basescanBase =
    targetChain.id === 8453
      ? "https://basescan.org/tx/"
      : "https://sepolia.basescan.org/tx/";

  const handleLog = () => {
    if (!isConnected || logged) return;
    writeContract({
      address: SENTIX_LOGGER_ADDRESS,
      abi: SENTIX_LOGGER_ABI,
      functionName: "logBacktest",
      args: [
        symbol,
        timeframe,
        period,
        strategyText,
        pnlToBps(summary.totalPnLPct),
        rateToBps(summary.winRate),
        BigInt(summary.totalTrades),
      ],
    });
  };

  if (logged && txHash) {
    return (
      <div className="flex items-center justify-between border border-[var(--accent-dim)] bg-[var(--bg)] px-4 py-3 font-mono text-xs">
        <span className="text-[var(--accent)] uppercase tracking-widest">
          [OK] LOGGED ON BASE
        </span>
        <a
          href={basescanBase + txHash}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--fg-dim)] hover:text-[var(--accent)] uppercase tracking-widest transition-colors"
        >
          VIEW ON BASESCAN
        </a>
      </div>
    );
  }

  if (isPending || isConfirming) {
    return (
      <div className="flex items-center gap-2 border border-[var(--border)] px-4 py-3 font-mono text-xs text-[var(--fg-dim)] uppercase tracking-widest">
        <span className="w-3 h-3 border-2 border-[var(--accent-dim)] border-t-[var(--accent)] rounded-full animate-spin" />
        {isPending ? "CONFIRM IN WALLET..." : "LOGGING TO BASE..."}
      </div>
    );
  }

  if (writeError) {
    return (
      <div className="space-y-2">
        <div className="border border-[var(--danger-dim)] px-4 py-3 font-mono text-xs text-[var(--danger)]">
          ERR: {writeError.message.slice(0, 80)}
        </div>
        <button
          onClick={() => { reset(); handleLog(); }}
          className="w-full border border-[var(--border)] text-[var(--fg-dim)] py-3 text-xs uppercase tracking-widest hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors font-mono"
        >
          [ RETRY ]
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLog}
      disabled={!isConnected || summary.totalTrades === 0}
      className="w-full border border-[var(--accent)] text-[var(--accent)] py-3 text-xs uppercase tracking-widest hover:bg-[var(--accent)] hover:text-black transition-colors disabled:opacity-25 disabled:cursor-not-allowed font-mono font-bold"
    >
      [ LOG TO BASE ]
    </button>
  );
}