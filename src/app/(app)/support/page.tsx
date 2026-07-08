import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Support · ShulSearch',
  description: 'Help keep ShulSearch free for families finding their next community.',
}

/**
 * Donations skeleton. Provider-agnostic: each tier links to whatever payment URL is
 * configured (Stripe Payment Link, Donorbox, PayPal…). Until the env vars are set,
 * the buttons render a quiet "opening soon" state so the page can ship first.
 *   NEXT_PUBLIC_DONATE_URL          — one-time gift link
 *   NEXT_PUBLIC_DONATE_MONTHLY_URL  — recurring gift link (optional)
 */
const COSTS = [
  { label: 'Listings data', detail: 'the daily refresh that keeps homes current in every metro' },
  { label: 'Maps & walk times', detail: 'geocoding and walking-route calculations for every search' },
  { label: 'Hosting', detail: 'servers, storage, and the database behind shuls and schools' },
]

function DonateTier({
  title,
  blurb,
  url,
  cta,
}: {
  title: string
  blurb: string
  url: string | undefined
  cta: string
}) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-6">
      <h2 className="font-serif text-xl font-light">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{blurb}</p>
      {url ? (
        <Button className="mt-6 w-full" render={<a href={url} target="_blank" rel="noopener noreferrer" />}>
          <Heart className="size-4" strokeWidth={1.75} />
          {cta}
        </Button>
      ) : (
        <Button className="mt-6 w-full" disabled>
          Donations open soon
        </Button>
      )}
    </div>
  )
}

export default function SupportPage() {
  const onceUrl = process.env.NEXT_PUBLIC_DONATE_URL
  const monthlyUrl = process.env.NEXT_PUBLIC_DONATE_MONTHLY_URL

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-2xl px-6 pb-24 pt-10 sm:px-8 md:pt-14">
        <header className="ql-fade ql-d1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Keep it running
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-[-0.01em]">Support ShulSearch</h1>
          <p className="mt-3 font-serif text-[1.05rem] font-light italic leading-normal text-foreground/70">
            Free for every family searching — paid for by the ones who already found home.
          </p>
          <p className="mt-4 max-w-[54ch] text-sm leading-relaxed text-muted-foreground">
            ShulSearch has no ads and sells nothing. Your gift covers the real costs of keeping the
            search accurate and free.
          </p>
        </header>

        <dl className="ql-fade ql-d2 mt-10 space-y-4 border-y border-border py-6">
          {COSTS.map((c) => (
            <div key={c.label} className="flex gap-4 text-sm">
              <dt className="w-36 shrink-0 font-medium">{c.label}</dt>
              <dd className="text-muted-foreground">{c.detail}</dd>
            </div>
          ))}
        </dl>

        <div className="ql-fade ql-d3 mt-10 grid gap-4 sm:grid-cols-2">
          <DonateTier
            title="One-time gift"
            blurb="Cover a day of listings data or a month of map searches — every amount helps."
            url={onceUrl}
            cta="Give once"
          />
          <DonateTier
            title="Monthly partner"
            blurb="Sustain the project month to month so the data never goes stale."
            url={monthlyUrl ?? onceUrl}
            cta="Give monthly"
          />
        </div>

        <p className="ql-fade ql-d4 mt-8 text-xs leading-relaxed text-muted-foreground">
          ShulSearch is an independent community project. Questions about supporting it?{' '}
          <a href="mailto:elijah@vistralai.com" className="underline underline-offset-2 hover:text-foreground">
            Get in touch
          </a>
          .
        </p>
      </div>
    </div>
  )
}
