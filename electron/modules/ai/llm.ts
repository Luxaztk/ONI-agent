import { ChatOllama } from "@langchain/ollama";

export const getLLM = () => {
  return new ChatOllama({
    baseUrl: "http://localhost:11434", // Ollama default port
    model: "gemma:2b",
    temperature: 0.1, // RAG cần sự chính xác, ít sáng tạo
  });
};
