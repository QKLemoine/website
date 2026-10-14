import { HomeHeader } from "./header"
import { HomeSections } from "./sections"

/** Width of the page's content column, shared with the nav bar and footer. */
export const HOME_WIDTH = "max-w-6xl"

/** The home page: the paper-style opening over the numbered sections. */
export function Home() {
  return (
    // Clips the header's full-bleed background at the viewport edge.
    <div className="overflow-x-clip">
      <div className={`mx-auto ${HOME_WIDTH} px-6`}>
        <div className="pb-12 text-[15px] leading-relaxed sm:text-base">
          <HomeHeader />
        </div>
        <HomeSections />
      </div>
    </div>
  )
}
