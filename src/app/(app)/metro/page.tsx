import { METROS } from '@/lib/metros'
import { getMetroFacts } from '@/lib/metros/facts'
import { metroTheme } from '@/lib/metros/theme'
import { MetroCard } from '@/components/metro/metro-card'

export const metadata = {
  title: 'Communities · ShulSearch',
  description: 'Explore Jewish communities by cost of living, taxes, and population — then find a home within a walk of shul.',
}

const TIERS = [
  { tier: 1 as const, label: 'Established communities' },
  { tier: 2 as const, label: 'Growing communities' },
]

export default function CommunitiesPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-10">
        <header className="max-w-2xl space-y-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Communities</h1>
          <p className="text-sm text-muted-foreground">
            Every launch metro at a glance — Jewish population, home prices, and taxes. Pick a
            community to see the full picture, then search homes within a walk of shul.
          </p>
        </header>

        {TIERS.map(({ tier, label }) => (
          <section key={tier} className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {METROS.filter((m) => m.tier === tier).map((m) => (
                <MetroCard key={m.id} metro={m} facts={getMetroFacts(m.id)} theme={metroTheme(m.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
