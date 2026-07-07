'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Home,
  PlusCircle,
  MapPin,
  Building2,
  Inbox,
  ListChecks,
  ChartNoAxesColumn,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { onAuthChange, isAdminEmail } from '@/lib/auth/client'
import { AppSidebarFooter } from './app-sidebar-footer'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  /** Match this route exactly (for parents like /admin whose children have their own entries). */
  exact?: boolean
}

const MAIN: NavItem[] = [
  { title: 'Search', href: '/', icon: Home, exact: true },
  { title: 'Communities', href: '/metro', icon: Building2 },
  { title: 'Contribute', href: '/contribute', icon: PlusCircle },
]

const ADMIN: NavItem[] = [
  { title: 'Moderation', href: '/admin', icon: Inbox, exact: true },
  { title: 'Curation', href: '/admin/curation', icon: ListChecks },
  { title: 'Schools', href: '/admin/schools', icon: GraduationCap },
  { title: 'Analytics', href: '/admin/analytics', icon: ChartNoAxesColumn },
]

function NavGroup({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={active}
                  className="data-active:bg-transparent data-active:text-primary"
                  render={<Link href={item.href} aria-current={active ? 'page' : undefined} />}
                >
                  <item.icon strokeWidth={1.75} />
                  <span>{item.title}</span>
                  {active && (
                    <span
                      className="ml-auto size-[5px] shrink-0 rounded-full bg-primary group-data-[collapsible=icon]:hidden"
                      aria-hidden
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  // Null outside the app router (e.g. unit tests) — treat as "nothing active".
  const pathname = usePathname() ?? ''
  const [admin, setAdmin] = useState(false)

  // onAuthChange fires asynchronously, so setAdmin here is not a synchronous set-state-in-effect.
  useEffect(() => {
    try {
      return onAuthChange((u) => setAdmin(isAdminEmail(u?.email)))
    } catch {
      // Firebase auth unavailable (e.g. test env) — keep the admin group hidden.
    }
  }, [])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-2">
          {/* Quiet mark — hairline box, accent glyph. Survives icon-collapsed mode. */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[2px] border border-border bg-card text-primary">
            <MapPin className="size-4" strokeWidth={1.75} />
          </div>
          <div className="grid group-data-[collapsible=icon]:hidden">
            <span className="font-serif text-[1.05rem] font-medium leading-none">
              Shul<span className="text-primary">Search</span>
            </span>
            <span className="mt-1.5 text-[10px] uppercase leading-none tracking-[0.14em] text-muted-foreground">
              Near your shul
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Main" items={MAIN} pathname={pathname} />
        {admin && <NavGroup label="Admin" items={ADMIN} pathname={pathname} />}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <AppSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
