export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 animate-pulse">
      <div className="h-7 w-48 rounded bg-black/10 dark:bg-white/10" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-black/5 dark:bg-white/5" />
        ))}
      </div>
    </div>
  );
}
