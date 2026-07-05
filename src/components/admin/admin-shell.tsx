'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { Loader2, LogIn, ShieldAlert, ShieldCheck } from 'lucide-react'
import { onAuthChange, signInWithGoogle, isAdminEmail, type User } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Moderation' },
  { href: '/admin/curation', label: 'Curation' },
  { href: '/admin/analytics', label: 'Analytics' },
]

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex h-full items-center justify-center p-6">{children}</div>
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
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <ShieldCheck className="size-8 text-muted-foreground" />
          <h2 className="text-base font-semibold">Admin access</h2>
          <p className="text-sm text-muted-foreground">Sign in with Google to access admin.</p>
          <Button onClick={() => void signInWithGoogle()}>
            <LogIn />
            Sign in with Google
          </Button>
        </div>
      </Centered>
    )
  }

  if (!isAdminEmail(user.email)) {
    return (
      <Centered>
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <ShieldAlert className="size-8 text-destructive" />
          <h2 className="text-base font-semibold">Not authorized</h2>
          <p className="text-sm text-muted-foreground">
            {user.email ?? 'This account'} is not an admin.
          </p>
        </div>
      </Centered>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b px-4 py-2">
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Button
              key={item.href}
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              render={<Link href={item.href} />}
              className={cn(!active && 'text-muted-foreground')}
            >
              {item.label}
            </Button>
          )
        })}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  )
}
