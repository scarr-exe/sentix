import type { SimulationSummary } from "@/lib/simulate";

export function SummaryCards({ summary }: { summary: SimulationSummary }) {
  const { totalPnLPct, winRate, totalTrades, maxDrawdownPct } = summary;
  const pnlPositive = totalPnLPct >= 0;

  const cards: { label: string; value: string; accent: string }[] = [
    {
      label: "Total PnL",
      value: `${pnlPositive ? "+" : ""}${totalPnLPct.toFixed(2)}%`,
      accent: pnlPositive ? "text-[var(--accent)]" : "text-[var(--danger)]",
    },
    {
      label: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      accent: "text-[var(--fg)]",
    },
    {
      label: "Trades",
      value: String(totalTrades),
      accent: "text-[var(--fg)]",
    },
    {
      label: "Max Drawdown",
      value: maxDrawdownPct > 0 ? `-${maxDrawdownPct.toFixed(2)}%` : "0.00%",
      accent: maxDrawdownPct > 0 ? "text-[var(--danger)]" : "text-[var(--fg)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border border-[var(--border)]">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`bg-[var(--bg)] p-4 ${i < cards.length - 1 ? "border-r border-[var(--border)]" : ""}`}
        >
          <p className="text-[var(--fg-faint)] text-xs uppercase tracking-widest mb-2">
            {card.label}
          </p>
          <p className={`text-2xl font-bold font-mono ${card.accent}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
