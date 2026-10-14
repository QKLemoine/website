import { EditorialSections } from "./editorial"
import { NotebookHeader } from "./notebook"

export const COMBINED_WIDTH = "max-w-6xl"

/**
 * Combined: the notebook's opening over the editorial's numbered sections.
 */
export function CombinedVariant() {
  return (
    // Clips the header's full-bleed background at the viewport edge.
    <div className="overflow-x-clip">
      <div className={`mx-auto ${COMBINED_WIDTH} px-6`}>
        <div className="pb-12 text-[15px] leading-relaxed sm:text-base">
          <NotebookHeader />
        </div>
        <EditorialSections />
      </div>
    </div>
  )
}
