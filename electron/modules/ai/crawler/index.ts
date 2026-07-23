import { getWikiLinks, crawlWikiBatch } from "./wikiCrawler";
import { getOniDbLinks, crawlOniDbBatch } from "./oniDbCrawler";
import { getSteamGuideLinks, crawlSteamGuideBatch } from "./steamCrawler";
import { Document } from "@langchain/core/documents";

export interface CrawlerTargets {
  needsOniDb?: boolean;
  needsWiki?: boolean;
  needsSteam?: boolean;
}

export const runCrawlers = async (targets?: CrawlerTargets): Promise<Document[]> => {
  const allDocs: Document[] = [];

  const doOni = targets ? Boolean(targets.needsOniDb) : true;
  const doWiki = targets ? Boolean(targets.needsWiki) : true;
  const doSteam = targets ? Boolean(targets.needsSteam) : true;

  console.log(`=== BẮT ĐẦU CÀO DỮ LIỆU TỰ CHỌN (OniDb=${doOni}, Wiki=${doWiki}, Steam=${doSteam}) ===`);

  if (doOni) {
    console.log("1. Đang quét và cào dữ liệu từ Oni-DB...");
    const oniDbUrls = await getOniDbLinks();
    const oniDocs = await crawlOniDbBatch(oniDbUrls);
    allDocs.push(...oniDocs);
  }

  if (doWiki) {
    console.log("2. Đang quét và cào 16 mục tiêu cốt lõi từ Wiki.gg...");
    const wikiUrls = await getWikiLinks();
    const wikiDocs = await crawlWikiBatch(wikiUrls);
    allDocs.push(...wikiDocs);
  }

  if (doSteam) {
    console.log("3. Đang quét và cào các bài hướng dẫn từ Steam Community...");
    const steamUrls = await getSteamGuideLinks();
    const steamDocs = await crawlSteamGuideBatch(steamUrls);
    allDocs.push(...steamDocs);
  }

  console.log(`=== HOÀN TẤT CÀO DỮ LIỆU (Tổng cộng: ${allDocs.length} tài liệu) ===`);
  return allDocs;
};
