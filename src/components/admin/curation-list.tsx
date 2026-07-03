'use client'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { DenominationCategoryT, DenominationSubtypeT } from '@/lib/shuls/schema'
import { adminFetch, type ShulWithId } from './api'
import { DenominationEditor } from './denomination-editor'

function CurationRow({ shul, onDone }: { shul: ShulWithId; onDone: (id: string) => void }) {
  const [category, setCategory] = useState<DenominationCategoryT | undefined>(
    shul.denomination?.category,
  )
  const [subtype, setSubtype] = useState<DenominationSubtypeT | undefined>(
    shul.denomination?.subtype,
  )
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!category) {
      toast.error('Choose a denomination category')
      return
    }
    setBusy(true)
    try {
      const res = await adminFetch(`/api/admin/shuls/${shul.id}`, {
        method: 'POST',
        body: JSON.stringify({ denominationCategory: category, denominationSubtype: subtype }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
      toast.success(`Saved ${shul.name}`)
      onDone(shul.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{shul.name}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {[shul.address, shul.city, shul.state].filter(Boolean).join(', ') || shul.metro}
          {' · '}
          current: {shul.denomination?.category ?? 'unknown'}
          {shul.denomination?.subtype ? ` (${shul.denomination.subtype})` : ''}
          {shul.denomination?.confidence ? ` · ${shul.denomination.confidence} confidence` : ''}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <DenominationEditor
          category={category}
          subtype={subtype}
          onCategory={setCategory}
          onSubtype={setSubtype}
          disabled={busy}
        />
        <Button size="sm" disabled={busy} onClick={() => void save()}>
          {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          Save &amp; mark reviewed
        </Button>
      </CardContent>
    </Card>
  )
}

export function CurationList() {
  const [items, setItems] = useState<ShulWithId[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await adminFetch('/api/admin/needs-review')
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      setItems((await res.json()) as ShulWithId[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shuls')
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
        <h2 className="text-lg font-semibold">Curation</h2>
        <p className="text-sm text-muted-foreground">
          Shuls flagged for review. Set a denomination to confirm and clear the flag.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : items === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          <CheckCircle2 className="size-6" />
          <p className="text-sm">Nothing needs review.</p>
        </div>
      ) : (
        items.map((s) => <CurationRow key={s.id} shul={s} onDone={onDone} />)
      )}
    </div>
  )
}
