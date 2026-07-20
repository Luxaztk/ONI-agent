import puppeteer from "puppeteer-core";
import { Document } from "@langchain/core/documents";

import fs from "fs";

// Lấy đường dẫn trình duyệt. 
// Thay vì dùng process.execPath của Electron (sẽ gây lỗi đệ quy mở app liên tục),
// ta sẽ tận dụng luôn Edge (mặc định của Windows) hoặc Chrome có sẵn để không phải tải thêm 150MB Chromium.
const getExecutablePath = () => {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const chromePath86 = "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
  
  if (fs.existsSync(edgePath)) return edgePath;
  if (fs.existsSync(chromePath)) return chromePath;
  if (fs.existsSync(chromePath86)) return chromePath86;
  
  throw new Error("Không tìm thấy trình duyệt Edge hoặc Chrome trên hệ thống!");
};

export const getOniDbLinks = async (): Promise<string[]> => {
  console.log(`[OniDbCrawler] Đang quét toàn bộ URL vật phẩm từ oni-db.com...`);
  const browser = await puppeteer.launch({ 
    executablePath: getExecutablePath(),
    headless: true 
  });
  const page = await browser.newPage();
  
  await page.goto("https://oni-db.com/", { waitUntil: 'networkidle2' });

  // Lấy tất cả thẻ <a> có link chứa "/details/"
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors
      .map(a => a.href)
      .filter(href => href.includes('/details/'));
  });

  await browser.close();

  // Loại bỏ các link trùng lặp
  const uniqueLinks = [...new Set(links)];
  console.log(`[OniDbCrawler] Tìm thấy ${uniqueLinks.length} vật phẩm/tòa nhà.`);
  return uniqueLinks;
};

export const crawlOniDbPage = async (url: string, browserInstance?: any): Promise<Document[]> => {
  console.log(`[OniDbCrawler] Đang cào: ${url}`);
  
  // Tái sử dụng browser nếu truyền vào, tránh mở/đóng liên tục gây crash
  let browser = browserInstance;
  let shouldClose = false;

  if (!browser) {
    browser = await puppeteer.launch({ 
      executablePath: getExecutablePath(),
      headless: true 
    });
    shouldClose = true;
  }
  
  const page = await browser.newPage();
  
  // Đợi đến khi không còn request mạng nào để đảm bảo dữ liệu SPA đã render xong
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Lấy toàn bộ text hiển thị trên web
  const content = await page.evaluate(() => {
    return document.body.innerText.replace(/\s+/g, ' ').trim();
  });

  const title = await page.title();
  await page.close();

  if (shouldClose) {
    await browser.close();
  }

  return [
    new Document({
      pageContent: content,
      metadata: { source: url, title: title, type: "onidb_stats" },
    })
  ];
};

export const crawlOniDbBatch = async (urls: string[]): Promise<Document[]> => {
  const allDocs: Document[] = [];
  const failedUrls: string[] = [];
  
  console.log(`[OniDbCrawler] Khởi động trình duyệt cho ${urls.length} trang...`);
  const browser = await puppeteer.launch({ 
    executablePath: getExecutablePath(),
    headless: true 
  });

  // Chia mẻ 5 trang / lần
  const BATCH_SIZE = 5;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    console.log(`[OniDbCrawler] Đang cào mẻ ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} trang)...`);
    
    const promises = batch.map(async (url) => {
      try {
        const docs = await crawlOniDbPage(url, browser);
        allDocs.push(...docs);
      } catch(e: any) {
        console.error(`[OniDbCrawler] Lỗi ${url}:`, e.message);
        failedUrls.push(url);
      }
    });

    await Promise.all(promises);
    // Trễ 1s giữa các mẻ
    await new Promise(r => setTimeout(r, 1000));
  }

  // Chạy lại những trang lỗi (Retry 1 lần)
  if (failedUrls.length > 0) {
    console.log(`[OniDbCrawler] Đang thử lại ${failedUrls.length} trang lỗi...`);
    for (const url of failedUrls) {
      try {
        const docs = await crawlOniDbPage(url, browser);
        allDocs.push(...docs);
      } catch(e) {
        console.error(`[OniDbCrawler] Thất bại hoàn toàn với ${url}`);
      }
    }
  }

  await browser.close();
  return allDocs;
};
