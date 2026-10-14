import { Archivo, STIX_Two_Text } from "next/font/google"

/** The serif of typeset papers, for the opening headline only. */
export const stix = STIX_Two_Text({
  variable: "--font-stix",
  subsets: ["latin"],
  style: ["normal", "italic"],
})

/** A grotesque with a width axis, set condensed for section display type. */
export const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
})
