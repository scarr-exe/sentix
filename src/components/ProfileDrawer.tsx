"use client";

import { useAccount, useReadContract, useDisconnect } from "wagmi";
import { SENTIX_LOGGER_ADDRESS, SENTIX_LOGGER_ABI } from "@/lib/contract";
import { targetChain } from "@/lib/wagmi";

type OnChainRecord = {
  user: `0x${string}`;
  symbol: string;
  timeframe: string;
  period: string;
  strategyText: string;
  totalPnLBps: bigint;
  winRateBps: bigint;
  totalTrades: bigint;
  timestamp: bigint;
};

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPnL(bps: bigint): string {
  const pct = Number(bps) / 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ProfileDrawer({ open, onClose }: Props) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const { data: records, isLoading, error, refetch } = useReadContract({
    address: SENTIX_LOGGER_ADDRESS,
    abi: SENTIX_LOGGER_ABI,
    functionName: "getRecordsByUser",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected && open },
  });

  if (!isConnected || !address) return null;

  const sortedRecords = records
    ? [...(records as OnChainRecord[])].reverse()
    : [];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 z-50 bg-[var(--bg)] border-l border-[var(--border)] flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0 animate-slide-in-right" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between shrink-0">
          <span className="font-mono text-xs text-[var(--fg-faint)] uppercase tracking-widest">
            [ PROFILE ]
          </span>
          <button
            onClick={onClose}
            className="font-mono text-xs text-[var(--fg-faint)] hover:text-[var(--accent)] transition-colors uppercase tracking-widest"
          >
            [ CLOSE ]
          </button>
        </div>

        {/* Wallet info */}
        <div className="border-b border-[var(--border)] px-4 py-4 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[var(--fg-faint)] uppercase tracking-widest">
              Address
            </span>
            <span className="font-mono text-xs text-[var(--fg)]">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[var(--fg-faint)] uppercase tracking-widest">
              Network
            </span>
            <span className="font-mono text-xs text-[var(--accent)]">
              {targetChain.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[var(--fg-faint)] uppercase tracking-widest">
              Logged
            </span>
            <span className="font-mono text-xs text-[var(--fg)]">
              {isLoading ? "..." : `${sortedRecords.length} backtests`}
            </span>
          </div>
        </div>

        {/* History header */}
        <div className="border-b border-[var(--border)] px-4 py-2 flex items-center justify-between shrink-0">
          <span className="font-mono text-xs text-[var(--fg-faint)] uppercase tracking-widest">
            On-chain history
          </span>
          <button
            onClick={() => refetch()}
            className="font-mono text-xs text-[var(--fg-faint)] hover:text-[var(--accent)] transition-colors uppercase tracking-widest"
          >
            [ REFRESH ]
          </button>
        </div>

        {/* Records list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center gap-2 px-4 py-4 font-mono text-xs text-[var(--fg-dim)]">
              <span className="w-3 h-3 border-2 border-[var(--accent-dim)] border-t-[var(--accent)] rounded-full animate-spin" />
              Loading...
            </div>
          )}

          {error && (
            <div className="px-4 py-4 font-mono text-xs text-[var(--danger)]">
              ERR: Failed to load history.
            </div>
          )}

          {!isLoading && !error && sortedRecords.length === 0 && (
            <div className="px-4 py-8 text-center font-mono text-xs text-[var(--fg-faint)] uppercase tracking-widest leading-relaxed">
              No backtests logged yet.
              <br />
              Run a simulation and
              <br />
              log it to Base.
            </div>
          )}

          {!isLoading && sortedRecords.map((record, i) => {
            const pnlPct = Number(record.totalPnLBps) / 100;
            const isPositive = pnlPct >= 0;
            return (
              <div
                key={`${record.timestamp}-${i}`}
                className="border-b border-[var(--border-soft)] px-4 py-3 hover:bg-[var(--bg-panel-hover)] transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-[var(--fg)]">
                    {record.symbol} · {record.timeframe}
                  </span>
                  <span className={`font-mono text-xs font-bold ${isPositive ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                    {formatPnL(record.totalPnLBps)}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-[var(--fg-faint)]">
                    {String(record.totalTrades)} trades · {(Number(record.winRateBps) / 100).toFixed(1)}% WR
                  </span>
                  <span className="font-mono text-xs text-[var(--fg-faint)]">
                    {formatDate(record.timestamp)}
                  </span>
                </div>
                <p className="font-mono text-xs text-[var(--fg-dim)] truncate">
                  {record.strategyText.slice(0, 55)}
                  {record.strategyText.length > 55 ? "..." : ""}
                </p>
              </div>
            );
          })}
        </div>

        {/* Disconnect */}
        <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
          <button
            onClick={() => { disconnect(); onClose(); }}
            className="w-full border border-[var(--border)] text-[var(--fg-faint)] py-2 text-xs uppercase tracking-widest hover:border-[var(--danger)] hover:text-[var(--danger)] transition-colors font-mono"
          >
            [ DISCONNECT ]
          </button>
        </div>
      </div>
    </>
  );
}