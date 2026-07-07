'use client'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getShulsByMetro, type ShulDoc } from '@/lib/shuls/queries'
import { submitContribution } from '@/lib/submissions/client'
import {
  buildDisputeSubmission,
  emptyDisputeValues,
  type DisputeFormValues,
  type FieldErrors,
  type Opt,
} from './build'
import { Field, FormSection, SelectField, TextField } from './fields'
import { categoryOptions, metroGroups, subtypeOptions } from './options'

export function DisputeForm() {
  const [metroId, setMetroId] = useState('')
  const [shuls, setShuls] = useState<ShulDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState<DisputeFormValues>(emptyDisputeValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!metroId) return
    let alive = true
    // Show the loading state immediately when the metro changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getShulsByMetro(metroId)
      .then((rows) => {
        if (!alive) return
        setShuls([...rows].sort((a, b) => a.name.localeCompare(b.name)))
        setLoading(false)
      })
      .catch(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [metroId])

  const shulOptions = useMemo<Opt[]>(
    () => shuls.map((s) => ({ value: s.id, label: s.name })),
    [shuls],
  )

  function set<K extends keyof DisputeFormValues>(key: K) {
    return (value: string) => setValues((prev) => ({ ...prev, [key]: value }))
  }

  function onMetroChange(id: string) {
    setMetroId(id)
    // Reset the shul selection + proposed fields, but keep what the user already typed.
    setValues((prev) => ({ ...emptyDisputeValues, note: prev.note, submitterEmail: prev.submitterEmail }))
    setErrors({})
  }

  function onShulChange(id: string) {
    const shul = shuls.find((s) => s.id === id)
    // Prefill the proposed-correction fields from the current listing so users edit in place.
    setValues((prev) => ({
      ...prev,
      targetShulId: id,
      name: shul?.name ?? '',
      denominationCategory: shul?.denomination.category ?? '',
      denominationSubtype: shul?.denomination.subtype ?? '',
      address: shul?.address ?? '',
      website: shul?.website ?? '',
      phone: shul?.phone ?? '',
    }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = buildDisputeSubmission(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await submitContribution(result.submission)
      toast.success('Thanks! Your report was submitted for review.')
      setValues(emptyDisputeValues)
      setMetroId('')
      setShuls([])
    } catch {
      toast.error('Something went wrong submitting. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const shulPlaceholder = !metroId
    ? 'Pick a metro first'
    : loading
      ? 'Loading shuls…'
      : shuls.length
        ? 'Select a shul'
        : 'No shuls found'

  return (
    <div>
      <p className="max-w-[54ch] text-sm leading-relaxed text-muted-foreground">
        Spot something wrong — a closed shul, a bad address, the wrong denomination? Let us know
        and suggest a fix.
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-8" noValidate>
        <FormSection label="The listing">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Metro" htmlFor="dispute-metro">
              <SelectField
                id="dispute-metro"
                value={metroId}
                onValueChange={onMetroChange}
                placeholder="Select a metro"
                groups={metroGroups}
              />
            </Field>
            <Field label="Shul" htmlFor="dispute-shul" error={errors.targetShulId}>
              <SelectField
                id="dispute-shul"
                value={values.targetShulId}
                onValueChange={onShulChange}
                placeholder={shulPlaceholder}
                options={shulOptions}
                disabled={!metroId || loading || shuls.length === 0}
                error={errors.targetShulId}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection label="The problem">
          <Field
            label="What’s wrong?"
            htmlFor="dispute-note"
            required
            error={errors.note}
            hint="Describe the problem — closed, moved, wrong denomination, duplicate, etc."
          >
            <Textarea
              id="dispute-note"
              value={values.note}
              onChange={(e) => set('note')(e.target.value)}
              rows={3}
              aria-invalid={errors.note ? true : undefined}
              placeholder="This shul closed in 2022."
            />
          </Field>
        </FormSection>

        <FormSection
          label="Proposed corrections"
          note="Optional"
          description="Edit any field that should change. Prefilled from the current listing."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="dispute-name">
              <TextField id="dispute-name" value={values.name} onChange={set('name')} />
            </Field>
            <Field label="Website" htmlFor="dispute-website">
              <TextField
                id="dispute-website"
                type="url"
                value={values.website}
                onChange={set('website')}
                placeholder="https://"
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Denomination" htmlFor="dispute-denom">
              <SelectField
                id="dispute-denom"
                value={values.denominationCategory}
                onValueChange={set('denominationCategory')}
                placeholder="Select denomination"
                options={categoryOptions}
              />
            </Field>
            <Field label="Subtype" htmlFor="dispute-subtype">
              <SelectField
                id="dispute-subtype"
                value={values.denominationSubtype}
                onValueChange={set('denominationSubtype')}
                placeholder="Optional"
                options={subtypeOptions}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Address" htmlFor="dispute-address">
              <TextField id="dispute-address" value={values.address} onChange={set('address')} />
            </Field>
            <Field label="Phone" htmlFor="dispute-phone">
              <TextField id="dispute-phone" type="tel" value={values.phone} onChange={set('phone')} />
            </Field>
          </div>
        </FormSection>

        <FormSection label="Follow-up">
          <Field
            label="Your email"
            htmlFor="dispute-email"
            hint="Optional — so we can follow up."
            error={errors.submitterEmail}
          >
            <TextField
              id="dispute-email"
              type="email"
              value={values.submitterEmail}
              onChange={set('submitterEmail')}
              error={errors.submitterEmail}
              placeholder="you@example.com"
            />
          </Field>
        </FormSection>

        <div className="flex justify-end border-t border-border pt-6">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit report'}
          </Button>
        </div>
      </form>
    </div>
  )
}
