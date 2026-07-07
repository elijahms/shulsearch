'use client'
import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { adminFetch, type AdminSubmission } from './api'
import { SubmissionCard } from './submission-card'

export function ModerationQueue() {
  const [items, setItems] = useState<AdminSubmission[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await adminFetch('/api/admin/submissions')
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      setItems((await res.json()) as AdminSubmission[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions')
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const onResolved = useCallback((id: string) => {
    setItems((prev) => (prev ? prev.filter((s) => s.id !== id) : prev))
  }, [])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-7">
      <header className="ql-fade ql-d1">
        <h2 className="font-serif text-3xl font-light tracking-[-0.01em]">Moderation queue</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Community submissions awaiting review. Approving writes to the live directory.
        </p>
      </header>

      <div className="ql-fade ql-d2 flex flex-col gap-5">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : items === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="border border-border px-8 py-16 text-center">
            <p className="font-serif text-lg font-light italic text-muted-foreground">
              No pending submissions.
            </p>
          </div>
        ) : (
          items.map((s) => <SubmissionCard key={s.id} submission={s} onResolved={onResolved} />)
        )}
      </div>
    </div>
  )
}
