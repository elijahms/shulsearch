'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  Moon,
  Sun,
  LogIn,
  LogOut,
  ShieldCheck,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  onAuthChange,
  signInWithGoogle,
  signOutUser,
  isAdminEmail,
  type User,
} from '@/lib/auth/client'

export function AppSidebarFooter() {
  const { resolvedTheme, setTheme } = useTheme()
  const { state, toggleSidebar, isMobile } = useSidebar()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // Mount guard (theme + auth are client-only). onAuthChange fires asynchronously,
  // so setUser inside its callback is not a synchronous set-state-in-effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    try {
      return onAuthChange(setUser)
    } catch {
      // Firebase auth unavailable (e.g. missing config in a test env) — stay signed out.
    }
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'
  const collapsed = state === 'collapsed'

  async function handleSignIn() {
    try {
      await signInWithGoogle()
    } catch {
      toast.error('Sign-in failed. Please try again.')
    }
  }

  async function handleSignOut() {
    try {
      await signOutUser()
      toast.success('Signed out')
    } catch {
      toast.error('Could not sign out.')
    }
  }

  const displayName = user?.displayName || user?.email || 'Account'
  const initial = (user?.displayName || user?.email || '?').charAt(0).toUpperCase()
  const admin = isAdminEmail(user?.email)

  return (
    <SidebarMenu>
      {/* Profile row first (mirrors the reference), then the quiet utility rows. */}
      {!mounted ? (
        // Neutral placeholder keeps SSR/first-client render identical (no auth on the server).
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default">
            <Avatar className="size-7">
              <AvatarFallback className="bg-muted text-xs">·</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium text-muted-foreground">Account</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : user ? (
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
              <Avatar className="size-7">
                {user.photoURL ? (
                  <AvatarImage src={user.photoURL} alt={displayName} />
                ) : null}
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                {user.email ? (
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                ) : null}
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" sideOffset={8} className="min-w-56">
              <DropdownMenuLabel>
                <div className="grid text-left leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  {user.email ? (
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  ) : null}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {admin ? (
                <DropdownMenuItem render={<Link href="/admin" />}>
                  <ShieldCheck />
                  Admin
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      ) : (
        <SidebarMenuItem>
          <SidebarMenuButton onClick={handleSignIn} tooltip="Sign in with Google">
            <LogIn />
            <span>Sign in</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          tooltip={isDark ? 'Light mode' : 'Dark mode'}
          className="text-muted-foreground"
        >
          {isDark ? <Sun /> : <Moon />}
          <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Collapse lives with the other chrome controls, like the reference. Hidden on mobile
          (the sheet has its own dismissal). */}
      {!isMobile && (
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={toggleSidebar}
            tooltip={collapsed ? 'Expand' : 'Collapse'}
            className="text-muted-foreground"
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            <span>{collapsed ? 'Expand' : 'Collapse'}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  )
}
