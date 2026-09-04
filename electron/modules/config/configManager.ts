import path from 'path';
import fs from 'fs';
import os from 'os';
import { app, safeStorage } from 'electron';
import log from '../../utils/logger';

export interface AzureConfig {
  endpoint: string;
  apiKey: string;
  modelName: string;
  apiVersion: string;
}

export interface OllamaConfig {
  port: number;
  model: string;
}

export interface AIConfig {
  provider: 'ollama' | 'azure';
  offlineMode?: boolean;
  azure: AzureConfig;
  ollama: OllamaConfig;
}

const DEFAULT_CONFIG: AIConfig = {
  provider: 'ollama',
  offlineMode: false,
  azure: {
    endpoint: '',
    apiKey: '',
    modelName: 'gpt-5.3-codex',
    apiVersion: '2024-06-01',
  },
  ollama: {
    port: 11434,
    model: 'nomic-embed-text',
  },
};

const getConfigFilePath = (): string => {
  try {
    if (app && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'config.json');
    }
  } catch (e) {
    // Fallback if app is not yet ready or in non-electron scope
  }
  return path.join(os.homedir(), 'AppData', 'Roaming', 'oni-agent', 'config.json');
};

class ConfigManager {
  private config: AIConfig | null = null;

  private encryptKey(plainKey: string): string {
    if (!plainKey) return '';
    try {
      if (safeStorage && safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(plainKey);
        return `enc:${encrypted.toString('base64')}`;
      }
    } catch (e: any) {
      log.warn('[ConfigManager] Không thể mã hóa bằng safeStorage, lưu dạng thường:', e.message);
    }
    return plainKey;
  }

  private decryptKey(storedKey: string): string {
    if (!storedKey) return '';
    if (storedKey.startsWith('enc:')) {
      try {
        if (safeStorage && safeStorage.isEncryptionAvailable()) {
          const base64Data = storedKey.slice(4);
          const buffer = Buffer.from(base64Data, 'base64');
          return safeStorage.decryptString(buffer);
        }
      } catch (e: any) {
        log.error('[ConfigManager] Lỗi giải mã safeStorage API key:', e.message);
        return '';
      }
    }
    return storedKey;
  }

  public getConfig(): AIConfig {
    if (this.config) {
      return this.config;
    }

    const envEndpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT || '';
    const envApiKey = process.env.AZURE_AI_FOUNDRY_API_KEY || process.env.AZURE_OPENAI_API_KEY || '';
    const envModelName = process.env.AZURE_AI_FOUNDRY_MODEL || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5.3-codex';

    const filePath = getConfigFilePath();
    if (!fs.existsSync(filePath)) {
      this.config = {
        provider: envApiKey ? 'azure' : 'ollama',
        offlineMode: false,
        azure: {
          endpoint: envEndpoint,
          apiKey: envApiKey,
          modelName: envModelName,
          apiVersion: DEFAULT_CONFIG.azure.apiVersion,
        },
        ollama: { ...DEFAULT_CONFIG.ollama },
      };
      return this.config;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);

      const azureApiKey = parsed.azure?.apiKey ? this.decryptKey(parsed.azure.apiKey) : envApiKey;

      this.config = {
        provider: parsed.provider || (envApiKey ? 'azure' : 'ollama'),
        offlineMode: Boolean(parsed.offlineMode),
        azure: {
          endpoint: parsed.azure?.endpoint || envEndpoint,
          apiKey: azureApiKey,
          modelName: parsed.azure?.modelName || envModelName,
          apiVersion: parsed.azure?.apiVersion || DEFAULT_CONFIG.azure.apiVersion,
        },
        ollama: {
          port: parsed.ollama?.port || DEFAULT_CONFIG.ollama.port,
          model: parsed.ollama?.model || DEFAULT_CONFIG.ollama.model,
        },
      };
    } catch (e: any) {
      log.error('[ConfigManager] Lỗi đọc config.json, dùng mặc định:', e.message);
      this.config = {
        provider: envApiKey ? 'azure' : 'ollama',
        offlineMode: false,
        azure: {
          endpoint: envEndpoint,
          apiKey: envApiKey,
          modelName: envModelName,
          apiVersion: DEFAULT_CONFIG.azure.apiVersion,
        },
        ollama: { ...DEFAULT_CONFIG.ollama },
      };
    }

    return this.config;
  }

  public saveConfig(newConfig: AIConfig): AIConfig {
    const filePath = getConfigFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Preserve existing decrypted key if user saved with masked key
    let finalApiKey = newConfig.azure.apiKey.trim();
    if (finalApiKey.includes('...') || finalApiKey === '••••••••') {
      const current = this.getConfig();
      finalApiKey = current.azure.apiKey;
    }

    const encryptedKey = this.encryptKey(finalApiKey);

    const toSave = {
      provider: newConfig.provider,
      offlineMode: Boolean(newConfig.offlineMode),
      azure: {
        endpoint: newConfig.azure.endpoint.trim(),
        apiKey: encryptedKey,
        modelName: newConfig.azure.modelName.trim(),
        apiVersion: (newConfig.azure.apiVersion || '2024-06-01').trim(),
      },
      ollama: {
        port: Number(newConfig.ollama.port) || 11434,
        model: newConfig.ollama.model.trim(),
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(toSave, null, 2), 'utf-8');

    // Update in-memory config
    this.config = {
      provider: newConfig.provider,
      offlineMode: Boolean(newConfig.offlineMode),
      azure: {
        endpoint: newConfig.azure.endpoint.trim(),
        apiKey: finalApiKey,
        modelName: newConfig.azure.modelName.trim(),
        apiVersion: (newConfig.azure.apiVersion || '2024-06-01').trim(),
      },
      ollama: {
        port: Number(newConfig.ollama.port) || 11434,
        model: newConfig.ollama.model.trim(),
      },
    };

    log.info(`[ConfigManager] Đã lưu cấu hình AI thành công (Provider: ${this.config.provider})`);
    return this.config;
  }

  public getMaskedConfig(): AIConfig {
    const cfg = this.getConfig();
    let maskedKey = '';
    if (cfg.azure.apiKey) {
      if (cfg.azure.apiKey.length > 8) {
        maskedKey = `${cfg.azure.apiKey.slice(0, 4)}...${cfg.azure.apiKey.slice(-4)}`;
      } else {
        maskedKey = '••••••••';
      }
    }
    return {
      ...cfg,
      azure: {
        ...cfg.azure,
        apiKey: maskedKey,
      },
    };
  }
}

export const configManager = new ConfigManager();
