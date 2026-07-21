/**
 * Supported Entity Categories in Oxygen Not Included
 */
export type EntityCategory =
  | "element"
  | "building"
  | "food"
  | "critter"
  | "plant"
  | "equipment"
  | "guide";

/**
 * Raw input structure for ONI-DB JSON objects
 */
export interface OniDbRawItem {
  id?: string;
  name?: string;
  element?: string;
  type?: string;
  category?: string;
  state?: string;
  // Element stats
  thermal_conductivity?: number | string;
  thermalConductivity?: number | string;
  specific_heat_capacity?: number | string;
  specificHeatCapacity?: number | string;
  light_absorption_factor?: number | string;
  lightAbsorptionFactor?: number | string;
  melting_point?: number | string;
  meltingPoint?: number | string;
  // Building stats
  power?: number | string;
  powerConsumption?: number | string;
  heat?: number | string;
  heatOutput?: number | string;
  decor?: number | string;
  buildingCategory?: string;
  // Food stats
  calories?: number | string;
  quality?: number | string;
  spoilTime?: number | string;
  // Critter & Plant stats
  growthTime?: number | string;
  eggTime?: number | string;
  minTemp?: number | string;
  maxTemp?: number | string;

  sourceUrl?: string;
  url?: string;
  [key: string]: any;
}

/**
 * URLs for source tracking in Vector Database chunks
 */
export interface SourceSummary {
  oni_db: string;
  wiki: string;
}

/**
 * Strictly typed, polymorphic metadata for Vector Database indexing
 */
export interface EntityMetadata {
  type: EntityCategory | string;
  entity_category: EntityCategory;
  state?: string;
  // Element stats
  thermal_conductivity?: number;
  specific_heat_capacity?: number;
  light_absorption_factor?: number;
  melting_point_c?: number;
  // Building stats
  power_consumption_w?: number;
  heat_output_kdtu?: number;
  decor?: number;
  building_category?: string;
  // Food stats
  calories_kcal?: number;
  quality_level?: number;
  // Critter & Plant stats
  growth_time_cycles?: number;
  min_temp_c?: number;
  max_temp_c?: number;

  [key: string]: string | number | boolean | undefined;
}

/**
 * Final consolidated vector chunk ready for ChromaDB / Qdrant ingestion
 */
export interface VectorChunk {
  id: string;
  element: string; // Entity Name (e.g. Oxygen, Electrolyzer, Frost Burger, Hatch)
  entity_category: EntityCategory;
  source_summary: SourceSummary;
  metadata: EntityMetadata;
  content: string;
}

/**
 * Intermediate semantic section extracted from Wiki HTML
 */
export interface WikiSection {
  heading: string;
  content: string;
}
