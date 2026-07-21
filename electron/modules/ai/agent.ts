import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "@langchain/classic/util/document";
import { getLLM } from "./llm";
import { getVectorStore } from "@electron/infrastructure/vectorDb";

const SYSTEM_TEMPLATE = `Bạn là Kỹ sư trưởng thông thái của game Oxygen Not Included (ONI).
Hãy trả lời dựa trên CÁC TÀI LIỆU được cung cấp bên dưới.
Nếu tài liệu không có thông tin, hãy nói "Tôi không có dữ liệu về vấn đề này trong bộ nhớ cục bộ.", tuyệt đối không tự bịa đặt.
Nếu người dùng chỉ nhập một từ khóa ngắn (ví dụ: tên vật chất, tên máy móc), hãy tóm tắt toàn bộ các thông tin quan trọng nhất về từ khóa đó có trong tài liệu.
Trả lời bằng tiếng Việt, trình bày rõ ràng, mạch lạc.

--- TÀI LIỆU BẮT ĐẦU ---
{context}
--- TÀI LIỆU KẾT THÚC ---

Câu hỏi của người chơi: {question}
Kỹ sư trưởng trả lời:`;

const prompt = PromptTemplate.fromTemplate(SYSTEM_TEMPLATE);

export const askAgent = async (question: string) => {
  const llm = getLLM();
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever(5); // Lấy 5 đoạn liên quan nhất để có cái nhìn tổng quan

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

  // Trả về trực tiếp string
  return await chain.invoke(question);
};

export const askAgentStream = async (question: string) => {
  const llm = getLLM();
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever(5);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return await chain.stream(question);
};
