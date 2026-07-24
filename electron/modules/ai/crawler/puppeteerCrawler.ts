import puppeteer from 'puppeteer-core';
import log from '../../../utils/logger';

export interface PuppeteerCrawlResult {
  url: string;
  title: string;
  content: string;
  html: string;
}

export class PuppeteerCrawler {
  private static getExecutablePath(): string {
    if (process.versions.electron) {
      return process.execPath;
    }
    // Fallback path cho môi trường Windows nếu không trong Electron
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  /**
   * Cào ngầm nội dung render JS bằng puppeteer-core
   */
  static async crawlPage(url: string, selector: string = 'body'): Promise<PuppeteerCrawlResult> {
    log.info(`[PuppeteerCrawler] Đang cào ngầm trang: ${url}`);
    
    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath: this.getExecutablePath(),
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Chờ selector xuất hiện nếu có
      if (selector !== 'body') {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
        } catch (e) {
          log.warn(`[PuppeteerCrawler] Selector ${selector} không xuất hiện kịp, lấy nội dung trang mặc định.`);
        }
      }

      const title = await page.title();
      const content = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? (el as HTMLElement).innerText : document.body.innerText;
      }, selector);

      const html = await page.content();

      await browser.close();

      return {
        url,
        title,
        content: content.trim(),
        html
      };
    } catch (error: any) {
      if (browser) {
        try { await browser.close(); } catch (e) { /* ignore */ }
      }
      log.error(`[PuppeteerCrawler] Lỗi cào trang ${url}:`, error.message);
      throw error;
    }
  }
}
