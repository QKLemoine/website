import { Archivo, STIX_Two_Text } from "next/font/google"

/** Notebook: the serif of typeset papers, for headlines only. */
export const stix = STIX_Two_Text({
  variable: "--font-stix",
  subsets: ["latin"],
  style: ["normal", "italic"],
})

/** Editorial: a grotesque with a width axis, set condensed for display. */
export const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
})
