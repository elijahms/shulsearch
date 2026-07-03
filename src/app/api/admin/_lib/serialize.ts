import 'server-only'

/** Convert top-level Firestore Timestamps to ISO strings so docs are JSON-safe for the client. */
export function serialize(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && typeof (v as { toDate?: unknown }).toDate === 'function') {
      out[k] = (v as { toDate(): Date }).toDate().toISOString()
    } else {
      out[k] = v
    }
  }
  return out
}
