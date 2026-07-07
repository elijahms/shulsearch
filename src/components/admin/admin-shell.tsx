'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { Loader2, LogIn } from 'lucide-react'
import { onAuthChange, signInWithGoogle, isAdminEmail, type User } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Moderation' },
  { href: '/admin/curation', label: 'Curation' },
  { href: '/admin/schools', label: 'Schools' },
  { href: '/admin/analytics', label: 'Analytics' },
]

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex h-full items-center justify-center p-6">{children}</div>
}

/** Quiet typographic auth-gate screen: eyebrow, serif title, muted body. */
function Gate({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ql-fade ql-d1 flex max-w-sm flex-col items-center gap-3 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        ShulSearch · Admin
      </p>
      <h2 className="font-serif text-3xl font-light tracking-[-0.01em]">{title}</h2>
      {children}
    </div>
  )
}

/** Client auth gate + admin sub-nav. Renders children only for an allowlisted admin. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      return onAuthChange((u) => {
        setUser(u)
        setReady(true)
      })
    } catch {
      // Firebase auth unavailable — surface the sign-in prompt rather than crashing.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true)
    }
  }, [])

  if (!ready) {
    return (
      <Centered>
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </Centered>
    )
  }

  if (!user) {
    return (
      <Centered>
        <Gate title="Admin access">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sign in with Google to access admin.
          </p>
          <Button className="mt-2" onClick={() => void signInWithGoogle()}>
            <LogIn />
            Sign in with Google
          </Button>
        </Gate>
      </Centered>
    )
  }

  if (!isAdminEmail(user.email)) {
    return (
      <Centered>
        <Gate title="Not authorized">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {user.email ?? 'This account'} is not an admin.
          </p>
        </Gate>
      </Centered>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Back-office sub-nav — small caps, hairline underline marks the active page. */}
      <nav className="flex shrink-0 items-stretch gap-6 overflow-x-auto border-b border-border px-4 sm:px-6">
        <span className="shrink-0 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em]">
          Admin
        </span>
        <span className="my-3.5 w-px shrink-0 bg-border" aria-hidden />
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'shrink-0 whitespace-nowrap border-b py-3.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-colors',
                active
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6">{children}</div>
    </div>
  )
}
