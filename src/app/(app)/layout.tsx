import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-svh flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-none">Find a shul</h1>
            <p className="mt-1 hidden truncate text-xs text-muted-foreground sm:block">
              Homes within a walk of shul — choose a metro to explore
            </p>
          </div>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
