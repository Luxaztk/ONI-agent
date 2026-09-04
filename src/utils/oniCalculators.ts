import type {
  SPOMCalcResult,
  CoolingCalcResult,
  FoodCalcResult,
  PipelineCalcResult
} from '../types/blueprint';

// Data constants
export const COOLANTS = [
  { name: 'Super Coolant', shc: 8.440, minTemp: -271, maxTemp: 436, desc: 'Tối ưu tuyệt đối cho Aquatuner' },
  { name: 'Nước bẩn (Polluted Water)', shc: 4.179, minTemp: -20, maxTemp: 119, desc: 'Phổ biến và hiệu quả nhất giai đoạn giữa game' },
  { name: 'Nước thường (Water)', shc: 4.179, minTemp: 0, maxTemp: 99, desc: 'Dễ kiếm nhưng nguy cơ đóng băng ở 0°C' },
  { name: 'Nước muối (Brine / Salt Water)', shc: 4.100, minTemp: -22, maxTemp: 100, desc: 'Chất làm mát tạm thời ở mỏ muối' },
  { name: 'Petroleum (Dầu hỏa)', shc: 1.760, minTemp: -57, maxTemp: 538, desc: 'Dải nhiệt rộng nhưng SHC thấp' },
  { name: 'Crude Oil (Dầu thô)', shc: 1.690, minTemp: -40, maxTemp: 399, desc: 'Dải nhiệt rộng, SHC thấp' },
  { name: 'Ethanol', shc: 2.460, minTemp: -114, maxTemp: 78, desc: 'Phù hợp làm mát nhiệt độ âm nhẹ' },
  { name: 'Naphtha', shc: 2.191, minTemp: -50, maxTemp: 539, desc: 'Chịu nhiệt cao, dùng làm bẫy nhiệt' }
];

export interface CropData {
  kcalPerHarvest: number;
  cyclesToGrow: number;
  waterKgPerCycle?: number;
  dirtKgPerCycle?: number;
  pwaterKgPerCycle?: number;
  saltWaterKgPerCycle?: number;
  slimeKgPerCycle?: number;
  fertilizerKgPerCycle?: number;
  phosphoriteKgPerCycle?: number;
  bleachstoneKgPerCycle?: number;
  ethanolKgPerCycle?: number;
  sulfurKgPerCycle?: number;
  tempRange: string;
  idealTemp: string;
  lightRequired: string;
  atmosphereRequired: string;
  isCritter?: boolean;
  notes?: string;
}

