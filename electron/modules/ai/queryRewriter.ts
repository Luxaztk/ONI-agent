import { getLLM } from "./llm";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const REWRITE_PROMPT = PromptTemplate.fromTemplate(
  `Bạn là chuyên gia phân tích truy vấn game Oxygen Not Included (ONI).
Nhiệm vụ của bạn là đọc câu hỏi của người chơi và viết lại/mở rộng thành một câu truy vấn tìm kiếm ngắn gọn nhưng giàu từ khóa chuyên môn (cả tiếng Anh lẫn tiếng Việt) để tìm tài liệu RAG chính xác nhất.

Quy tắc:
1. Giải mã toàn bộ các từ viết tắt trong game ONI (Ví dụ: SPOM -> Self-Powering Oxygen Module Electrolyzer; AT/ST -> Thermo Aquatuner Steam Turbine; TE -> Thermal Exchanger).
2. Nếu câu hỏi ngắn (chỉ chứa tên máy móc, vật thể), hãy tự động bổ sung các thuật ngữ kỹ thuật liên quan (ví dụ: nguyên liệu, nhiệt độ, công dụng).
3. Chỉ trả về duy nhất chuỗi truy vấn đã được mở rộng, không giải thích gì thêm.

Câu hỏi của người chơi: {question}
Truy vấn mở rộng:`
);

export const rewriteQueryWithLLM = async (question: string): Promise<string> => {
  try {
    const llm = getLLM();
    const chain = REWRITE_PROMPT.pipe(llm).pipe(new StringOutputParser());
    const rewritten = await chain.invoke({ question });
    const cleaned = rewritten.trim().replace(/^["']|["']$/g, "");
    console.log(`[QueryRewriter] Gốc: "${question}" -> Mở rộng: "${cleaned}"`);
    return cleaned || question;
  } catch (e: any) {
    console.warn(`[QueryRewriter] Lỗi khi dùng LLM rewrite, dùng câu hỏi gốc:`, e.message);
    return question;
  }
};
