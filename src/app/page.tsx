import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Meridian Dashboard</h1>
      <p className="mt-2 text-foreground/70">
        Read-only operations view over Meridian&apos;s MCP server.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/renewal-risk"
          className="inline-block rounded-md border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
        >
          Renewal Risk Portfolio →
        </Link>
        <Link
          href="/incidents"
          className="inline-block rounded-md border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
        >
          Incidents →
        </Link>
      </div>
    </div>
  );
}
