import type { Metadata } from 'next'
import { getMetro } from '@/lib/metros'
import { MetroShowcase } from '@/components/metro/metro-showcase'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const metro = getMetro(id)
  if (!metro) return { title: 'Community · ShulSearch' }
  return {
    title: `${metro.name}, ${metro.state} · ShulSearch`,
    description: `Cost of living, taxes, and Jewish-community facts for ${metro.name}, ${metro.state} — plus homes within a walk of shul.`,
  }
}

export default async function MetroDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <MetroShowcase id={id} />
}
