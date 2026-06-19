type Props = {
  analysis: string | null;
  suggestion: string | null;
  loading: boolean;
  error: string | null;
};

export function ExplanationCard({ analysis, suggestion, loading, error }: Props) {
  return (
    <div className="font-mono text-sm space-y-4">
      {loading && (
        <div className="flex items-center gap-2 text-[var(--fg-dim)] text-xs uppercase tracking-widest">
          <span className="w-3 h-3 border-2 border-[var(--accent-dim)] border-t-[var(--accent)] rounded-full animate-spin" />
          Analyzing results...
        </div>
      )}

      {!loading && error && (
        <p className="text-[var(--danger)] text-xs">ERR: {error}</p>
      )}

      {!loading && !error && analysis && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-[var(--fg-dim)] text-sm leading-relaxed">{analysis}</p>

          {suggestion && (
            <div className="border-t border-[var(--border)] pt-4">
              <p className="text-[var(--fg-faint)] text-xs uppercase tracking-widest mb-2">
                &gt; Suggestion
              </p>
              <p className="text-[var(--accent)] text-sm leading-relaxed">{suggestion}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
