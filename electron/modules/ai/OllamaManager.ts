import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn, ChildProcess } from 'child_process';
import net from 'net';
import AdmZip from 'adm-zip';
import log from '../../utils/logger';

const getUserDataPath = () => {
  if (process.versions.electron) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('electron').app.getPath('userData');
  }
  return path.join(os.homedir(), 'AppData', 'Roaming', 'oni-agent');
};

export class OllamaManager {
  private static ollamaProcess: ChildProcess | null = null;
  private static port = 11434;
  private static models = ['gemma:2b', 'nomic-embed-text'];

  // 1. Tìm port trống
  private static async findFreePort(): Promise<number> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(0, '127.0.0.1', () => {
        const port = (server.address() as net.AddressInfo).port;
        server.close(() => resolve(port));
      });
    });
  }

  // 2. Kiểm tra và tải binary
  private static async ensureBinary(onProgress: (status: string, percent: number) => void): Promise<string> {
    const binDir = path.join(getUserDataPath(), 'bin');
    const exePath = path.join(binDir, 'ollama.exe');

    if (fs.existsSync(exePath)) {
      return exePath;
    }

    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    onProgress('Đang tải Ollama AI Engine...', 0);
    log.info('Downloading Ollama zip...');
    
    const zipUrl = 'https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip';
    const tempZipPath = path.join(os.tmpdir(), 'ollama-windows.zip');

    const response = await fetch(zipUrl);
    if (!response.ok) throw new Error(`Failed to download Ollama: ${response.statusText}`);
    
    const totalBytes = Number(response.headers.get('content-length')) || 0;
    let downloadedBytes = 0;

    const fileStream = fs.createWriteStream(tempZipPath);
    const reader = response.body?.getReader();
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        downloadedBytes += value.length;
        if (totalBytes > 0) {
          onProgress('Đang tải Ollama AI Engine...', Math.round((downloadedBytes / totalBytes) * 100));
        }
        fileStream.write(value);
      }
      fileStream.end();
    } else {
      // Fallback if reader not available (e.g. Node 18 fetch without streaming body properly typed)
      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(tempZipPath, Buffer.from(arrayBuffer));
      onProgress('Đang tải Ollama AI Engine...', 100);
    }

    onProgress('Đang giải nén...', 100);
    log.info('Extracting Ollama...');
    const zip = new AdmZip(tempZipPath);
    zip.extractAllTo(binDir, true);
    
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }

    return exePath;
  }

  // 3. Khởi động tiến trình Ollama
  public static async start(onProgress: (status: string, percent: number) => void): Promise<number> {
    const exePath = await this.ensureBinary(onProgress);
    this.port = await this.findFreePort();
    
    // Set environment variable to bypass Vite module duplication chunking issues
    process.env.OLLAMA_API_PORT = this.port.toString();

    onProgress('Đang khởi động AI Engine...', 100);
    log.info(`Starting Ollama on port ${this.port}...`);

    const modelsDir = path.join(getUserDataPath(), 'models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    this.ollamaProcess = spawn(exePath, ['serve'], {
      env: {
        ...process.env,
        OLLAMA_HOST: `127.0.0.1:${this.port}`,
        OLLAMA_MODELS: modelsDir,
      },
      windowsHide: true,
    });

    this.ollamaProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      if (text.includes('level=ERROR') || text.includes('level=WARN')) log.error(`[Ollama] ${text}`);
    });
    this.ollamaProcess.stderr?.on('data', (data) => {
      const text = data.toString();
      if (text.includes('level=ERROR') || text.includes('level=WARN')) log.error(`[Ollama] ${text}`);
    });

    // Đợi server khởi động
    await this.waitForServer();

    // 4. Kiểm tra và tải model
    await this.ensureModels(onProgress);

    return this.port;
  }

  private static async waitForServer(): Promise<void> {
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/api/tags`);
        if (res.ok) return;
      } catch (e) {
        // Ignore
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error('Ollama server failed to start in time.');
  }

  private static async ensureModels(onProgress: (status: string, percent: number) => void): Promise<void> {
    const res = await fetch(`http://127.0.0.1:${this.port}/api/tags`);
    const data = await res.json();
    const existingModels = data.models?.map((m: any) => m.name) || [];

    for (const model of this.models) {
      if (!existingModels.includes(model) && !existingModels.includes(`${model}:latest`)) {
        log.info(`Model ${model} missing. Pulling blocking...`);
        await this.pullModel(model, onProgress);
      } else {
        log.info(`Model ${model} exists. Checking for updates in background...`);
        // Chạy ngầm việc pull để cập nhật model nếu có bản mới, không block UI
        this.pullModel(model, () => {}).catch(e => log.error(`Background update failed for ${model}:`, e));
      }
    }
  }

  private static async pullModel(model: string, onProgress: (status: string, percent: number) => void): Promise<void> {
    const response = await fetch(`http://127.0.0.1:${this.port}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model })
    });

    if (!response.ok) throw new Error(`Failed to pull model ${model}`);
    
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.total && parsed.completed) {
            const pct = Math.round((parsed.completed / parsed.total) * 100);
            onProgress(`Đang tải Model ${model}...`, pct);
          } else {
            onProgress(`Đang xử lý Model ${model}... ${parsed.status}`, 100);
          }
        } catch (e) {
          // parse error on chunk boundary, ignore
        }
      }
    }
  }

  public static stop() {
    if (this.ollamaProcess) {
      this.ollamaProcess.kill();
      this.ollamaProcess = null;
    }
  }

  public static getPort() {
    return this.port;
  }
}
