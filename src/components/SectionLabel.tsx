export function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[var(--accent)] text-xs">$</span>
      <span className="text-[var(--fg-dim)] text-xs uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <span className="flex-1 border-t border-dashed border-[var(--border)]" />
    </div>
  );
}
