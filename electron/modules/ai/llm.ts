import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import { OllamaManager } from "./OllamaManager";
import { configManager } from "../config/configManager";
import log from "../../utils/logger";

export const getLLM = () => {
  const config = configManager.getConfig();

  // 1. Kiểm tra cấu hình cài đặt từ người dùng (User Config Settings)
  if (config.provider === 'azure' && config.azure.apiKey && config.azure.endpoint) {
    let baseURL = config.azure.endpoint.trim();
    if (baseURL.endsWith('/')) {
      baseURL = baseURL.slice(0, -1);
    }

    const isV1Endpoint = baseURL.endsWith('/v1') || baseURL.includes('/v1/') || baseURL.includes('/openai/v1');
    const apiVersion = config.azure.apiVersion?.trim();
    const modelName = config.azure.modelName || "gpt-5.3-codex";

    const configuration: any = {
      baseURL: baseURL,
      defaultHeaders: {
        "api-key": config.azure.apiKey,
      },
    };

    if (!isV1Endpoint && apiVersion) {
      configuration.defaultQuery = {
        "api-version": apiVersion,
      };
    }

    log.info(`[LLM] Khởi tạo Enterprise Azure OpenAI / Foundry (Settings): ${modelName} tại ${baseURL}`);

    return new ChatOpenAI({
      configuration,
      apiKey: config.azure.apiKey,
      modelName: modelName,
      temperature: 0,
      maxTokens: 4096,
      timeout: 60000,
    });
  }

  // 2. Dự phòng đọc biến môi trường (Environment Variables Fallback)
  const azureApiKey = process.env.AZURE_AI_FOUNDRY_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT;
  const envModelName = process.env.AZURE_AI_FOUNDRY_MODEL || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-5.3-codex";

  const isAzureEnvConfigured = azureApiKey && azureEndpoint && 
    azureApiKey !== 'your_azure_api_key_here' && 
    !azureApiKey.includes('your_');

  if (isAzureEnvConfigured) {
    let baseURL = azureEndpoint.trim();
    if (baseURL.endsWith('/')) {
      baseURL = baseURL.slice(0, -1);
    }

    const isV1Endpoint = baseURL.endsWith('/v1') || baseURL.includes('/v1/') || baseURL.includes('/openai/v1');
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

    const configuration: any = {
      baseURL: baseURL,
      defaultHeaders: {
        "api-key": azureApiKey,
      },
    };

    if (!isV1Endpoint && apiVersion) {
      configuration.defaultQuery = {
        "api-version": apiVersion,
      };
    }

    log.info(`[LLM] Khởi tạo Enterprise Azure OpenAI / Foundry (Env): ${envModelName} tại ${baseURL}`);

    return new ChatOpenAI({
      configuration,
      apiKey: azureApiKey,
      modelName: envModelName,
      temperature: 0,
      maxTokens: 4096,
      timeout: 60000,
    });
  }

  // 3. Fallback dùng Ollama Cục Bộ
  const port = config.ollama.port || OllamaManager.getPort() || process.env.OLLAMA_API_PORT || 11434;
  const localModel = config.ollama.model || process.env.OLLAMA_MODEL || "nomic-embed-text";
  log.info(`[LLM] Sử dụng Ollama Cục Bộ (Port: ${port}, Model: ${localModel})`);

  return new ChatOllama({
    baseUrl: `http://127.0.0.1:${port}`,
    model: localModel,
    temperature: 0,
  });
};
