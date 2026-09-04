export type LayerType = 'building' | 'liquid' | 'gas' | 'power' | 'automation' | 'shipping';

export interface Vector2D {
  x: number;
  y: number;
}

export interface BuildingNode {
  id: string;
  name: string;
  type: string;
  position: Vector2D;
  size: Vector2D;
  rotation?: 0 | 90 | 180 | 270;
  primaryMaterial?: string;
  availableMaterials?: string[];
  powerConsumptionW?: number;
  heatGenerationKDTU?: number;
  description?: string;
}

export interface ConnectionPort {
  id: string;
  buildingId: string;
  type: 'input' | 'output';
  resourceType: 'liquid' | 'gas' | 'power' | 'automation' | 'shipping';
  position: Vector2D;
  element?: string; // e.g. "Water", "Oxygen", "Hydrogen", "Wattage"
}

export interface ConnectionWire {
  id: string;
  layer: LayerType;
  fromPortId?: string;
  toPortId?: string;
  path: Vector2D[];
  element?: string;
  capacity?: string; // e.g. "1000g/s", "10kW", "14kg/s"
  description?: string;
}

export interface BlueprintLayer {
  layer: LayerType;
  buildings: BuildingNode[];
  connections: ConnectionWire[];
  ports: ConnectionPort[];
}

export interface MaterialSwapOption {
  originalMaterial: string;
  targetMaterial: string;
  temperatureLimitC: number;
  thermalConductivity: number;
  specificHeatCapacity: number;
  overheatTempBonusC: number;
  recommendation: 'optimal' | 'acceptable' | 'warning' | 'dangerous';
  note: string;
}

export interface ONIBlueprint {
  id: string;
  title: string;
  category: 'SPOM' | 'Cooling' | 'Boiler' | 'Tamer' | 'Storage' | 'Power' | 'Farming';
  description: string;
  author?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  tags: string[];
  blueprintString?: string;
  dimensions: Vector2D;
  layers: Record<LayerType, BlueprintLayer>;
  materialRequirements: Record<string, number>; // e.g. { "Igneous Rock": 1200, "Steel": 800 }
  materialSwapTable?: MaterialSwapOption[];
  mermaidDiagrams?: Record<string, string>;
  performanceStats: {
    powerBalanceW: number;
    heatBalanceKDTU: number;
    waterConsumptionKgPerSec?: number;
    oxygenOutputGPerSec?: number;
    coolingCapacityKDTU?: number;
  };
}

export interface SPOMCalcResult {
  dupCount: number;
  requiredO2GPerSec: number;
  electrolyzerCount: number;
  waterRequiredKgPerSec: number;
  hydrogenOutputGPerSec: number;
  o2PumpsCount: number;
  h2PumpsCount: number;
  powerGeneratedW: number;
  powerConsumedW: number;
  netPowerW: number;
  isSelfPowered: boolean;
  recommendedBlueprintId: string;
}

export interface CoolingCalcResult {
  coolantName: string;
  coolantSHC: number;
  targetDTUPerSec: number;
  aquatunerCount: number;
  aquatunerCoolingPerUnitKDTU: number;
  totalAquatunerCoolingKDTU: number;
  steamTurbineCount: number;
  maxSteamTurbineDeletionKDTU: number;
  aquatunerPowerW: number;
  turbinePowerGeneratedW: number;
  netPowerW: number;
  recommendedBlueprintId: string;
}

export interface ResourceRequirement {
  name: string;
  amountPerCycleKg: number;
  rateKgPerSec?: number;
  total100CyclesKg: number;
  isLiquid?: boolean;
}

export interface FoodCalcResult {
  dupCount: number;
  kcalPerDup: number;
  totalKcalPerCycle: number;
  selectedFood: string;
  plantsCount: number;
  crittersCount: number;
  useFertilizerBoost: boolean;
  cyclesToGrowEffective: number;
  kcalPerPlantPerCycle: number;
  resources: ResourceRequirement[];
  tempRange: string;
  idealTemp: string;
  lightRequired: string;
  atmosphereRequired: string;
  notes?: string;
  waterReqPerCycleKg: number;
  dirtReqPerCycleKg: number;
  fertilizerReqPerCycleKg: number;
  pollutedWaterReqPerCycleKg: number;
}

export interface PipelineCalcResult {
  sourceType: string;
  emissionRateKgPerSec: number;
  emissionTempC: number;
  activeCyclePercentage: number;
  avgYieldKgPerSec: number;
  downstreamProcessors: {
    processorName: string;
    unitsNeeded: number;
    outputProduct: string;
    outputRateKgPerSec: number;
  }[];
  coolingNeededKDTU: number;
  recommendedBlueprintId: string;
}
