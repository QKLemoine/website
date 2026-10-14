import { AgentProvider } from "@/components/agent/agent-provider";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { BENTO_WIDTH, BentoVariant } from "@/components/variants/bento";
import {
  COMBINED_WIDTH,
  CombinedVariant,
} from "@/components/variants/combined";
import { CURRENT_WIDTH, CurrentVariant } from "@/components/variants/current";
import {
  EDITORIAL_WIDTH,
  EditorialVariant,
} from "@/components/variants/editorial";
import { archivo, stix } from "@/components/variants/fonts";
import {
  NOTEBOOK_WIDTH,
  NotebookVariant,
} from "@/components/variants/notebook";
import { StyleSwitcher } from "@/components/variants/style-switcher";
import { parseStyle, type StyleId } from "@/components/variants/styles";

// Temporary: the homepage in each style under comparison, chosen with
// `?style=`. `fonts` is the class that loads a style's extra typeface.
const VARIANTS: Record<
  StyleId,
  { Component: () => React.ReactNode; width: string; fonts?: string }
> = {
  current: { Component: CurrentVariant, width: CURRENT_WIDTH },
  bento: { Component: BentoVariant, width: BENTO_WIDTH },
  notebook: {
    Component: NotebookVariant,
    width: NOTEBOOK_WIDTH,
    fonts: stix.variable,
  },
  editorial: {
    Component: EditorialVariant,
    width: EDITORIAL_WIDTH,
    fonts: archivo.variable,
  },
  combined: {
    Component: CombinedVariant,
    width: COMBINED_WIDTH,
    fonts: `${stix.variable} ${archivo.variable}`,
  },
};

export default async function Home({ searchParams }: PageProps<"/">) {
  const style = parseStyle((await searchParams).style);
  const { Component, width, fonts } = VARIANTS[style];

  return (
    <AgentProvider>
      <div className={`flex flex-1 flex-col ${fonts ?? ""}`}>
        <Navbar width={width} />
        <main className="flex-1">
          <Component />
        </main>
        <Footer width={width} />
        <StyleSwitcher current={style} />
      </div>
    </AgentProvider>
  );
}
