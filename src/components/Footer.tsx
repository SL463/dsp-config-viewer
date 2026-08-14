export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-xs text-faint sm:px-6">
        <p>
          DSP Tune Viewer — reads Audiotec Fischer PC-Tool 6 (.pct6) tunes and pct6-tune JSON.
        </p>
        <p>
          Modeled EQ/crossover curves are for visualization. Not affiliated with or endorsed by
          Audiotec Fischer; product names are trademarks of their respective owners.
        </p>
      </div>
    </footer>
  );
}
