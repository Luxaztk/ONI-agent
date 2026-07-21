import { ChatOllama } from "@langchain/ollama";
import { OllamaManager } from "./OllamaManager";

export const getLLM = () => {
  const port = process.env.OLLAMA_API_PORT || OllamaManager.getPort();
  return new ChatOllama({
    baseUrl: `http://127.0.0.1:${port}`,
    model: "gemma:2b",
    temperature: 0, // RAG cần sự chính xác, ít sáng tạo
  });
};
