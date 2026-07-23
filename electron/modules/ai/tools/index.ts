import { DynamicTool } from "@langchain/core/tools";
import fs from "fs";
import path from "path";
import { getVectorStore } from "@electron/infrastructure/vectorDb";
import { formatDocumentsAsString } from "@langchain/classic/util/document";
import { rewriteQueryWithLLM } from "../queryRewriter";
import { rerankDocuments } from "../reranker";

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

// 2. Tool tính toán kỹ thuật ONI
export const oniCalculatorTool = new DynamicTool({
  name: "oni_calculator",
  description: "Tính toán kỹ thuật ONI (Ví dụ: tính lượng Oxi cho N đệ Duplicant, tính kDTU/s làm mát của Aquatuner). Input dạng JSON string hoặc chuỗi miêu tả phép tính.",
  func: async (input: string) => {
    const lower = input.toLowerCase();
    // 1 Duplicant tiêu thụ 100g/s Oxi
    if (lower.includes("duplicant") || lower.includes("đệ") || lower.includes("dân")) {
      const countMatch = lower.match(/(\d+)/);
      const count = countMatch ? parseInt(countMatch[1], 10) : 1;
      const totalO2PerSec = count * 100; // 100g/s per dup
      const electrolyzersNeeded = (totalO2PerSec / 888).toFixed(2); // 1 Electrolyzer tạo 888g/s O2
      return `[ONI Calculator] Cho ${count} Duplicants:\n- Tổng lượng Oxi cần: ${totalO2PerSec} g/s (${(totalO2PerSec / 1000).toFixed(2)} kg/s).\n- Số máy điện phân Electrolyzer tối thiểu: ${electrolyzersNeeded} máy.`;
    }
    // Aquatuner SHC calculation (14kg/s * SHC * 14°C)
    if (lower.includes("aquatuner") || lower.includes("shc") || lower.includes("coolant")) {
      let shc = 4.179; // Water
      let liquidName = "Nước thường (Water)";
      if (lower.includes("super coolant") || lower.includes("siêu chất làm mát")) {
        shc = 8.44;
        liquidName = "Super Coolant";
      } else if (lower.includes("polluted water") || lower.includes("nước bẩn")) {
        shc = 4.179;
        liquidName = "Nước bẩn (Polluted Water)";
      } else if (lower.includes("petroleum") || lower.includes("dầu hỏa")) {
        shc = 1.76;
        liquidName = "Petroleum";
      }
      const kdtuPerSec = (14 * shc * 14).toFixed(2); // 14 kg/s * SHC * 14°C DTU/g = kDTU/s
      return `[ONI Calculator] Làm mát bằng Aquatuner dùng ${liquidName}:\n- Công suất giải nhiệt: ${kdtuPerSec} kDTU/s.\n- Giảm nhiệt độ chất lỏng: 14°C trên mỗi vòng lặp (14 kg/s).`;
    }
    return `[ONI Calculator] Đã nhận yêu cầu tính toán: "${input}". Công thức tính toán chuẩn: 1 Dup = 100g O2/s, 1 Electrolyzer = 888g O2/s + 112g H2/s.`;
  }
});

// 3. Tool tra cứu LanceDB Vector Store
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

export const oniTools = [vectorSearchTool, recipeLookupTool, oniCalculatorTool];
