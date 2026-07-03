'use client'
import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Opt, OptGroup } from './build'

/** Label + control + inline hint/error wrapper used by every field on the contribute page. */
export function Field({
  label,
  htmlFor,
  error,
  required,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        <span>{label}</span>
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/** Controlled text input that reports its raw string value. */
export function TextField({
  id,
  value,
  onChange,
  error,
  ...rest
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  error?: string
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'id'>) {
  return (
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error ? true : undefined}
      {...rest}
    />
  )
}

/** Controlled shadcn (Base UI) select over a flat option list or grouped options. */
export function SelectField({
  id,
  value,
  onValueChange,
  placeholder,
  options,
  groups,
  error,
  disabled,
}: {
  id?: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  options?: Opt[]
  groups?: OptGroup[]
  error?: string
  disabled?: boolean
}) {
  // `items` lets Base UI render the selected option's label (not its raw value) in the trigger.
  const items = groups ? groups.flatMap((g) => g.options) : (options ?? [])
  return (
    <Select
      items={items}
      value={value === '' ? null : value}
      onValueChange={(v) => onValueChange((v as string | null) ?? '')}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full" aria-invalid={error ? true : undefined}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {groups
          ? groups.map((g) => (
              <SelectGroup key={g.label}>
                <SelectLabel>{g.label}</SelectLabel>
                {g.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          : (options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
      </SelectContent>
    </Select>
  )
}
