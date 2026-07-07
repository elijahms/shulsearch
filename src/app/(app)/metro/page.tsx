import { METROS } from '@/lib/metros'
import { getMetroFacts } from '@/lib/metros/facts'
import { metroTheme } from '@/lib/metros/theme'
import { MetroCard } from '@/components/metro/metro-card'
import { SectionHead } from '@/components/metro/section-head'

export const metadata = {
  title: 'Communities · ShulSearch',
  description: 'Explore Jewish communities by cost of living, taxes, and population — then find a home within a walk of shul.',
}

const TIERS = [
  { tier: 1 as const, label: 'Established communities', delay: 'ql-d2' },
  { tier: 2 as const, label: 'Growing communities', delay: 'ql-d3' },
]

export default function CommunitiesPage() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-12 sm:px-10 md:pt-16">
        <header className="ql-fade ql-d1 max-w-2xl">
          <h1 className="font-serif text-[clamp(2.5rem,6vw,3.75rem)] font-light leading-none tracking-[-0.02em]">
            Communities
          </h1>
          <p className="mt-5 max-w-[46ch] font-serif text-lg font-light italic leading-normal text-foreground/70">
            Every launch metro at a glance — Jewish population, home prices, and taxes — then
            homes within a walk of shul.
          </p>
        </header>

        {TIERS.map(({ tier, label, delay }) => {
          const metros = METROS.filter((m) => m.tier === tier)
          return (
            <section key={tier} className={`ql-fade ${delay} mt-16 md:mt-20`}>
              <SectionHead title={label} note={`${metros.length} metros`} />
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {metros.map((m) => (
                  <MetroCard
                    key={m.id}
                    metro={m}
                    facts={getMetroFacts(m.id)}
                    theme={metroTheme(m.id)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
