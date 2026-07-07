import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

// Thinner rail than the shadcn default (16rem) — the chrome stays out of the way.
const SIDEBAR_STYLE = {
  '--sidebar-width': '13.5rem',
  '--sidebar-width-icon': '3rem',
} as React.CSSProperties

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider style={SIDEBAR_STYLE}>
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col">
        {/* Mobile-only chrome — on desktop every page carries its own heading. */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
          <SidebarTrigger className="-ml-1" />
          <span className="font-serif text-[1.05rem] font-medium leading-none">
            Shul<span className="text-primary">Search</span>
          </span>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
