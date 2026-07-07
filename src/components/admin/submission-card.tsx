'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ShulPayloadT } from '@/lib/submissions/schema'
import { adminFetch, getShulById, type AdminSubmission, type ShulWithId } from './api'

const FIELDS: { key: keyof ShulPayloadT; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'denominationCategory', label: 'Denomination' },
  { key: 'denominationSubtype', label: 'Subtype' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'metro', label: 'Metro' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'ZIP' },
  { key: 'phone', label: 'Phone' },
  { key: 'website', label: 'Website' },
  { key: 'lat', label: 'Lat' },
  { key: 'lng', label: 'Lng' },
]

/** Small-caps type marker — color, not fill. Accent for new, muted for edits, red for disputes. */
const TYPE_CLASS = {
  new: 'text-primary',
  edit: 'text-muted-foreground',
  dispute: 'text-destructive',
} as const

function currentValue(shul: ShulWithId, key: keyof ShulPayloadT): unknown {
  if (key === 'denominationCategory') return shul.denomination?.category
  if (key === 'denominationSubtype') return shul.denomination?.subtype
  return (shul as Record<string, unknown>)[key]
}

function show(v: unknown): string {
  if (v === undefined || v === null || v === '') return '—'
  return String(v)
}

export function SubmissionCard({
  submission,
  onResolved,
}: {
  submission: AdminSubmission
  onResolved: (id: string) => void
}) {
  const isEdit = submission.type !== 'new' && !!submission.targetShulId
  const [current, setCurrent] = useState<ShulWithId | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isEdit || !submission.targetShulId) return
    let active = true
    void getShulById(submission.targetShulId)
      .then((s) => {
        if (active) setCurrent(s)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [isEdit, submission.targetShulId])

  async function resolve(action: 'approve' | 'reject') {
    setBusy(true)
    try {
      const res = await adminFetch(`/api/admin/submissions/${submission.id}`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
      toast.success(action === 'approve' ? 'Submission approved' : 'Submission rejected')
      onResolved(submission.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
      setBusy(false)
    }
  }

  const rows = FIELDS.filter(({ key }) => submission.payload[key] !== undefined)

  return (
    <article className="border border-border bg-card">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-4">
        <h3 className="flex items-baseline gap-3">
          <span
            className={cn(
              'text-[10px] font-semibold uppercase tracking-[0.16em]',
              TYPE_CLASS[submission.type],
            )}
          >
            {submission.type}
          </span>
          <span className="font-serif text-xl font-light tracking-[-0.01em]">
            {submission.payload.name ?? current?.name ?? 'Submission'}
          </span>
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {submission.submitterEmail || 'anonymous'}
          {submission.createdAt ? ` · ${new Date(submission.createdAt).toLocaleDateString()}` : ''}
        </span>
      </header>

      <div className="space-y-3 px-5 py-4">
        {isEdit ? (
          <p className="text-xs text-muted-foreground">
            Target shul:{' '}
            <code className="rounded-[2px] bg-muted px-1">{submission.targetShulId}</code>
          </p>
        ) : null}

        <div className="border border-border text-sm">
          <div className="grid grid-cols-[8rem_1fr_1fr] gap-x-3 border-b border-border px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <span>Field</span>
            <span>{isEdit ? 'Current' : 'Value'}</span>
            <span>{isEdit ? 'Proposed' : ''}</span>
          </div>
          {rows.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground">No fields provided.</div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map(({ key, label }) => {
                const proposed = submission.payload[key]
                const cur = current ? currentValue(current, key) : undefined
                const changed = isEdit && String(cur ?? '') !== String(proposed ?? '')
                return (
                  <div key={key} className="grid grid-cols-[8rem_1fr_1fr] gap-x-3 px-3 py-1.5">
                    <span className="text-muted-foreground">{label}</span>
                    {isEdit ? (
                      <>
                        <span className={changed ? 'text-muted-foreground line-through' : ''}>
                          {show(cur)}
                        </span>
                        <span className={changed ? 'font-medium text-foreground' : ''}>
                          {show(proposed)}
                        </span>
                      </>
                    ) : (
                      <span className="col-span-2">{show(proposed)}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {submission.note ? (
          <p className="text-sm">
            <span className="text-muted-foreground">Note: </span>
            {submission.note}
          </p>
        ) : null}
      </div>

      <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          disabled={busy}
          onClick={() => void resolve('reject')}
        >
          <X />
          Reject
        </Button>
        <Button size="sm" disabled={busy} onClick={() => void resolve('approve')}>
          <Check />
          Approve
        </Button>
      </footer>
    </article>
  )
}
