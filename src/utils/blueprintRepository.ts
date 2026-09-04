import type { ONIBlueprint } from '../types/blueprint';

// Sample Master Blueprints embedded directly for offline zero-latency rendering
export const MASTER_BLUEPRINTS: ONIBlueprint[] = [
  {
    id: 'spom_full_rodriguez',
    title: 'Full Rodriguez SPOM (4 Electrolyzer Self-Powered)',
    category: 'SPOM',
    description: 'Thiết kế SPOM huyền thoại chuẩn 4 máy điện phân, tự phân loại O2 và H2 không cần lọc khí (Filterless), đủ cung cấp Oxy cho 32 Duplicants.',
    author: 'Jahws / ONI Community',
    difficulty: 'Intermediate',
    tags: ['SPOM', 'Oxygen', 'Self-Powered', 'Filterless', 'Core Base'],
    dimensions: { x: 12, y: 10 },
    materialRequirements: {
      'Igneous Rock (Gạch cách nhiệt)': 1200,
      'Gold Amalgam (Máy điện phân & Bơm)': 1800,
      'Copper Wire (Dây điện)': 400
    },
    layers: {
      building: {
        layer: 'building',
        buildings: [
          { id: 'el_1', name: 'Electrolyzer 1', type: 'Electrolyzer', position: { x: 2, y: 2 }, size: { x: 2, y: 2 }, primaryMaterial: 'Gold Amalgam' },
          { id: 'el_2', name: 'Electrolyzer 2', type: 'Electrolyzer', position: { x: 5, y: 2 }, size: { x: 2, y: 2 }, primaryMaterial: 'Gold Amalgam' },
          { id: 'el_3', name: 'Electrolyzer 3', type: 'Electrolyzer', position: { x: 8, y: 2 }, size: { x: 2, y: 2 }, primaryMaterial: 'Gold Amalgam' },
          { id: 'el_4', name: 'Electrolyzer 4', type: 'Electrolyzer', position: { x: 10, y: 2 }, size: { x: 2, y: 2 }, primaryMaterial: 'Gold Amalgam' },
          { id: 'h2_gen', name: 'Hydrogen Generator', type: 'Hydrogen Generator', position: { x: 6, y: 7 }, size: { x: 2, y: 3 }, primaryMaterial: 'Iron' }
        ],
        connections: [],
        ports: []
      },
      liquid: {
        layer: 'liquid',
        buildings: [],
        connections: [
          { id: 'liq_1', layer: 'liquid', path: [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 6, y: 1 }, { x: 9, y: 1 }], element: 'Water', capacity: '4 kg/s' }
        ],
        ports: []
      },
      gas: {
        layer: 'gas',
        buildings: [],
        connections: [
          { id: 'gas_o2', layer: 'gas', path: [{ x: 2, y: 4 }, { x: 6, y: 4 }, { x: 11, y: 4 }], element: 'Oxygen', capacity: '3552 g/s' },
          { id: 'gas_h2', layer: 'gas', path: [{ x: 6, y: 6 }, { x: 6, y: 7 }], element: 'Hydrogen', capacity: '448 g/s' }
        ],
        ports: []
      },
      power: {
        layer: 'power',
        buildings: [],
        connections: [
          { id: 'pow_wire', layer: 'power', path: [{ x: 2, y: 3 }, { x: 6, y: 8 }, { x: 10, y: 3 }], capacity: 'Heavy-Watt Wire (20kW)' }
        ],
        ports: []
      },
      automation: {
        layer: 'automation',
        buildings: [],
        connections: [
          { id: 'auto_1', layer: 'automation', path: [{ x: 6, y: 6 }, { x: 6, y: 7 }], element: 'Atmo Sensor (>750g H2)' }
        ],
        ports: []
      },
      shipping: {
        layer: 'shipping',
        buildings: [],
        connections: [],
        ports: []
      }
    },
    materialSwapTable: [
      { originalMaterial: 'Gold Amalgam', targetMaterial: 'Steel', temperatureLimitC: 275, thermalConductivity: 54, specificHeatCapacity: 0.449, overheatTempBonusC: 200, recommendation: 'optimal', note: 'Steel giúp chạy nóng an toàn hơn không bị hỏng' },
      { originalMaterial: 'Gold Amalgam', targetMaterial: 'Copper', temperatureLimitC: 125, thermalConductivity: 4.5, specificHeatCapacity: 0.385, overheatTempBonusC: 50, recommendation: 'warning', note: 'Dễ hỏng nếu nhiệt độ O2 vượt quá 125°C' }
    ],
    mermaidDiagrams: {
      composite: `graph TD\n  Water[Nước sạch 4kg/s] -->|Insulated Pipe| El[4x Electrolyzers]\n  El -->|O2 Filterless Hood| O2Pumps[6x Gas Pumps O2]\n  El -->|H2 Chamber| H2Pump[1x Gas Pump H2]\n  H2Pump -->|Gas Pipe| H2Gen[2x Hydrogen Generators]\n  H2Gen -->|Power Grid| Grid[Mạch điện tự cấp + Dư 640W]`,
      building: `graph LR\n  El1[Electrolyzer 1] --- El2[Electrolyzer 2] --- El3[Electrolyzer 3] --- El4[Electrolyzer 4]\n  H2[H2 Gen] --- Batt[Smart Battery]`,
      liquid: `graph LR\n  Pump[Water Pump] --> Pipe[Insulated Pipe] --> El[Electrolyzers]`,
      gas: `graph TD\n  El --> O2[Oxy 3552 g/s] --> Base[Căn cứ]\n  El --> H2[Hydro 448 g/s] --> Gen[H2 Generator]`,
      power: `graph LR\n  Gen[H2 Gen 1600W] --> SmartBatt --> Pumps[Pumps 1440W]`,
      automation: `graph LR\n  AtmoSensor[Atmo Sensor H2 > 750g] --> H2Pump\n  SmartBatt[Smart Battery] --> H2Gen`,
      shipping: `graph LR\n  NoShipping[Không dùng băng chuyền]`
    },
    performanceStats: {
      powerBalanceW: 160, // net positive!
      heatBalanceKDTU: 38.4,
      waterConsumptionKgPerSec: 4.0,
      oxygenOutputGPerSec: 3552
    }
  },
  {
    id: 'cooling_at_st_standard',
    title: 'Standard Aquatuner / Steam Turbine Cooling Loop',
    category: 'Cooling',
    description: 'Vòng lặp giải nhiệt công nghiệp tiêu chuẩn. Dùng Aquatuner ngâm trong phòng hơi nước 200°C và Steam Turbine trên đỉnh để tiêu tán nhiệt hoàn toàn.',
    author: 'ONI Academy',
    difficulty: 'Intermediate',
    tags: ['Cooling', 'Aquatuner', 'Steam Turbine', 'Heat Deletion'],
    dimensions: { x: 8, y: 7 },
    materialRequirements: {
      'Steel (Aquatuner)': 1200,
      'Plastic (Steam Turbine)': 200,
      'Igneous Rock (Insulated Tile)': 800,
      'Crude Oil / Petroleum (Dẫn nhiệt đáy)': 400
    },
    layers: {
      building: {
        layer: 'building',
        buildings: [
          { id: 'at_1', name: 'Thermo Aquatuner', type: 'Thermo Aquatuner', position: { x: 2, y: 1 }, size: { x: 3, y: 2 }, primaryMaterial: 'Steel' },
          { id: 'st_1', name: 'Steam Turbine', type: 'Steam Turbine', position: { x: 2, y: 4 }, size: { x: 5, y: 3 }, primaryMaterial: 'Lead' }
        ],
        connections: [],
        ports: []
      },
      liquid: {
        layer: 'liquid',
        buildings: [],
        connections: [
          { id: 'coolant_loop', layer: 'liquid', path: [{ x: 1, y: 2 }, { x: 3, y: 2 }, { x: 7, y: 2 }, { x: 7, y: 6 }, { x: 4, y: 6 }], element: 'Polluted Water / Super Coolant', capacity: '14 kg/s' }
        ],
        ports: []
      },
      gas: {
        layer: 'gas',
        buildings: [],
        connections: [],
        ports: []
      },
      power: {
        layer: 'power',
        buildings: [],
        connections: [
          { id: 'pow_st', layer: 'power', path: [{ x: 3, y: 2 }, { x: 4, y: 5 }], capacity: 'Conductive Wire (2kW)' }
        ],
        ports: []
      },
      automation: {
        layer: 'automation',
        buildings: [],
        connections: [
          { id: 'pipe_thermo', layer: 'automation', path: [{ x: 1, y: 2 }, { x: 2, y: 1 }], element: 'Liquid Pipe Thermo Sensor (<15°C)' }
        ],
        ports: []
      },
      shipping: {
        layer: 'shipping',
        buildings: [],
        connections: [],
        ports: []
      }
    },
    mermaidDiagrams: {
      composite: `graph TD\n  Base[Nhiệt từ Căn Cứ] -->|Polluted Water 14kg/s| AT[Thermo Aquatuner Steel]\n  AT -->|Tỏa nhiệt| SteamChamber[Phòng Hơi Nước 200°C]\n  SteamChamber -->|Chênh áp| ST[Steam Turbine]\n  ST -->|Xả nước 95°C| SteamChamber\n  ST -->|Phát điện| Grid[Lưới Điện +850W]`,
      building: `graph TD\n  ST[Steam Turbine] -->|Đặt trên| Insulation[Khối gạch cách nhiệt]\n  AT[Thermo Aquatuner] -->|Ngâm trong| Steam[Phòng Hơi Nước]`,
      liquid: `graph LR\n  LoopIn[Coolant In] --> LiquidBypass[Liquid Pipe Bypass] --> AT[Aquatuner In] --> LoopOut[Coolant Out]`,
      gas: `graph LR\n  Steam[Phòng Hơi Nước 200°C]`,
      power: `graph LR\n  ST[Steam Turbine +850W] --> PowerGrid\n  PowerGrid --> AT[Aquatuner -1200W]`,
      automation: `graph LR\n  ThermoSensor[Thermo Sensor < 15°C] --> AT`,
      shipping: `graph LR\n  None`
    },
    performanceStats: {
      powerBalanceW: -350, // ST gives back 850W
      heatBalanceKDTU: -877.5, // heat deleted!
      coolingCapacityKDTU: 819.08
    }
  },
  {
    id: 'tamer_cool_steam_vent',
    title: 'Self-Powered Cool Steam Vent Tamer',
    category: 'Tamer',
    description: 'Bộ thuần hóa Mạch nước hơi lạnh (110°C). Ngưng tụ hơi nước thành nước lỏng 95°C và tận dụng Steam Turbine ngưng tụ tự động không tốn điện năng.',
    author: 'Jahws Compendium',
    difficulty: 'Advanced',
    tags: ['Tamer', 'Cool Steam Vent', 'Water Supply', 'Self-Powered'],
    dimensions: { x: 10, y: 8 },
    materialRequirements: {
      'Steel': 1200,
      'Gold Amalgam': 800,
      'Igneous Rock': 1500
    },
    layers: {
      building: {
        layer: 'building',
        buildings: [
          { id: 'vent', name: 'Cool Steam Vent', type: 'Geyser', position: { x: 4, y: 2 }, size: { x: 2, y: 4 } },
          { id: 'at', name: 'Thermo Aquatuner', type: 'Thermo Aquatuner', position: { x: 1, y: 2 }, size: { x: 3, y: 2 }, primaryMaterial: 'Steel' },
          { id: 'st', name: 'Steam Turbine', type: 'Steam Turbine', position: { x: 3, y: 6 }, size: { x: 5, y: 3 } }
        ],
        connections: [],
        ports: []
      },
      liquid: { layer: 'liquid', buildings: [], connections: [], ports: [] },
      gas: { layer: 'gas', buildings: [], connections: [], ports: [] },
      power: { layer: 'power', buildings: [], connections: [], ports: [] },
      automation: { layer: 'automation', buildings: [], connections: [], ports: [] },
      shipping: { layer: 'shipping', buildings: [], connections: [], ports: [] }
    },
    mermaidDiagrams: {
      composite: `graph TD\n  Vent[Mạch Hơi Nước Lạnh 110°C] --> SteamRoom[Hơi nước trong phòng]\n  AT[Aquatuner Nâng Nhiệt] -->|Đốt hơi nước| ST[Steam Turbine 135°C+]\n  ST -->|Ngưng tụ| WaterOut[Nước 95°C Cấp cho SPOM]`
    },
    performanceStats: {
      powerBalanceW: 200,
      heatBalanceKDTU: -500
    }
  }
];

export function getMasterBlueprintById(id: string): ONIBlueprint | undefined {
  return MASTER_BLUEPRINTS.find(b => b.id === id);
}

export function searchBlueprints(query: string, category?: string): ONIBlueprint[] {
  let list = MASTER_BLUEPRINTS;
  if (category && category !== 'All') {
    list = list.filter(b => b.category.toLowerCase() === category.toLowerCase());
  }
  if (!query || query.trim() === '') return list;
  const q = query.toLowerCase();
  return list.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.description.toLowerCase().includes(q) ||
    b.tags.some(t => t.toLowerCase().includes(q))
  );
}