export const FOOD_DATABASE: Record<string, CropData> = {
  'Mealwood (Bánh sâu / Mealloaf)': {
    kcalPerHarvest: 200,
    cyclesToGrow: 3,
    dirtKgPerCycle: 10,
    tempRange: '10°C đến 30°C',
    idealTemp: '~20°C',
    lightRequired: 'Không yêu cầu',
    atmosphereRequired: 'Oxy, CO2 hoặc Khí trơ',
    notes: 'Dễ trồng nhất đầu game, tốn nhiều Đất (Dirt)'
  },
  'Bristle Blossom (Bristle Berry)': {
    kcalPerHarvest: 300,
    cyclesToGrow: 6,
    waterKgPerCycle: 20,
    tempRange: '5°C đến 30°C',
    idealTemp: '~20°C',
    lightRequired: 'Cần chiếu sáng (≥ 200 Lux)',
    atmosphereRequired: 'Oxy, CO2 hoặc Khí trơ',
    notes: 'Tiêu thụ Nước sạch 20kg/chu kỳ, cần đèn chiếu sáng'
  },
  'Dusk Cap (Nấm / Mushroom)': {
    kcalPerHarvest: 400,
    cyclesToGrow: 7.5,
    slimeKgPerCycle: 4,
    tempRange: '5°C đến 35°C',
    idealTemp: '~22°C',
    lightRequired: 'Không cần (Phù hợp bóng tối)',
    atmosphereRequired: 'Khí Carbon Dioxide (CO2)',
    notes: 'Trồng trong môi trường CO2, tiêu thụ Bùn vi sinh (Slime)'
  },
  'Sleet Wheat (Lúa Băng / Sleet Grain)': {
    kcalPerHarvest: 3600,
    cyclesToGrow: 18,
    waterKgPerCycle: 20,
    dirtKgPerCycle: 5,
    tempRange: '-25°C đến 5°C',
    idealTemp: '~-10°C',
    lightRequired: 'Không yêu cầu',
    atmosphereRequired: 'Oxy, CO2 hoặc Khí trơ',
    notes: 'Cần môi trường làm lạnh âm độ, dùng cho Frost Bun / Frost Burger'
  },
  'Waterweed (Rêu biển / Lettuce)': {
    kcalPerHarvest: 400,
    cyclesToGrow: 12,
    saltWaterKgPerCycle: 5,
    bleachstoneKgPerCycle: 0.5,
    tempRange: '22°C đến 65°C',
    idealTemp: '~40°C',
    lightRequired: 'Không yêu cầu',
    atmosphereRequired: 'Ngập trong Nước muối / Nước biển',
    notes: 'Cần trồng ngập Nước Muối và bón Muối Tẩy (Bleachstone)'
  },
  'Pincha Pepper (Quả Ớt Pincha)': {
    kcalPerHarvest: 600,
    cyclesToGrow: 8,
    pwaterKgPerCycle: 35,
    phosphoriteKgPerCycle: 2,
    tempRange: '35°C đến 85°C',
    idealTemp: '~55°C',
    lightRequired: 'Không yêu cầu',
    atmosphereRequired: 'Oxy, CO2, Hydrogen',
    notes: 'Mọc ngược trên trần, tiêu thụ Nước bẩn (35kg) & Quặng Phosphorite'
  },
  'Bog Bucket (Trái bún / Bog Jelly)': {
    kcalPerHarvest: 1840,
    cyclesToGrow: 6.6,
    pwaterKgPerCycle: 25,
    tempRange: '10°C đến 35°C',
    idealTemp: '~25°C',
    lightRequired: 'Không yêu cầu',
    atmosphereRequired: 'Oxy, CO2 hoặc Khí trơ',
    notes: 'Tiêu thụ 25kg Nước bẩn/chu kỳ, năng lượng calo cao'
  },
  'Nosh Sprout (Đậu Nosh / Nosh Bean)': {
    kcalPerHarvest: 1200,
    cyclesToGrow: 21,
    ethanolKgPerCycle: 20,
    dirtKgPerCycle: 5,
    tempRange: '-25°C đến 7°C',
    idealTemp: '~-15°C',
    lightRequired: 'Không yêu cầu',
    atmosphereRequired: 'Oxy, CO2 hoặc Khí trơ',
    notes: 'Tưới bằng Ethanol mát và Đất, dùng làm Tofu'
  },
  'Grubfruit (Trái Grubfruit)': {
    kcalPerHarvest: 1000,
    cyclesToGrow: 8,
    sulfurKgPerCycle: 10,
    tempRange: '15°C đến 50°C',
    idealTemp: '~30°C',
    lightRequired: 'Không yêu cầu',
    atmosphereRequired: 'Oxy, CO2 hoặc Khí trơ',
    notes: 'Tiêu thụ Lưu huỳnh (Sulfur) 10kg/chu kỳ'
  },
  'BBQ (Nước từ thịt Hatch/Pacu)': {
    kcalPerHarvest: 4000,
    cyclesToGrow: 6,
    tempRange: 'Không áp dụng (Thú nuôi)',
    idealTemp: 'N/A',
    lightRequired: 'N/A',
    atmosphereRequired: 'Chuồng nuôi Hatch/Pacu',
    isCritter: true,
    notes: 'Nuôi Hatch cho ăn Đá mộc / Pacu ăn Tảo để lấy thịt nướng BBQ'
  },
  'Frost Burger (Bánh Frost Burger)': {
    kcalPerHarvest: 6000,
    cyclesToGrow: 10,
    waterKgPerCycle: 15,
    dirtKgPerCycle: 5,
    tempRange: 'Món ăn cao cấp chế biến bếp',
    idealTemp: 'N/A',
    lightRequired: 'N/A',
    atmosphereRequired: 'N/A',
    notes: 'Món ăn đỉnh cao +16 Morale, kết hợp Thịt, Lúa băng và Bánh mỳ'
  }
};

