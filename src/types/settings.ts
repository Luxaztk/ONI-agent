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
