import { getWikiLinks, crawlWikiBatch } from "./wikiCrawler";
import { getOniDbLinks, crawlOniDbBatch } from "./oniDbCrawler";
import { Document } from "@langchain/core/documents";

export const runCrawlers = async (): Promise<Document[]> => {
  const allDocs: Document[] = [];

  console.log("=== BẮT ĐẦU MASS CRAWLING ===");

  // 1. Quét tìm toàn bộ URL
  console.log("1. Đang quét danh sách URL...");
  const [oniDbUrls, wikiUrls] = await Promise.all([
    getOniDbLinks(),
    getWikiLinks()
  ]);
  
  // Tùy chọn: Giới hạn số lượng trang cào để test nhanh (Bỏ comment để dùng thật)
  // const limitOni = oniDbUrls.slice(0, 10);
  // const limitWiki = wikiUrls.slice(0, 10);
  const limitOni = oniDbUrls;
  const limitWiki = wikiUrls;

  // 2. Tiến hành cào hàng loạt
  console.log(`2. Đang cào ${limitOni.length} trang Oni-db...`);
  const oniDocs = await crawlOniDbBatch(limitOni);
  allDocs.push(...oniDocs);

  console.log(`3. Đang cào ${limitWiki.length} trang Wiki...`);
  const wikiDocs = await crawlWikiBatch(limitWiki);
  allDocs.push(...wikiDocs);

  console.log(`=== HOÀN TẤT MASS CRAWLING (Tổng cộng: ${allDocs.length} tài liệu) ===`);
  return allDocs;
};
