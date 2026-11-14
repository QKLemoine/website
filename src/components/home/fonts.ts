import { STIX_Two_Text } from "next/font/google"

/** The display serif: the hero headline and section headings, nothing else. */
export const stix = STIX_Two_Text({
  variable: "--font-stix",
  subsets: ["latin"],
  style: ["normal", "italic"],
})
