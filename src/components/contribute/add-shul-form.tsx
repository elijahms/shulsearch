'use client'
import * as React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { submitContribution } from '@/lib/submissions/client'
import {
  buildNewSubmission,
  emptyNewValues,
  type FieldErrors,
  type NewShulFormValues,
} from './build'
import { Field, SelectField, TextField } from './fields'
import { categoryOptions, metroGroups, subtypeOptions } from './options'

export function AddShulForm() {
  const [values, setValues] = useState<NewShulFormValues>(emptyNewValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof NewShulFormValues>(key: K) {
    return (value: string) => setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = buildNewSubmission(values)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await submitContribution(result.submission)
      toast.success('Thanks! Your shul was submitted for review.')
      setValues(emptyNewValues)
    } catch {
      toast.error('Something went wrong submitting. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a shul</CardTitle>
        <CardDescription>
          Know a shul we’re missing? Add what you can — a moderator reviews every submission before
          it goes live.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Name" htmlFor="new-name" required error={errors.name}>
            <TextField
              id="new-name"
              value={values.name}
              onChange={set('name')}
              error={errors.name}
              placeholder="Congregation Beth Shalom"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Metro" htmlFor="new-metro">
              <SelectField
                id="new-metro"
                value={values.metro}
                onValueChange={set('metro')}
                placeholder="Select a metro"
                groups={metroGroups}
              />
            </Field>
            <Field label="Denomination" htmlFor="new-denom">
              <SelectField
                id="new-denom"
                value={values.denominationCategory}
                onValueChange={set('denominationCategory')}
                placeholder="Select denomination"
                options={categoryOptions}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subtype" htmlFor="new-subtype" hint="Optional — e.g. Modern Orthodox, Chabad">
              <SelectField
                id="new-subtype"
                value={values.denominationSubtype}
                onValueChange={set('denominationSubtype')}
                placeholder="Optional"
                options={subtypeOptions}
              />
            </Field>
            <Field label="Website" htmlFor="new-website">
              <TextField
                id="new-website"
                type="url"
                value={values.website}
                onChange={set('website')}
                placeholder="https://"
              />
            </Field>
          </div>

          <Field label="Address" htmlFor="new-address">
            <TextField
              id="new-address"
              value={values.address}
              onChange={set('address')}
              placeholder="123 Main St"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" htmlFor="new-city">
              <TextField id="new-city" value={values.city} onChange={set('city')} />
            </Field>
            <Field label="State" htmlFor="new-state">
              <TextField id="new-state" value={values.state} onChange={set('state')} placeholder="NJ" />
            </Field>
            <Field label="ZIP" htmlFor="new-zip">
              <TextField id="new-zip" value={values.zip} onChange={set('zip')} />
            </Field>
          </div>

          <Field label="Phone" htmlFor="new-phone">
            <TextField id="new-phone" type="tel" value={values.phone} onChange={set('phone')} />
          </Field>

          <Field
            label="Note"
            htmlFor="new-note"
            hint="Anything else a moderator should know (optional)."
          >
            <Textarea
              id="new-note"
              value={values.note}
              onChange={(e) => set('note')(e.target.value)}
              rows={3}
              placeholder="How do you know this shul?"
            />
          </Field>

          <Field
            label="Your email"
            htmlFor="new-email"
            hint="Optional — so we can follow up if we have questions."
            error={errors.submitterEmail}
          >
            <TextField
              id="new-email"
              type="email"
              value={values.submitterEmail}
              onChange={set('submitterEmail')}
              error={errors.submitterEmail}
              placeholder="you@example.com"
            />
          </Field>

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit shul'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