export const GEYSER_TYPES = [
  { id: 'cool_steam', name: 'Mạch hơi nước lạnh (Cool Steam Vent)', defaultEmissionKgSec: 3.5, emissionTempC: 110, resource: 'Water' },
  { id: 'steam_vent', name: 'Mạch hơi nước nóng (Steam Vent)', defaultEmissionKgSec: 1.2, emissionTempC: 500, resource: 'Steam' },
  { id: 'water_geyser', name: 'Mạch nước nóng (Water Geyser)', defaultEmissionKgSec: 3.0, emissionTempC: 95, resource: 'Water' },
  { id: 'pwater_geyser', name: 'Mạch nước bẩn nóng (Polluted Water Geyser)', defaultEmissionKgSec: 4.5, emissionTempC: 30, resource: 'Polluted Water' },
  { id: 'salt_water_geyser', name: 'Mạch nước muối (Salt Water Geyser)', defaultEmissionKgSec: 3.8, emissionTempC: 95, resource: 'Salt Water' },
  { id: 'iron_volcano', name: 'Núi lửa sắt (Iron Volcano)', defaultEmissionKgSec: 0.8, emissionTempC: 2526.85, resource: 'Molten Iron' },
  { id: 'gold_volcano', name: 'Núi lửa vàng (Gold Volcano)', defaultEmissionKgSec: 1.2, emissionTempC: 2626.85, resource: 'Molten Gold' },
  { id: 'copper_volcano', name: 'Núi lửa đồng (Copper Volcano)', defaultEmissionKgSec: 1.0, emissionTempC: 2226.85, resource: 'Molten Copper' }
];

/**
 * Tính toán số liệu SPOM (Self-Powered Oxygen Module)
 */
export function calculateSPOM(dupCount: number, dupConsumptionRate: number = 100): SPOMCalcResult {
  const safeDupCount = Math.max(1, dupCount);
  const requiredO2GPerSec = safeDupCount * dupConsumptionRate;
  
  // 1 Electrolyzer = 888g/s O2 + 112g/s H2 from 1000g/s Water
  const electrolyzerCount = parseFloat((requiredO2GPerSec / 888).toFixed(2));
  const actualElectrolyzerCount = Math.ceil(electrolyzerCount);
  
  const waterRequiredKgPerSec = parseFloat(((actualElectrolyzerCount * 1000) / 1000).toFixed(3)); // kg/s
  const hydrogenOutputGPerSec = parseFloat((actualElectrolyzerCount * 112).toFixed(1));
  
  // Pump capacities: Gas Pump = 500g/s max
  const o2ProducedGPerSec = actualElectrolyzerCount * 888;
  const o2PumpsCount = Math.ceil(o2ProducedGPerSec / 500);
  const h2PumpsCount = Math.ceil(hydrogenOutputGPerSec / 500);
  
  // Power calculations
  // Hydrogen Generator: 800W per 100g/s H2
  const powerGeneratedW = Math.round((hydrogenOutputGPerSec / 100) * 800);
  // Power consumed: Electrolyzer = 120W, Gas Pump = 240W, Liquid Pump = 240W (1 pump handles 10kg/s)
  const liquidPumpsCount = Math.ceil(waterRequiredKgPerSec / 10);
  const powerConsumedW = (actualElectrolyzerCount * 120) + ((o2PumpsCount + h2PumpsCount) * 240) + (liquidPumpsCount * 240);
  
  const netPowerW = powerGeneratedW - powerConsumedW;
  
  let recommendedBlueprintId = 'spom_half_rodriguez';
  if (actualElectrolyzerCount >= 4) {
    recommendedBlueprintId = 'spom_full_rodriguez';
  } else if (actualElectrolyzerCount >= 2) {
    recommendedBlueprintId = 'spom_half_rodriguez';
  } else {
    recommendedBlueprintId = 'spom_mini';
  }
  
  return {
    dupCount: safeDupCount,
    requiredO2GPerSec,
    electrolyzerCount,
    waterRequiredKgPerSec,
    hydrogenOutputGPerSec,
    o2PumpsCount,
    h2PumpsCount,
    powerGeneratedW,
    powerConsumedW,
    netPowerW,
    isSelfPowered: netPowerW >= 0,
    recommendedBlueprintId
  };
}

/**
 * Tính toán Aquatuner / Steam Turbine Cooling System
 */
