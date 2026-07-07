import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col">
        {/* Quiet chrome bar — hairline-ruled, wordmark on mobile, strapline on desktop. */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
          <SidebarTrigger className="-ml-1 md:hidden" />
          <span className="font-serif text-[1.05rem] font-medium leading-none md:hidden">
            Shul<span className="text-primary">Search</span>
          </span>
          <p className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground md:block">
            Homes within a walk of shul
          </p>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
