import { Document } from "@langchain/core/documents";
import { getLLM } from "./llm";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const RERANK_PROMPT = PromptTemplate.fromTemplate(
  `Bạn là hệ thống đánh giá mức độ liên quan tri thức game Oxygen Not Included.
Dưới đây là danh sách {count} tài liệu được trích xuất từ bộ nhớ.

Câu hỏi của người chơi: {question}

Danh sách các đoạn tài liệu:
{candidates}

Nhiệm vụ: Hãy lọc ra và chỉ trả về danh sách các chỉ số (Index: 1, 2, 3...) của các đoạn tài liệu THỰC SỰ CHỦ CHỐT giúp trả lời chính xác nhất câu hỏi trên.
Trả về kết quả dưới dạng danh sách số phân cách bằng dấu phẩy (Ví dụ: 1, 3, 5, 8). Không giải thích gì thêm.`
);

export const rerankDocuments = async (
  question: string,
  docs: Document[],
  topK: number = 8
): Promise<Document[]> => {
  if (docs.length <= topK) return docs;

  try {
    const candidatesStr = docs
      .map((d, idx) => `[Document ${idx + 1}] (${d.metadata?.title || "Guide"})\n${d.pageContent.slice(0, 300)}...`)
      .join("\n\n");

    const llm = getLLM();
    const chain = RERANK_PROMPT.pipe(llm).pipe(new StringOutputParser());
    const response = await chain.invoke({
      question,
      count: docs.length,
      candidates: candidatesStr
    });

    // Parse các index được chọn (Ví dụ: "1, 3, 5, 8")
    const selectedIndices = response
      .split(/[,;\s]+/)
      .map(s => parseInt(s.trim().replace(/\D/g, ""), 10) - 1)
      .filter(idx => !isNaN(idx) && idx >= 0 && idx < docs.length);

    if (selectedIndices.length > 0) {
      const reranked = selectedIndices.map(idx => docs[idx]).slice(0, topK);
      console.log(`[LLM Reranker] Đã lọc từ ${docs.length} xuống ${reranked.length} đoạn tri thức chất lượng cao nhất.`);
      return reranked;
    }
  } catch (e: any) {
    console.warn("[LLM Reranker] Lỗi khi rerank bằng LLM, fallback dùng Top-K mặc định:", e.message);
  }

  return docs.slice(0, topK);
};
