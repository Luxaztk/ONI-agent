import * as cheerio from "cheerio";
import { Document } from "@langchain/core/documents";

const CORE_TARGETS = [
  "/wiki/Category:Guides",
  "/wiki/Duplicant",
  "/wiki/Building",
  "/wiki/Critters",
  "/wiki/Disease",
  "/wiki/Skills",
  "/wiki/Elements",
  "/wiki/Equipment",
  "/wiki/Food_(Resource)",
  "/wiki/Geysers",
  "/wiki/Plants",
  "/wiki/Category:Research",
  "/wiki/Biome",
  "/wiki/Resource",
  "/wiki/Asteroid_Types",
  "/wiki/Planetoid_Clusters"
];

export const getWikiLinks = async (): Promise<string[]> => {
  console.log(`[WikiCrawler] Đang quét API để lấy các bài viết thuộc 16 mục tiêu cốt lõi...`);
  const uniqueLinks = new Set<string>();

  for (const target of CORE_TARGETS) {
    try {
      const cleanPath = target.startsWith('/wiki/') ? target.replace('/wiki/', '') : target;
      
      if (cleanPath.startsWith('Category:')) {
        // Cào bài viết thuộc Category qua MediaWiki API
        const apiUrl = `https://oxygennotincluded.wiki.gg/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(cleanPath)}&cmlimit=200&format=json`;
        const res = await fetch(apiUrl);
        const data = (await res.json()) as any;

        const members = data?.query?.categorymembers || [];
        for (const member of members) {
          if (member.ns === 0) {
            const slug = member.title.replace(/ /g, '_');
            uniqueLinks.add(`https://oxygennotincluded.wiki.gg/wiki/${slug}`);
          }
        }
      } else {
        // Thêm trực tiếp URL trang gốc
        const pageUrl = `https://oxygennotincluded.wiki.gg/wiki/${cleanPath}`;
        uniqueLinks.add(pageUrl);
      }
    } catch (e: any) {
      console.error(`[WikiCrawler] Lỗi khi lấy danh mục ${target}:`, e.message);
    }
  }

  const linksArray = Array.from(uniqueLinks);
  console.log(`[WikiCrawler] Tìm thấy tổng cộng ${linksArray.length} bài viết hướng dẫn & dữ liệu cốt lõi.`);
  return linksArray;
};

export const crawlWikiPage = async (url: string): Promise<Document[]> => {
  console.log(`[WikiCrawler] Đang cào dữ liệu từ ${url}...`);
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const title = $('#firstHeading').text().trim();

  return [
    new Document({
      pageContent: html,
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
