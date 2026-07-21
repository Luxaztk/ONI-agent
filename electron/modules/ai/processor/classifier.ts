import type { EntityCategory, OniDbRawItem } from "./types";

/**
 * Automatically classifies the entity category (element, building, food, critter, plant, etc.)
 * based on ONI-DB JSON attributes and HTML content keywords.
 */
export function detectEntityCategory(oniDbJson: OniDbRawItem, wikiHtml: string): EntityCategory {
  const categoryField = (oniDbJson.category || oniDbJson.type || "").toLowerCase();
  
  if (categoryField.includes("element") || categoryField.includes("gas") || categoryField.includes("liquid") || categoryField.includes("solid")) {
    return "element";
  }
  if (categoryField.includes("building") || categoryField.includes("structure") || categoryField.includes("power") || categoryField.includes("plumbing")) {
    return "building";
  }
  if (categoryField.includes("food") || categoryField.includes("cooking") || categoryField.includes("meal")) {
    return "food";
  }
  if (categoryField.includes("critter") || categoryField.includes("creature") || categoryField.includes("fauna")) {
    return "critter";
  }
  if (categoryField.includes("plant") || categoryField.includes("seed") || categoryField.includes("flora")) {
    return "plant";
  }

  // Fallback: Classify using HTML / Content Markers
  const htmlLower = wikiHtml.toLowerCase();

  if (htmlLower.includes("building") || htmlLower.includes("power consumption") || htmlLower.includes("heat output") || htmlLower.includes("construction material")) {
    return "building";
  }
  if (htmlLower.includes("calories") || htmlLower.includes("quality") || htmlLower.includes("spoilage") || htmlLower.includes("food quality")) {
    return "food";
  }
  if (htmlLower.includes("critter") || htmlLower.includes("diet") || htmlLower.includes("tame") || htmlLower.includes("wild")) {
    return "critter";
  }
  if (htmlLower.includes("growth time") || htmlLower.includes("irrigation") || htmlLower.includes("fertilization") || htmlLower.includes("harvest")) {
    return "plant";
  }
  if (htmlLower.includes("thermal conductivity") || htmlLower.includes("specific heat capacity") || htmlLower.includes("melting point") || htmlLower.includes("element")) {
    return "element";
  }

  return "guide";
}
