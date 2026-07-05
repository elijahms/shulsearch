'use client'
import { DenominationCategory, DenominationSubtype, type DenominationCategoryT, type DenominationSubtypeT } from '@/lib/shuls/schema'
import { SchoolType, Gender, type SchoolTypeT, type GenderT } from '@/lib/schools/schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const NO_SUBTYPE = '__none__'

export interface SchoolFields {
  schoolType?: SchoolTypeT
  gender?: GenderT
  category?: DenominationCategoryT
  subtype?: DenominationSubtypeT
}

export function SchoolFieldsEditor({
  value,
  onChange,
  disabled,
}: {
  value: SchoolFields
  onChange: (v: SchoolFields) => void
  disabled?: boolean
}) {
  const set = (patch: Partial<SchoolFields>) => onChange({ ...value, ...patch })
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={value.schoolType ?? ''} onValueChange={(v) => set({ schoolType: v as SchoolTypeT })} disabled={disabled}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>{SchoolType.options.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={value.gender ?? ''} onValueChange={(v) => set({ gender: v as GenderT })} disabled={disabled}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Gender" /></SelectTrigger>
        <SelectContent>{Gender.options.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={value.category ?? ''} onValueChange={(v) => set({ category: v as DenominationCategoryT })} disabled={disabled}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>{DenominationCategory.options.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={value.subtype ?? NO_SUBTYPE} onValueChange={(v) => set({ subtype: v === NO_SUBTYPE ? undefined : (v as DenominationSubtypeT) })} disabled={disabled}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Hashkafa (optional)" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_SUBTYPE}>No hashkafa</SelectItem>
          {DenominationSubtype.options.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