export function calculateATSTCooling(coolantName: string, targetDTUPerSec: number): CoolingCalcResult {
  const coolant = COOLANTS.find(c => c.name === coolantName) || COOLANTS[1]; // default P-Water
  
  // Aquatuner cools liquid by 14°C at 14 kg/s (14,000 g/s)
  // Heat absorbed per AT = 14,000 g/s * SHC * 14°C = 196 * SHC kDTU/s
  const aquatunerCoolingPerUnitKDTU = parseFloat((196 * coolant.shc).toFixed(2));
  
  const safeDTU = Math.max(10, targetDTUPerSec);
  const aquatunerCount = Math.ceil(safeDTU / aquatunerCoolingPerUnitKDTU);
  const totalAquatunerCoolingKDTU = parseFloat((aquatunerCount * aquatunerCoolingPerUnitKDTU).toFixed(2));
  
  // 1 Steam Turbine deletes max 877.5 kDTU/s at 200°C steam (with 5 open ports)
  const maxSteamTurbineDeletionKDTU = 877.5;
  const steamTurbineCount = Math.ceil(totalAquatunerCoolingKDTU / maxSteamTurbineDeletionKDTU);
  
  // Power: AT = 1200W each. ST generates up to 850W each
  const aquatunerPowerW = aquatunerCount * 1200;
  const turbinePowerGeneratedW = steamTurbineCount * 850;
  const netPowerW = turbinePowerGeneratedW - aquatunerPowerW;
  
  let recommendedBlueprintId = 'cooling_at_st_standard';
  if (totalAquatunerCoolingKDTU > 2000) {
    recommendedBlueprintId = 'cooling_industrial_chiller';
  }
  
  return {
    coolantName: coolant.name,
    coolantSHC: coolant.shc,
    targetDTUPerSec: safeDTU,
    aquatunerCount,
    aquatunerCoolingPerUnitKDTU,
    totalAquatunerCoolingKDTU,
    steamTurbineCount,
    maxSteamTurbineDeletionKDTU,
    aquatunerPowerW,
    turbinePowerGeneratedW,
    netPowerW,
    recommendedBlueprintId
  };
}

/**
 * Tính toán Thực phẩm và Nông nghiệp
 */
export function calculateFoodAndResource(
  dupCount: number,
  selectedFoodKey: string,
  kcalPerDup: number = 1000,
  useFertilizerBoost: boolean = false
): FoodCalcResult {
  const safeDupCount = Math.max(1, dupCount);
  const totalKcalPerCycle = safeDupCount * kcalPerDup;
  const foodInfo = FOOD_DATABASE[selectedFoodKey] || FOOD_DATABASE['Mealwood (Bánh sâu / Mealloaf)'];
  
  let plantsCount = 0;
  let crittersCount = 0;
  
  // Effective growth cycles: Farmer's Touch fertilizer boost halves growth time (+100% speed)
  const cyclesToGrowEffective = useFertilizerBoost && !foodInfo.isCritter
    ? parseFloat((foodInfo.cyclesToGrow / 2).toFixed(2))
    : foodInfo.cyclesToGrow;

  const kcalPerPlantPerCycle = foodInfo.kcalPerHarvest / cyclesToGrowEffective;

  if (foodInfo.isCritter) {
    // 1 Hatch = ~4000 kcal per 6 cycles = ~666 kcal/cycle -> ~1.5 Hatches per dup
    crittersCount = Math.ceil(totalKcalPerCycle / 666);
  } else {
    plantsCount = Math.ceil(totalKcalPerCycle / kcalPerPlantPerCycle);
  }
  
  // Calculate resource consumption
  const resources: FoodCalcResult['resources'] = [];

  const addRes = (name: string, perPlantKg?: number, isLiquid?: boolean) => {
    if (!perPlantKg || perPlantKg <= 0) return;
    const amountPerCycleKg = parseFloat((plantsCount * perPlantKg).toFixed(2));
    const rateKgPerSec = isLiquid ? parseFloat((amountPerCycleKg / 600).toFixed(3)) : undefined;
    const total100CyclesKg = parseFloat((amountPerCycleKg * 100).toFixed(1));
    resources.push({
      name,
      amountPerCycleKg,
      rateKgPerSec,
      total100CyclesKg,
      isLiquid
    });
  };

  addRes('Nước sạch (Water)', foodInfo.waterKgPerCycle, true);
  addRes('Nước bẩn (Polluted Water)', foodInfo.pwaterKgPerCycle, true);
  addRes('Nước muối (Salt Water)', foodInfo.saltWaterKgPerCycle, true);
  addRes('Ethanol', foodInfo.ethanolKgPerCycle, true);
  addRes('Đất (Dirt)', foodInfo.dirtKgPerCycle, false);
  addRes('Bùn vi sinh (Slime)', foodInfo.slimeKgPerCycle, false);
  addRes('Phân bón (Fertilizer)', foodInfo.fertilizerKgPerCycle, false);
  addRes('Phosphorite (Quặng Phosphorite)', foodInfo.phosphoriteKgPerCycle, false);
  addRes('Muối tẩy (Bleachstone)', foodInfo.bleachstoneKgPerCycle, false);
  addRes('Lưu huỳnh (Sulfur)', foodInfo.sulfurKgPerCycle, false);

  if (useFertilizerBoost && !foodInfo.isCritter && plantsCount > 0) {
    const fertBoostPerCycleKg = parseFloat((plantsCount * 3.33).toFixed(2));
    resources.push({
      name: 'Vi chất phân bón (Farmer\'s Touch / Micronutrient)',
      amountPerCycleKg: fertBoostPerCycleKg,
      total100CyclesKg: parseFloat((fertBoostPerCycleKg * 100).toFixed(1)),
      isLiquid: false
    });
  }

  const waterReqPerCycleKg = (foodInfo.waterKgPerCycle || 0) * plantsCount;
  const dirtReqPerCycleKg = (foodInfo.dirtKgPerCycle || 0) * plantsCount;
  const fertilizerReqPerCycleKg = (foodInfo.fertilizerKgPerCycle || 0) * plantsCount;
  const pollutedWaterReqPerCycleKg = (foodInfo.pwaterKgPerCycle || 0) * plantsCount;

  return {
    dupCount: safeDupCount,
    kcalPerDup,
    totalKcalPerCycle,
    selectedFood: selectedFoodKey,
    plantsCount,
    crittersCount,
    useFertilizerBoost,
    cyclesToGrowEffective,
    kcalPerPlantPerCycle: parseFloat(kcalPerPlantPerCycle.toFixed(1)),
    resources,
    tempRange: foodInfo.tempRange,
    idealTemp: foodInfo.idealTemp,
    lightRequired: foodInfo.lightRequired,
    atmosphereRequired: foodInfo.atmosphereRequired,
    notes: foodInfo.notes,
    waterReqPerCycleKg,
    dirtReqPerCycleKg,
    fertilizerReqPerCycleKg,
    pollutedWaterReqPerCycleKg
  };
}

