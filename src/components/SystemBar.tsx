"use client";

import { useEffect, useState } from "react";

export function SystemBar() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full border-b border-[var(--border)] bg-[var(--bg-panel)]">
      <div className="max-w-2xl mx-auto px-4 py-1.5 flex items-center justify-between text-[10px] uppercase tracking-widest text-[var(--fg-faint)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] dot-pulse" />
            system_online
          </span>
          <span className="hidden sm:inline">data:coingecko</span>
          <span className="hidden sm:inline">engine:groq</span>
        </div>
        <span className="text-[var(--fg-dim)]">{time || "--:--:--"}</span>
      </div>
    </div>
  );
}
