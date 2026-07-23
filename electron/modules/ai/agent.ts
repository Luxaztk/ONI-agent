import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "@langchain/classic/util/document";
import { Document } from "@langchain/core/documents";
import { getLLM } from "./llm";
import { getVectorStore } from "@electron/infrastructure/vectorDb";
import { rewriteQueryWithLLM } from "./queryRewriter";
import { rerankDocuments } from "./reranker";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_TEMPLATE = `Bạn là Kỹ sư trưởng thông thái của game Oxygen Not Included (ONI).
Hãy trả lời dựa trên CÁC TÀI LIỆU được cung cấp bên dưới.
Nếu tài liệu không có thông tin, hãy nói "Tôi không có dữ liệu về vấn đề này trong bộ nhớ cục bộ.", tuyệt đối không tự bịa đặt.
Nếu người dùng chỉ nhập một từ khóa ngắn (ví dụ: tên vật chất, tên máy móc), hãy tóm tắt toàn bộ các thông tin quan trọng nhất về từ khóa đó có trong tài liệu.
Trả lời bằng tiếng Việt, trình bày rõ ràng, mạch lạc, chính xác các thông số kỹ thuật (SHC, nhiệt độ, công suất kDTU/s).

{history_context}

--- TÀI LIỆU BẮT ĐẦU ---
{context}
--- TÀI LIỆU KẾT THÚC ---

Câu hỏi của người chơi: {question}
Kỹ sư trưởng trả lời:`;

const prompt = PromptTemplate.fromTemplate(SYSTEM_TEMPLATE);

export const askAgentStream = async (question: string, history: ChatMessage[] = []) => {
  const llm = getLLM();
  const vectorStore = await getVectorStore();

  // 1. LLM Query Rewriter (Mở rộng từ khóa thông minh bằng LLM)
  const rewrittenQuery = await rewriteQueryWithLLM(question);

  // 2. Tra cứu RAG k=25 từ LanceDB (Xử lý an toàn nếu chưa khởi tạo bảng)
  let candidateDocs: Document[] = [];
  try {
    candidateDocs = await vectorStore.similaritySearch(rewrittenQuery, 25);
  } catch (e: any) {
    console.warn("[Agent] LanceDB similaritySearch error (Chưa khởi tạo bảng hoặc bảng trống):", e.message);
  }

  // 3. LLM Cross-Reranker (Chọn ra 8 đoạn xuất sắc nhất)
  const topDocs = await rerankDocuments(question, candidateDocs, 8);
  const contextText = formatDocumentsAsString(topDocs);

  // 4. Lịch sử trò chuyện Multi-Turn
  let historyText = "";
  if (history && history.length > 0) {
    const recentHistory = history.slice(-6); // Lấy 6 tin nhắn gần nhất
    historyText = "--- LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY ---\n" +
      recentHistory.map(m => `${m.role === "user" ? "Người chơi" : "Kỹ sư trưởng"}: ${m.content}`).join("\n") +
      "\n-----------------------------------\n";
  }

  const chain = RunnableSequence.from([
    {
      context: () => contextText,
      question: () => question,
      history_context: () => historyText,
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return await chain.stream(question);
};

export const askAgent = async (question: string, history: ChatMessage[] = []) => {
  const llm = getLLM();
  const vectorStore = await getVectorStore();

  const rewrittenQuery = await rewriteQueryWithLLM(question);

  let candidateDocs: Document[] = [];
  try {
    candidateDocs = await vectorStore.similaritySearch(rewrittenQuery, 25);
  } catch (e: any) {
    console.warn("[Agent] LanceDB similaritySearch error in askAgent:", e.message);
  }

  const topDocs = await rerankDocuments(question, candidateDocs, 8);
  const contextText = formatDocumentsAsString(topDocs);

  let historyText = "";
  if (history && history.length > 0) {
    const recentHistory = history.slice(-6);
    historyText = "--- LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY ---\n" +
      recentHistory.map(m => `${m.role === "user" ? "Người chơi" : "Kỹ sư trưởng"}: ${m.content}`).join("\n") +
      "\n-----------------------------------\n";
  }

  const chain = RunnableSequence.from([
    {
      context: () => contextText,
      question: () => question,
      history_context: () => historyText,
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return await chain.invoke(question);
};
