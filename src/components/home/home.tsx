import { HomeHeader } from "./header"
import { HomeSections } from "./sections"

/** Width of the page's content column, shared with the nav bar and footer. */
export const HOME_WIDTH = "max-w-[85rem]"

/** The home page: the hero, then the sections, all on one left edge. */
export function Home() {
  return (
    // Clips the header's full-bleed background at the viewport edge.
    <div className="overflow-x-clip">
      <div className={`mx-auto ${HOME_WIDTH} px-gutter`}>
        <HomeHeader />
        <HomeSections />
      </div>
    </div>
  )
}
