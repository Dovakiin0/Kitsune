import { canExtractByse, extractByse } from "./byse.js";
import { canExtractDataSv, extractDataSv } from "./datasv.js";
import { canExtractMegaPlay, extractMegaPlay, extractMegaPlayDetails } from "./megaplay.js";
import { canExtractNova, extractNova } from "./nova.js";
import { canExtractVidplay, extractVidplay } from "./vidplay.js";
import { canExtractVidmoly, extractVidmoly } from "./vidmoly.js";

export { canExtractByse, extractByse } from "./byse.js";
export { canExtractDataSv, extractDataSv } from "./datasv.js";
export { canExtractMegaPlay, extractMegaPlay, extractMegaPlayDetails } from "./megaplay.js";
export { canExtractNova, extractNova } from "./nova.js";
export { canExtractVidplay, extractVidplay } from "./vidplay.js";
export { canExtractVidmoly, extractVidmoly } from "./vidmoly.js";
export { extractFlixcloud } from "./flixcloud.js";

const videoExtractors = [
  { name: "byse", matches: canExtractByse, extract: extractByse },
  { name: "datasv", matches: canExtractDataSv, extract: extractDataSv },
  { name: "megaplay", matches: canExtractMegaPlay, extract: extractMegaPlay },
  { name: "vidplay", matches: canExtractVidplay, extract: extractVidplay },
  { name: "vidmoly", matches: canExtractVidmoly, extract: extractVidmoly },
  { name: "nova", matches: canExtractNova, extract: extractNova }
];

export function findVideoExtractor(url) {
  return videoExtractors.find((extractor) => extractor.matches(url)) ?? null;
}
