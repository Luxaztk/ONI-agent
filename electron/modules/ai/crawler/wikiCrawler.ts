import * as cheerio from "cheerio";
import { Document } from "@langchain/core/documents";

const CATEGORIES = [
  "Category:Guides",
  "Category:Game_mechanics",
  "Category:Elements",
  "Category:Lore"
];

export const getWikiLinks = async (): Promise<string[]> => {
  console.log(`[WikiCrawler] Đang quét API để lấy các bài viết thuộc danh mục cốt lõi...`);
  const uniqueLinks = new Set<string>();

  for (const cat of CATEGORIES) {
    try {
      const apiUrl = `https://oxygennotincluded.wiki.gg/api.php?action=query&list=categorymembers&cmtitle=${cat}&cmlimit=100&format=json`;
      const res = await fetch(apiUrl);
      const data = await res.json() as any;
      
      const members = data?.query?.categorymembers || [];
      for (const member of members) {
        // Chỉ lấy trang bài viết chính (ns: 0), bỏ qua các trang phụ
        if (member.ns === 0) {
          // Xây dựng URL từ title (thay khoảng trắng bằng dấu gạch dưới)
          const slug = member.title.replace(/ /g, '_');
          uniqueLinks.add(`https://oxygennotincluded.wiki.gg/wiki/${slug}`);
        }
      }
    } catch (e: any) {
      console.error(`[WikiCrawler] Lỗi khi lấy danh mục ${cat}:`, e.message);
    }
  }

  const linksArray = Array.from(uniqueLinks);
  console.log(`[WikiCrawler] Tìm thấy ${linksArray.length} bài viết hướng dẫn/cơ chế.`);
  return linksArray;
};

export const crawlWikiPage = async (url: string): Promise<Document[]> => {
  console.log(`[WikiCrawler] Đang cào dữ liệu từ ${url}...`);
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  // Xóa các phần rác để tránh nhiễu dữ liệu cho LLM
  $('script, style, nav, footer, #mw-navigation, .printfooter, .catlinks, .navbox').remove();

  const title = $('#firstHeading').text().trim();
  const cleanText = $('#mw-content-text').text().replace(/\s+/g, ' ').trim();

  return [
    new Document({
      pageContent: cleanText,
      metadata: { source: url, title, type: "wiki_guide" },
    }),
  ];
};

export const crawlWikiBatch = async (urls: string[]): Promise<Document[]> => {
  const allDocs: Document[] = [];
  const failedUrls: string[] = [];
  
  console.log(`[WikiCrawler] Bắt đầu cào ${urls.length} trang Wiki...`);
  
  const BATCH_SIZE = 5;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    console.log(`[WikiCrawler] Đang cào mẻ ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} trang)...`);
    
    const promises = batch.map(async (url) => {
      try {
        const docs = await crawlWikiPage(url);
        allDocs.push(...docs);
      } catch(e: any) {
        console.error(`[WikiCrawler] Lỗi ${url}:`, e.message);
        failedUrls.push(url);
      }
    });

    await Promise.all(promises);
    // Trễ 1s giữa các mẻ
    await new Promise(r => setTimeout(r, 1000));
  }

  // Chạy lại những trang lỗi (Retry 1 lần)
  if (failedUrls.length > 0) {
    console.log(`[WikiCrawler] Đang thử lại ${failedUrls.length} trang lỗi...`);
    for (const url of failedUrls) {
      try {
        const docs = await crawlWikiPage(url);
        allDocs.push(...docs);
      } catch(e) {
        console.error(`[WikiCrawler] Thất bại hoàn toàn với ${url}`);
      }
    }
  }

  return allDocs;
};
