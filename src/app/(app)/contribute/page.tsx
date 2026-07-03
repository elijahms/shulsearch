import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddShulForm } from '@/components/contribute/add-shul-form'
import { DisputeForm } from '@/components/contribute/dispute-form'

export const metadata = {
  title: 'Contribute · ShulSearch',
  description: 'Add a missing shul or report a problem with an existing listing.',
}

export default function ContributePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-10">
        <header className="space-y-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Contribute</h1>
          <p className="text-sm text-muted-foreground">
            Help keep ShulSearch accurate. Add a shul we’re missing, or report a problem with an
            existing listing. Every submission is reviewed before it goes live.
          </p>
        </header>

        <Tabs defaultValue="add" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="add">Add a shul</TabsTrigger>
            <TabsTrigger value="report">Report / dispute</TabsTrigger>
          </TabsList>
          <TabsContent value="add" className="mt-4">
            <AddShulForm />
          </TabsContent>
          <TabsContent value="report" className="mt-4">
            <DisputeForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
