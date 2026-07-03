import { METROS } from '@/lib/metros'
import { DenominationCategory, DenominationSubtype } from '@/lib/shuls/schema'
import type { Opt, OptGroup } from './build'

export const metroGroups: OptGroup[] = [
  {
    label: 'Established communities',
    options: METROS.filter((m) => m.tier === 1).map((m) => ({
      value: m.id,
      label: `${m.name}, ${m.state}`,
    })),
  },
  {
    label: 'Growing communities',
    options: METROS.filter((m) => m.tier === 2).map((m) => ({
      value: m.id,
      label: `${m.name}, ${m.state}`,
    })),
  },
]

export const categoryOptions: Opt[] = DenominationCategory.options.map((c) => ({
  value: c,
  label: c,
}))

export const subtypeOptions: Opt[] = [
  { value: '', label: 'None' },
  ...DenominationSubtype.options.map((s) => ({ value: s, label: s })),
]
