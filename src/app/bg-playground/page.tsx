import type { Metadata } from "next";

import { BackgroundPlayground } from "@/components/background/playground";

// Temporary tuning page: remove once the background settings are baked in.
export const metadata: Metadata = {
  title: "Background playground",
  robots: { index: false, follow: false },
};

export default function BackgroundPlaygroundPage() {
  return <BackgroundPlayground />;
}
