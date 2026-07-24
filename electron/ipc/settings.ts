import { ipcMain } from 'electron';
import { configManager, type AIConfig } from '../modules/config/configManager';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import log from '../utils/logger';

export const setupSettingsIPC = () => {
  ipcMain.handle('get-settings', async () => {
    try {
      return configManager.getMaskedConfig();
    } catch (e: any) {
      log.error('[SettingsIPC] Lỗi get-settings:', e);
      throw e;
    }
  });

  ipcMain.handle('save-settings', async (_event, config: AIConfig) => {
    try {
      configManager.saveConfig(config);
      return { success: true, config: configManager.getMaskedConfig() };
    } catch (e: any) {
      log.error('[SettingsIPC] Lỗi save-settings:', e);
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('test-llm-connection', async (_event, targetConfig: AIConfig) => {
    try {
      if (targetConfig.provider === 'azure') {
        const envApiKey = process.env.AZURE_AI_FOUNDRY_API_KEY || process.env.AZURE_OPENAI_API_KEY || '';
        const envEndpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT || '';
        const envModelName = process.env.AZURE_AI_FOUNDRY_MODEL || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5.3-codex';

        let apiKey = targetConfig.azure.apiKey.trim();
        if (!apiKey || apiKey.includes('...') || apiKey === '••••••••') {
          apiKey = configManager.getConfig().azure.apiKey || envApiKey;
        }

        if (!apiKey) {
          return { success: false, error: 'Chưa nhập Azure API Key.' };
        }

        let baseURL = targetConfig.azure.endpoint.trim() || envEndpoint;
        if (!baseURL) {
          return { success: false, error: 'Chưa nhập Azure Endpoint URL.' };
        }

        if (baseURL.endsWith('/')) {
          baseURL = baseURL.slice(0, -1);
        }

        const isV1Endpoint = baseURL.endsWith('/v1') || baseURL.includes('/v1/') || baseURL.includes('/openai/v1');
        const apiVersion = targetConfig.azure.apiVersion?.trim();
        const modelName = targetConfig.azure.modelName.trim() || envModelName;

        log.info(`[SettingsIPC] Đang thử kết nối Azure OpenAI at ${baseURL} (Model: ${modelName}, isV1: ${isV1Endpoint})...`);

        const configuration: any = {
          baseURL: baseURL,
          defaultHeaders: {
            'api-key': apiKey,
          },
        };

        // Nếu không phải là v1 endpoint và có apiVersion thì bổ sung query param api-version
        if (!isV1Endpoint && apiVersion) {
          configuration.defaultQuery = {
            'api-version': apiVersion,
          };
        }

        const testLlm = new ChatOpenAI({
          configuration: configuration,
          apiKey: apiKey,
          modelName: modelName,
          temperature: 0,
          maxTokens: 100,
          timeout: 15000,
        });

        await testLlm.invoke('Ping');
        return {
          success: true,
          message: `Kết nối Azure OpenAI thành công! Model ${modelName} đã phản hồi.`,
        };
      } else {
        const port = targetConfig.ollama.port || 11434;
        const model = targetConfig.ollama.model || 'nomic-embed-text';

        log.info(`[SettingsIPC] Đang thử kết nối Ollama local at http://127.0.0.1:${port}...`);

        const testLlm = new ChatOllama({
          baseUrl: `http://127.0.0.1:${port}`,
          model: model,
          temperature: 0,
        });

        await testLlm.invoke('Ping');
        return {
          success: true,
          message: `Kết nối Ollama Local thành công! (Port ${port}, Model ${model}).`,
        };
      }
    } catch (e: any) {
      log.error('[SettingsIPC] Lỗi kết nối thử nghiệm:', e.message);
      return {
        success: false,
        error: `Kết nối thất bại: ${e.message || 'Không thể kết nối tới dịch vụ AI.'}`,
      };
    }
  });
};
