'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, MapPin, Building2 } from 'lucide-react'
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
import { AppSidebarFooter } from './app-sidebar-footer'

const NAV = [
  { title: 'Search', href: '/', icon: Home },
  { title: 'Communities', href: '/metro', icon: Building2 },
  { title: 'Contribute', href: '/contribute', icon: PlusCircle },
]

export function AppSidebar() {
  // Null outside the app router (e.g. unit tests) — treat as "nothing active".
  const pathname = usePathname() ?? ''
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
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
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Explore
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={active}
                      className="data-active:bg-transparent data-active:text-primary"
                      render={
                        <Link href={item.href} aria-current={active ? 'page' : undefined} />
                      }
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <AppSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
