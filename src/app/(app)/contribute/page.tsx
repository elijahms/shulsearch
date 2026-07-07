import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AddShulForm } from '@/components/contribute/add-shul-form'
import { DisputeForm } from '@/components/contribute/dispute-form'

export const metadata = {
  title: 'Contribute · ShulSearch',
  description: 'Add a missing shul or report a problem with an existing listing.',
}

/** Small-caps trigger restyled over the line variant — hairline underline marks the active tab. */
const triggerClass =
  'h-auto flex-none rounded-none px-0 pb-3.5 pt-0 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground data-active:text-foreground group-data-horizontal/tabs:after:-bottom-px group-data-horizontal/tabs:after:h-px'

export default function ContributePage() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-2xl px-6 pb-24 pt-10 sm:px-8 md:pt-14">
        <header className="ql-fade ql-d1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Community records
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-[-0.01em]">Contribute</h1>
          <p className="mt-3 font-serif text-[1.05rem] font-light italic leading-normal text-foreground/70">
            ShulSearch stays accurate because the people who know these communities keep it that
            way.
          </p>
          <p className="mt-4 max-w-[54ch] text-sm leading-relaxed text-muted-foreground">
            Add a shul we’re missing, or report a problem with an existing listing. Every
            submission is reviewed before it goes live.
          </p>
        </header>

        <Tabs defaultValue="add" className="ql-fade ql-d3 mt-10">
          <TabsList
            variant="line"
            className="w-full justify-start gap-8 border-b border-border p-0 group-data-horizontal/tabs:h-auto"
          >
            <TabsTrigger value="add" className={triggerClass}>
              Add a shul
            </TabsTrigger>
            <TabsTrigger value="report" className={triggerClass}>
              Report / dispute
            </TabsTrigger>
          </TabsList>
          <TabsContent value="add" className="mt-8">
            <AddShulForm />
          </TabsContent>
          <TabsContent value="report" className="mt-8">
            <DisputeForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
