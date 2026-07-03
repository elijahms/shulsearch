'use client'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function AppSidebarFooter() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // Standard next-themes hydration guard (avoid SSR/client theme mismatch).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          tooltip={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun /> : <Moon />}
          <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        {/* Static profile for now — wired to Firebase Auth (Google admin) in Plan 06. */}
        <SidebarMenuButton size="lg" tooltip="Admin" className="cursor-default">
          <Avatar className="size-7 rounded-md">
            <AvatarFallback className="rounded-md bg-primary text-xs text-primary-foreground">A</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">Admin</span>
            <span className="truncate text-xs text-muted-foreground">Signed in</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
