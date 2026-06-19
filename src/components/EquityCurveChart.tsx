"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { EquityPoint } from "@/lib/simulate";

function formatDateShort(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateFull(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type TooltipPayloadItem = {
  value: number;
  payload: EquityPoint;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  const changeFromStart = ((point.equity - 100) / 100) * 100;
  const positive = changeFromStart >= 0;

  return (
    <div className="bg-[var(--bg)] border border-[var(--border)] px-3 py-2 font-mono text-xs">
      <p className="text-[var(--fg-faint)] mb-0.5">{formatDateFull(point.time)}</p>
      <p className={positive ? "text-[var(--accent)]" : "text-[var(--danger)]"}>
        {positive ? "+" : ""}{changeFromStart.toFixed(2)}%
      </p>
    </div>
  );
}

export function EquityCurveChart({ data }: { data: EquityPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="p-6 text-center text-[var(--fg-dim)] text-sm">
        NOT ENOUGH DATA POINTS TO RENDER CURVE.
      </div>
    );
  }

  const finalEquity = data[data.length - 1].equity;
  const isPositive = finalEquity >= 100;
  const lineColor = isPositive ? "var(--accent)" : "var(--danger)";
  const gradientId = isPositive ? "gradPos" : "gradNeg";

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="2 4" />

        <ReferenceLine y={100} stroke="var(--fg-faint)" strokeDasharray="3 3" strokeWidth={1} />

        <XAxis
          dataKey="time"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={formatDateShort}
          tick={{ fill: "var(--fg-faint)", fontSize: 10, fontFamily: "monospace" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          minTickGap={50}
        />

        <YAxis
          tick={{ fill: "var(--fg-faint)", fontSize: 10, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => v.toFixed(0)}
          width={36}
        />

        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey="equity"
          stroke={lineColor}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
          animationDuration={400}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
