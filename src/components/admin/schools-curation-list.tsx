'use client'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminFetch, type SchoolWithId } from './api'
import { SchoolFieldsEditor, type SchoolFields } from './school-fields-editor'

function Row({ school, onDone }: { school: SchoolWithId; onDone: (id: string) => void }) {
  const [fields, setFields] = useState<SchoolFields>({
    schoolType: school.schoolType,
    gender: school.gender,
    category: school.denomination?.category,
    subtype: school.denomination?.subtype,
  })
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!fields.schoolType || !fields.gender || !fields.category) {
      toast.error('Choose type, gender, and category')
      return
    }
    setBusy(true)
    try {
      const res = await adminFetch(`/api/admin/schools/${school.id}`, {
        method: 'POST',
        body: JSON.stringify({
          schoolType: fields.schoolType,
          gender: fields.gender,
          denominationCategory: fields.category,
          denominationSubtype: fields.subtype,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
      toast.success(`Saved ${school.name}`)
      onDone(school.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{school.name}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {[school.address, school.city, school.state].filter(Boolean).join(', ') || school.metro}
          {' · '}current: {school.schoolType} · {school.gender} · {school.denomination?.subtype ?? school.denomination?.category ?? 'unknown'}
          {school.denomination?.confidence ? ` · ${school.denomination.confidence} confidence` : ''}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <SchoolFieldsEditor value={fields} onChange={setFields} disabled={busy} />
        <Button size="sm" disabled={busy} onClick={() => void save()}>
          {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          Save &amp; mark reviewed
        </Button>
      </CardContent>
    </Card>
  )
}

export function SchoolsCurationList() {
  const [items, setItems] = useState<SchoolWithId[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await adminFetch('/api/admin/schools/needs-review')
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      setItems((await res.json()) as SchoolWithId[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schools')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const onDone = useCallback((id: string) => {
    setItems((prev) => (prev ? prev.filter((s) => s.id !== id) : prev))
  }, [])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">School curation</h2>
        <p className="text-sm text-muted-foreground">
          Schools flagged for review. Confirm type, gender, and hashkafa to clear the flag.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : items === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          <CheckCircle2 className="size-6" />
          <p className="text-sm">Nothing needs review.</p>
        </div>
      ) : (
        items.map((s) => <Row key={s.id} school={s} onDone={onDone} />)
      )}
    </div>
  )
}
