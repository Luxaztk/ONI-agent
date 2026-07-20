import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "@langchain/classic/util/document";
import { getLLM } from "./llm";
import { getVectorStore } from "../../infrastructure/vectorDb";

const SYSTEM_TEMPLATE = `Bạn là Kỹ sư trưởng thông thái của game Oxygen Not Included (ONI).
Hãy trả lời câu hỏi dựa trên CÁC TÀI LIỆU được cung cấp bên dưới.
Nếu tài liệu không có thông tin, hãy nói "Tôi không có dữ liệu về vấn đề này trong bộ nhớ cục bộ.", tuyệt đối không tự bịa đặt (hallucinate).
Trả lời bằng tiếng Việt.

--- TÀI LIỆU BẮT ĐẦU ---
{context}
--- TÀI LIỆU KẾT THÚC ---

Câu hỏi: {question}
Kỹ sư trưởng trả lời:`;

const prompt = PromptTemplate.fromTemplate(SYSTEM_TEMPLATE);

export const askAgent = async (question: string) => {
  const llm = getLLM();
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever(2); // Lấy 2 đoạn liên quan nhất

  // Xây dựng chuỗi (Chain) bằng LCEL
  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  // Trả về trực tiếp string (ở version sau sẽ tích hợp Streaming)
  return await chain.invoke(question);
};