/**
 * Tính toán Cân bằng Tải Mạch Nước / Volcano Pipeline
 */
export function calculatePipelineBalance(
  geyserTypeId: string,
  emissionRateKgSec: number,
  activeRatioPercent: number = 60
): PipelineCalcResult {
  const geyser = GEYSER_TYPES.find(g => g.id === geyserTypeId) || GEYSER_TYPES[0];
  const rate = Math.max(0.1, emissionRateKgSec);
  const ratio = Math.min(100, Math.max(1, activeRatioPercent)) / 100;
  
  const avgYieldKgPerSec = parseFloat((rate * ratio).toFixed(2));
  
  const downstreamProcessors: PipelineCalcResult['downstreamProcessors'] = [];
  let coolingNeededKDTU = 0;
  
  if (geyser.resource.includes('Water') || geyser.resource === 'Steam') {
    // Feed to Desalinator / Water Sieve (max 5 kg/s each)
    const sieveUnits = Math.ceil(avgYieldKgPerSec / 5);
    downstreamProcessors.push({
      processorName: geyser.id.includes('salt') ? 'Desalinator (Máy khử muối)' : 'Water Sieve (Máy lọc nước bẩn)',
      unitsNeeded: sieveUnits,
      outputProduct: 'Clean Water',
      outputRateKgPerSec: avgYieldKgPerSec
    });
    
    // Feed to SPOMs (1 SPOM needs ~1 kg/s water)
    const spomsFed = Math.floor(avgYieldKgPerSec / 1.0);
    downstreamProcessors.push({
      processorName: 'SPOM (Máy điện phân)',
      unitsNeeded: spomsFed,
      outputProduct: 'Oxygen + Hydrogen',
      outputRateKgPerSec: avgYieldKgPerSec
    });
    
    // Heat calculation: Cool water from emission temp to 25°C
    const tempDelta = Math.max(0, geyser.emissionTempC - 25);
    coolingNeededKDTU = parseFloat((avgYieldKgPerSec * 1000 * 4.179 * tempDelta / 1000).toFixed(1));
  } else if (geyser.resource.includes('Molten')) {
    // Metal Volcano
    coolingNeededKDTU = parseFloat((avgYieldKgPerSec * 1000 * 0.45 * (geyser.emissionTempC - 200) / 1000).toFixed(1));
    downstreamProcessors.push({
      processorName: 'Steam Turbine Heat Deletion Chamber',
      unitsNeeded: Math.ceil(coolingNeededKDTU / 877.5),
      outputProduct: 'Solid Refined Metal + Power',
      outputRateKgPerSec: avgYieldKgPerSec
    });
  }
  
  return {
    sourceType: geyser.name,
    emissionRateKgPerSec: rate,
    emissionTempC: geyser.emissionTempC,
    activeCyclePercentage: activeRatioPercent,
    avgYieldKgPerSec,
    downstreamProcessors,
    coolingNeededKDTU,
    recommendedBlueprintId: geyser.id.includes('volcano') ? 'tamer_metal_volcano' : 'tamer_cool_steam_vent'
  };
}
