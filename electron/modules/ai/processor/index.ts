import type {
  EntityCategory,
  EntityMetadata,
  OniDbRawItem,
  SourceSummary,
  VectorChunk
} from "./types";
import { parseNumber, slugify, splitBySentence } from "./utils";
import { detectEntityCategory } from "./classifier";
import { extractCleanWikiSections } from "./htmlCleaner";
import { buildTechnicalStatsParagraph } from "./specBuilder";

export * from "./types";
export * from "./utils";
export * from "./classifier";
export * from "./htmlCleaner";
export * from "./specBuilder";

/**
 * Main Polymorphic Processor Function.
 * Accepts raw ONI-DB JSON and Wiki HTML for ANY entity type (elements, buildings, food, critters, plants, guides)
 * and outputs structured VectorChunks optimized for Vector Database ingestion & LLM reasoning.
 */
export async function processElementData(
  wikiHtml: string,
  oniDbJson: any
): Promise<VectorChunk[]> {
  try {
    const dbItem: OniDbRawItem = Array.isArray(oniDbJson) ? oniDbJson[0] || {} : oniDbJson || {};

    // 1. Detect Entity Category
    const entityCategory: EntityCategory = detectEntityCategory(dbItem, wikiHtml);

    // 2. Clean and Extract Wiki Sections & Infobox Map
    const { elementName: wikiName, infoboxKeyValueMap, sections } = extractCleanWikiSections(wikiHtml);

    const elementName = dbItem.name || dbItem.element || dbItem.id || wikiName;
    const entitySlug = slugify(elementName);

    // 3. Build Polymorphic Metadata according to Category
    const metadata: EntityMetadata = {
      type: `${entityCategory}_info`,
      entity_category: entityCategory
    };

    if (entityCategory === "element") {
      metadata.state = dbItem.state ? String(dbItem.state).trim() : infoboxKeyValueMap["state"] || "Gas";
      metadata.thermal_conductivity = parseNumber(dbItem.thermal_conductivity ?? dbItem.thermalConductivity ?? infoboxKeyValueMap["thermal conductivity"]);
      metadata.specific_heat_capacity = parseNumber(dbItem.specific_heat_capacity ?? dbItem.specificHeatCapacity ?? infoboxKeyValueMap["specific heat capacity"]);
      metadata.light_absorption_factor = parseNumber(dbItem.light_absorption_factor ?? dbItem.lightAbsorptionFactor ?? infoboxKeyValueMap["light absorption factor"]);
      metadata.melting_point_c = parseNumber(dbItem.melting_point ?? dbItem.meltingPoint ?? infoboxKeyValueMap["melting point"]);
    } else if (entityCategory === "building") {
      metadata.power_consumption_w = parseNumber(dbItem.power ?? dbItem.powerConsumption ?? infoboxKeyValueMap["power"] ?? infoboxKeyValueMap["power consumption"]);
      metadata.heat_output_kdtu = parseNumber(dbItem.heat ?? dbItem.heatOutput ?? infoboxKeyValueMap["heat output"]);
      metadata.decor = parseNumber(dbItem.decor ?? infoboxKeyValueMap["decor"]);
      metadata.building_category = dbItem.buildingCategory || infoboxKeyValueMap["category"] || "Structure";
    } else if (entityCategory === "food") {
      metadata.calories_kcal = parseNumber(dbItem.calories ?? infoboxKeyValueMap["calories"]);
      metadata.quality_level = parseNumber(dbItem.quality ?? infoboxKeyValueMap["quality"]);
    } else if (entityCategory === "critter" || entityCategory === "plant") {
      metadata.growth_time_cycles = parseNumber(dbItem.growthTime ?? dbItem.eggTime ?? infoboxKeyValueMap["growth time"] ?? infoboxKeyValueMap["egg time"]);
      metadata.min_temp_c = parseNumber(dbItem.minTemp ?? infoboxKeyValueMap["min temperature"]);
      metadata.max_temp_c = parseNumber(dbItem.maxTemp ?? infoboxKeyValueMap["max temperature"]);
    }

    // Source URLs
    const sourceSummary: SourceSummary = {
      oni_db: dbItem.sourceUrl || dbItem.url || `https://oni-db.com/details/${entitySlug}`,
      wiki: `https://oxygennotincluded.wiki.gg/wiki/${encodeURIComponent(elementName.replace(/ /g, "_"))}`
    };

    // 4. Build Natural Language Technical Specs Paragraph
    const technicalStatsParagraph = buildTechnicalStatsParagraph(entityCategory, infoboxKeyValueMap, metadata);

    // 5. Combine Specs with Wiki Text & Perform Semantic Chunking
    const chunks: VectorChunk[] = [];
    let chunkCounter = 1;

    const combinedWikiText = sections.length > 0
      ? sections.map((s) => `[Wiki ${s.heading}]\n${s.content}`).join("\n\n")
      : `${elementName} is a ${entityCategory} in Oxygen Not Included.`;

    const semanticBlocks = splitBySentence(combinedWikiText, 2000);

    for (let i = 0; i < semanticBlocks.length; i++) {
      const wikiBlock = semanticBlocks[i];
      const isSingleChunk = semanticBlocks.length === 1;

      const chunkId = isSingleChunk
        ? `${entityCategory}_${entitySlug}_consolidated`
        : `${entityCategory}_${entitySlug}_chunk_${chunkCounter++}`;

      const fullContent = `${elementName} is a ${entityCategory} in Oxygen Not Included.\n\n${technicalStatsParagraph}\n\n${wikiBlock}`;

      chunks.push({
        id: chunkId,
        element: elementName,
        entity_category: entityCategory,
        source_summary: sourceSummary,
        metadata: metadata,
        content: fullContent
      });
    }

    return chunks;
  } catch (error: any) {
    console.error(`[processor] Error processing polymorphic data:`, error);
    const fallbackName = oniDbJson?.name || "Unknown Entity";
    const fallbackSlug = slugify(fallbackName);
    
    return [
      {
        id: `entity_${fallbackSlug}_error_fallback`,
        element: fallbackName,
        entity_category: "guide",
        source_summary: {
          oni_db: `https://oni-db.com/details/${fallbackSlug}`,
          wiki: `https://oxygennotincluded.wiki.gg/wiki/${encodeURIComponent(fallbackName)}`
        },
        metadata: {
          type: "general_info",
          entity_category: "guide"
        },
        content: `${fallbackName} stats processed with fallback due to parsing warning.`
      }
    ];
  }
}
