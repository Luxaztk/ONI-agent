import { DynamicTool } from "@langchain/core/tools";
import fs from "fs";
import path from "path";
import { getVectorStore } from "../../../infrastructure/vectorDb";
import { formatDocumentsAsString } from "@langchain/classic/util/document";
import { rewriteQueryWithLLM } from "../queryRewriter";
import { rerankDocuments } from "../reranker";
import {
  calculateSPOM,
  calculateATSTCooling
} from "../../../../src/utils/oniCalculators";
import { searchBlueprints, getMasterBlueprintById } from "../../../../src/utils/blueprintRepository";
import type { ONIBlueprint } from "../../../../src/types/blueprint";

// 1. Tool tra cứu công thức chất liệu & vật thể
export const recipeLookupTool = new DynamicTool({
  name: "recipe_lookup",
  description: "Tra cứu thông số kỹ thuật, điểm nóng chảy, nhiệt dung riêng (SHC) của các chất liệu và vật thể trong game ONI.",
  func: async (input: string) => {
    try {
      const jsonPath = path.join(process.cwd(), "data", "oni_materials.json");
      if (!fs.existsSync(jsonPath)) return "Không tìm thấy dữ liệu oni_materials.json.";
      const materials = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const matched = materials.filter((m: any) =>
        m.name.toLowerCase().includes(input.toLowerCase()) ||
        m.description.toLowerCase().includes(input.toLowerCase())
      );
      if (matched.length === 0) return `Không tìm thấy thông tin chất liệu cho "${input}".`;
      return JSON.stringify(matched, null, 2);
    } catch (e: any) {
      return `Lỗi khi tra cứu chất liệu: ${e.message}`;
    }
  }
});

// 2. Tool tính toán kỹ thuật ONI chuẩn xác (SPOM, Cooling)
export const oniCalculatorTool = new DynamicTool({
  name: "oni_calculator",
  description: "Tính toán kỹ thuật ONI chuẩn xác (SPOM cho N Duplicants, AT/ST Cooling, Nông nghiệp & Geyser Pipeline Balance). Input: Mô tả phép tính.",
  func: async (input: string) => {
    const lower = input.toLowerCase();
    
    // SPOM calculation
    if (lower.includes("duplicant") || lower.includes("đệ") || lower.includes("spom") || lower.includes("oxy")) {
      const countMatch = lower.match(/(\d+)/);
      const count = countMatch ? parseInt(countMatch[1], 10) : 8;
      const res = calculateSPOM(count);
      return `[ONI SPOM Calculator] Kết quả tính cho ${res.dupCount} Duplicants:\n` +
        `- Nhu cầu Oxy: ${res.requiredO2GPerSec} g/s (${(res.requiredO2GPerSec / 1000).toFixed(2)} kg/s)\n` +
        `- Số máy điện phân Electrolyzer: ${res.electrolyzerCount} máy\n` +
        `- Nước sạch cần cấp: ${res.waterRequiredKgPerSec} kg/s\n` +
        `- Bơm Oxy / Bơm Hydro cần: ${res.o2PumpsCount} Bơm O2 / ${res.h2PumpsCount} Bơm H2\n` +
        `- Cân bằng điện: ${res.netPowerW >= 0 ? '+' : ''}${res.netPowerW}W (${res.isSelfPowered ? 'Self-Powered Tự Cấp Điện' : 'Thiếu Điện'})\n` +
        `- Bản vẽ đề xuất: ${res.recommendedBlueprintId}`;
    }

    // Cooling calculation
    if (lower.includes("aquatuner") || lower.includes("cooling") || lower.includes("giải nhiệt") || lower.includes("steam turbine")) {
      const countMatch = lower.match(/(\d+)/);
      const targetDTU = countMatch ? parseInt(countMatch[1], 10) : 800;
      let coolant = "Nước bẩn (Polluted Water)";
      if (lower.includes("super coolant")) coolant = "Super Coolant";
      else if (lower.includes("petroleum")) coolant = "Petroleum (Dầu hỏa)";
      
      const res = calculateATSTCooling(coolant, targetDTU);
      return `[ONI AT/ST Cooling Calculator] Giải nhiệt ${res.targetDTUPerSec} kDTU/s bằng ${res.coolantName}:\n` +
        `- Số Aquatuner cần: ${res.aquatunerCount} máy (Công suất mỗi máy: ${res.aquatunerCoolingPerUnitKDTU} kDTU/s)\n` +
        `- Tổng làm mát: ${res.totalAquatunerCoolingKDTU} kDTU/s\n` +
        `- Số Steam Turbine cần để tiêu tán nhiệt: ${res.steamTurbineCount} máy\n` +
        `- Cân bằng điện: ${res.netPowerW}W\n` +
        `- Bản vẽ đề xuất: ${res.recommendedBlueprintId}`;
    }

    return `[ONI Calculator] Đã nhận yêu cầu: "${input}". Vui lòng chỉ định rõ tính SPOM cho bao nhiêu Duplicants hoặc tính làm mát bao nhiêu kDTU/s.`;
  }
});

// 3. Tool tìm kiếm Master Blueprints
export const blueprintSearchTool = new DynamicTool({
  name: "blueprint_search",
  description: "Tìm kiếm bản vẽ thiết kế Master Blueprints trong kho dữ liệu ONI (SPOM, Cooling, Boiler, Tamer, Storage...).",
  func: async (input: string) => {
    const results = searchBlueprints(input);
    if (results.length === 0) return `Không tìm thấy bản vẽ phù hợp cho từ khóa "${input}".`;
    return JSON.stringify(results.map((b: ONIBlueprint) => ({
      id: b.id,
      title: b.title,
      category: b.category,
      description: b.description,
      difficulty: b.difficulty,
      tags: b.tags,
      dimensions: b.dimensions,
      materialRequirements: b.materialRequirements
    })), null, 2);
  }
});

// 4. Tool render sơ đồ Mermaid bản vẽ
export const blueprintRenderTool = new DynamicTool({
  name: "blueprint_render",
  description: "Xuất sơ đồ luồng Mermaid phân tách 6 lớp Overlays cho 1 bản vẽ thiết kế cụ thể theo ID.",
  func: async (input: string) => {
    const bp = getMasterBlueprintById(input.trim()) || searchBlueprints(input)[0];
    if (!bp) return `Không tìm thấy bản vẽ với ID/tên "${input}".`;
    return `[Master Blueprint: ${bp.title}]\n` +
      `Category: ${bp.category} | Difficulty: ${bp.difficulty}\n\n` +
      `Sơ đồ Mermaid Composite Flow:\n\`\`\`mermaid\n${bp.mermaidDiagrams?.composite || 'graph TD\n  Building --> Pipe'}\n\`\`\``;
  }
});

// 5. Tool tra cứu LanceDB Vector Store
export const vectorSearchTool = new DynamicTool({
  name: "vector_search",
  description: "Tra cứu bài viết hướng dẫn, Wiki và bản thiết kế từ cơ sở dữ liệu LanceDB.",
  func: async (input: string) => {
    try {
      const vectorStore = await getVectorStore();
      const rewrittenQuery = await rewriteQueryWithLLM(input);
      const docs = await vectorStore.similaritySearch(rewrittenQuery, 25);
      const rerankedDocs = await rerankDocuments(input, docs, 8);
      return formatDocumentsAsString(rerankedDocs);
    } catch (e: any) {
      return `Lỗi khi tìm kiếm vector: ${e.message}`;
    }
  }
});

export const oniTools = [
  vectorSearchTool,
  recipeLookupTool,
  oniCalculatorTool,
  blueprintSearchTool,
  blueprintRenderTool
];
