/**
 * Quiet Luxe section header — a small-caps letter-spaced eyebrow (with an optional
 * right-aligned note) over a full-ink hairline rule. Shared by the showcase sections.
 */
export function SectionHead({ title, note }: { title: string; note?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </h2>
        {note && (
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{note}</p>
        )}
      </div>
      <div className="mt-3.5 border-t border-foreground/90" aria-hidden />
    </div>
  )
}
