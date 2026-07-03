'use client'
import {
  DenominationCategory,
  DenominationSubtype,
  type DenominationCategoryT,
  type DenominationSubtypeT,
} from '@/lib/shuls/schema'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORIES = DenominationCategory.options
const SUBTYPES = DenominationSubtype.options
const NO_SUBTYPE = '__none__'

export function DenominationEditor({
  category,
  subtype,
  onCategory,
  onSubtype,
  disabled,
}: {
  category: DenominationCategoryT | undefined
  subtype: DenominationSubtypeT | undefined
  onCategory: (v: DenominationCategoryT) => void
  onSubtype: (v: DenominationSubtypeT | undefined) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={category ?? ''}
        onValueChange={(v) => onCategory(v as DenominationCategoryT)}
        disabled={disabled}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={subtype ?? NO_SUBTYPE}
        onValueChange={(v) => onSubtype(v === NO_SUBTYPE ? undefined : (v as DenominationSubtypeT))}
        disabled={disabled}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Subtype (optional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_SUBTYPE}>No subtype</SelectItem>
          {SUBTYPES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
