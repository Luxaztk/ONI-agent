import { ChatOpenAI } from "@langchain/openai";
import log from "../../utils/logger";

export const getLLM = () => {
  const azureApiKey = process.env.AZURE_AI_FOUNDRY_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT;
  const modelName = process.env.AZURE_AI_FOUNDRY_MODEL || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-5.3-codex";

  if (!azureApiKey || !azureEndpoint) {
    throw new Error("Thiếu cấu hình AZURE_AI_FOUNDRY_API_KEY hoặc AZURE_AI_FOUNDRY_ENDPOINT trong file .env!");
  }

  let baseURL = azureEndpoint.trim();
  if (baseURL.endsWith('/')) {
    baseURL = baseURL.slice(0, -1);
  }

  // Tự động chuẩn hóa URL cho Azure OpenAI /v1 endpoint nếu cần
  if (baseURL.includes('openai.azure.com') && !baseURL.includes('/openai/v1') && !baseURL.endsWith('/v1')) {
    baseURL = `${baseURL}/openai/v1`;
  }

  log.info(`[LLM] Khởi tạo Enterprise Azure OpenAI / Foundry model: ${modelName} tại ${baseURL}`);

  return new ChatOpenAI({
    configuration: {
      baseURL: baseURL,
      defaultHeaders: {
        "api-key": azureApiKey,
      },
    },
    apiKey: azureApiKey,
    modelName: modelName,
    temperature: 0,
    maxTokens: 4096,
    timeout: 60000,
  });
};
