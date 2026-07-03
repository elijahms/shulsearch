'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

const TYPE_VARIANT = {
  new: 'default',
  edit: 'secondary',
  dispute: 'destructive',
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
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Badge variant={TYPE_VARIANT[submission.type]}>{submission.type}</Badge>
          <span>{submission.payload.name ?? current?.name ?? 'Submission'}</span>
        </CardTitle>
        <span className="text-xs text-muted-foreground">
          {submission.submitterEmail || 'anonymous'}
          {submission.createdAt ? ` · ${new Date(submission.createdAt).toLocaleDateString()}` : ''}
        </span>
      </CardHeader>

      <CardContent className="space-y-2">
        {isEdit ? (
          <p className="text-xs text-muted-foreground">
            Target shul: <code className="rounded bg-muted px-1">{submission.targetShulId}</code>
          </p>
        ) : null}

        <div className="overflow-hidden rounded-lg border text-sm">
          <div className="grid grid-cols-[8rem_1fr_1fr] gap-x-3 border-b bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span>Field</span>
            <span>{isEdit ? 'Current' : 'Value'}</span>
            <span>{isEdit ? 'Proposed' : ''}</span>
          </div>
          {rows.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground">No fields provided.</div>
          ) : (
            rows.map(({ key, label }) => {
              const proposed = submission.payload[key]
              const cur = current ? currentValue(current, key) : undefined
              const changed = isEdit && String(cur ?? '') !== String(proposed ?? '')
              return (
                <div
                  key={key}
                  className="grid grid-cols-[8rem_1fr_1fr] gap-x-3 px-3 py-1.5 not-last:border-b"
                >
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
            })
          )}
        </div>

        {submission.note ? (
          <p className="text-sm">
            <span className="text-muted-foreground">Note: </span>
            {submission.note}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="destructive" size="sm" disabled={busy} onClick={() => void resolve('reject')}>
          <X />
          Reject
        </Button>
        <Button size="sm" disabled={busy} onClick={() => void resolve('approve')}>
          <Check />
          Approve
        </Button>
      </CardFooter>
    </Card>
  )
}
