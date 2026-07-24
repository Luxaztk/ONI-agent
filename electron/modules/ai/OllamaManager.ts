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
  private static models = ['nomic-embed-text'];

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

  private static killExistingProcess() {
    if (process.platform === 'win32') {
      try {
        const { execSync } = require('child_process');
        execSync('taskkill /F /IM ollama.exe /T 2>nul', { stdio: 'ignore' });
      } catch (e) {
        // Bỏ qua nếu không có tiến trình nào đang chạy
      }
    }
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

    const zipUrl = 'https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip';
    const tempZipPath = path.join(os.tmpdir(), 'ollama-windows.zip');

    // Xóa file temp cũ nếu có để tránh ghi đè file hỏng
    if (fs.existsSync(tempZipPath)) {
      try { fs.unlinkSync(tempZipPath); } catch (e) { /* ignore */ }
    }

    onProgress('Đang tải Ollama AI Engine...', 0);
    log.info('Downloading Ollama zip...');

    const response = await fetch(zipUrl);
    if (!response.ok) throw new Error(`Failed to download Ollama: ${response.statusText}`);
    
    const totalBytes = Number(response.headers.get('content-length')) || 0;
    let downloadedBytes = 0;

    const reader = response.body?.getReader();
    
    // Đợi file stream hoàn tất việc ghi đĩa tránh race condition với AdmZip
    await new Promise<void>((resolve, reject) => {
      const fileStream = fs.createWriteStream(tempZipPath);
      fileStream.on('finish', resolve);
      fileStream.on('error', (err) => {
        fileStream.destroy();
        reject(err);
      });

      if (reader) {
        (async () => {
          try {
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
          } catch (err) {
            fileStream.destroy();
            reject(err);
          }
        })();
      } else {
        response.arrayBuffer().then(buffer => {
          fileStream.write(Buffer.from(buffer));
          fileStream.end();
        }).catch(err => {
          fileStream.destroy();
          reject(err);
        });
      }
    });

    onProgress('Đang giải nén...', 100);
    log.info('Extracting Ollama...');
    try {
      const zip = new AdmZip(tempZipPath);
      zip.extractAllTo(binDir, false);
    } catch (e: any) {
      log.warn('[OllamaManager] Cảnh báo giải nén (file DLL đang được sử dụng hoặc zip lỗi):', e.message);
    }
    
    if (fs.existsSync(tempZipPath)) {
      try {
        fs.unlinkSync(tempZipPath);
      } catch (e) {
        // Ignore temp file cleanup error
      }
    }

    if (!fs.existsSync(exePath)) {
      throw new Error('Không tìm thấy file ollama.exe sau khi giải nén. File zip có thể đã bị lỗi khi tải về.');
    }

    return exePath;
  }

  // 3. Khởi động tiến trình Ollama
  public static async start(onProgress: (status: string, percent: number) => void): Promise<number> {
    // Tiêu diệt bất kỳ tiến trình ollama.exe sót lại nào từ trước để nhả lock DLL
    this.killExistingProcess();

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

    this.ollamaProcess.on('error', (err) => {
      log.error('[Ollama] Lỗi tiến trình:', err.message);
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
    if (this.ollamaProcess && this.ollamaProcess.pid) {
      log.info(`[Ollama] Đang dừng tiến trình Ollama (PID: ${this.ollamaProcess.pid})...`);
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/F', '/T', '/PID', this.ollamaProcess.pid.toString()]);
        } else {
          this.ollamaProcess.kill('SIGKILL');
        }
      } catch (e: any) {
        log.error('[Ollama] Lỗi khi dừng tiến trình Ollama:', e.message);
      }
      this.ollamaProcess = null;
    }
  }

  public static getPort() {
    return this.port;
  }
}
