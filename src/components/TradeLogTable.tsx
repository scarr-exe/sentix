"use client";

import { useState } from "react";
import type { Trade } from "@/lib/simulate";

const PAGE_SIZE = 10;

const REASON_LABELS: Record<Trade["reason"], string> = {
  target: "TARGET",
  stop: "STOP",
  end_of_data: "OPEN",
};

const REASON_COLORS: Record<Trade["reason"], string> = {
  target: "text-[var(--accent)]",
  stop: "text-[var(--danger)]",
  end_of_data: "text-[var(--fg-dim)]",
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number): string {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function TradeLogTable({ trades }: { trades: Trade[] }) {
  const [page, setPage] = useState(0);

  if (trades.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--fg-dim)] text-sm">
        NO TRADES TRIGGERED. TRY A LOWER THRESHOLD OR DIFFERENT TIMEFRAME.
      </div>
    );
  }

  const totalPages = Math.ceil(trades.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const pageTrades = trades.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--fg-faint)] text-xs uppercase tracking-widest">
              <th className="text-left px-4 py-2.5 font-normal">Date</th>
              <th className="text-right px-4 py-2.5 font-normal">Entry</th>
              <th className="text-right px-4 py-2.5 font-normal">Exit</th>
              <th className="text-right px-4 py-2.5 font-normal">PnL</th>
              <th className="text-right px-4 py-2.5 font-normal">Reason</th>
            </tr>
          </thead>
          <tbody key={page} className="animate-fade-in">
            {pageTrades.map((trade, i) => (
              <tr
                key={start + i}
                className="border-b border-[var(--border-soft)] last:border-0 hover:bg-[var(--bg-panel-hover)] transition-colors"
              >
                <td className="px-4 py-3 text-[var(--fg-dim)] whitespace-nowrap">
                  {formatDate(trade.entryTime)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-[var(--fg)]">
                  {formatPrice(trade.entryPrice)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-[var(--fg)]">
                  {formatPrice(trade.exitPrice)}
                </td>
                <td className={`px-4 py-3 text-right whitespace-nowrap font-bold ${trade.pnlPct >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                  {trade.pnlPct >= 0 ? "+" : ""}{trade.pnlPct.toFixed(2)}%
                </td>
                <td className={`px-4 py-3 text-right whitespace-nowrap text-xs ${REASON_COLORS[trade.reason]}`}>
                  {REASON_LABELS[trade.reason]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-xs font-mono">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-[var(--fg-dim)] uppercase tracking-widest hover:text-[var(--accent)] disabled:opacity-25 transition-colors"
          >
            [ PREV ]
          </button>
          <span className="text-[var(--fg-faint)]">
            {page + 1} / {totalPages} — {trades.length} TRADES
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="text-[var(--fg-dim)] uppercase tracking-widest hover:text-[var(--accent)] disabled:opacity-25 transition-colors"
          >
            [ NEXT ]
          </button>
        </div>
      )}
    </div>
  );
}
