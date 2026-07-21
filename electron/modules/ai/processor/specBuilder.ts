import type { EntityCategory, EntityMetadata } from "./types";

/**
 * Builds natural language technical specs paragraph based on entity category and metadata.
 */
export function buildTechnicalStatsParagraph(
  category: EntityCategory,
  infoboxMap: Record<string, string>,
  metadata: EntityMetadata
): string {
  const lines: string[] = [`[ONI Technical Specs - ${category.toUpperCase()}]`];

  if (category === "element") {
    lines.push(`- State: ${metadata.state || "Gas/Liquid/Solid"}`);
    if (metadata.thermal_conductivity !== undefined) lines.push(`- Thermal Conductivity: ${metadata.thermal_conductivity} (DTU/m*s)/°C`);
    if (metadata.specific_heat_capacity !== undefined) lines.push(`- Specific Heat Capacity: ${metadata.specific_heat_capacity} DTU/g/°C`);
    if (metadata.light_absorption_factor !== undefined) lines.push(`- Light Absorption Factor: ${(metadata.light_absorption_factor * 100).toFixed(0)}%`);
    if (metadata.melting_point_c !== undefined) lines.push(`- Melting Point: ${metadata.melting_point_c} °C`);
  } else if (category === "building") {
    if (metadata.building_category) lines.push(`- Category: ${metadata.building_category}`);
    if (metadata.power_consumption_w !== undefined) lines.push(`- Power Usage: ${metadata.power_consumption_w} W`);
    if (metadata.heat_output_kdtu !== undefined) lines.push(`- Heat Output: ${metadata.heat_output_kdtu} kDTU/s`);
    if (metadata.decor !== undefined) lines.push(`- Decor Impact: ${metadata.decor}`);
  } else if (category === "food") {
    if (metadata.calories_kcal !== undefined) lines.push(`- Energy/Calories: ${metadata.calories_kcal} kcal`);
    if (metadata.quality_level !== undefined) lines.push(`- Quality Level: +${metadata.quality_level}`);
  } else if (category === "critter" || category === "plant") {
    if (metadata.growth_time_cycles !== undefined) lines.push(`- Growth/Egg Duration: ${metadata.growth_time_cycles} cycles`);
    if (metadata.min_temp_c !== undefined && metadata.max_temp_c !== undefined) {
      lines.push(`- Temperature Range: ${metadata.min_temp_c} °C to ${metadata.max_temp_c} °C`);
    }
  }

  // Include any extra parsed Infobox attributes if available
  Object.entries(infoboxMap).slice(0, 5).forEach(([key, val]) => {
    lines.push(`- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}`);
  });

  return lines.join("\n");
}
