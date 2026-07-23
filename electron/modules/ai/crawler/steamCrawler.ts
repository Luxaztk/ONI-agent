import * as cheerio from "cheerio";
import { Document } from "@langchain/core/documents";

// ID Game Oxygen Not Included trên Steam App Hub: 457140
const ONI_STEAM_APP_ID = "457140";
const CONFIRMED_ONI_GUIDES = [
  // The Compendium of Amazing Designs (Jahws)
  "https://steamcommunity.com/sharedfiles/filedetails/?id=2154398396"
];

/**
 * Tự động tìm kiếm & lấy danh sách các bài viết Hướng dẫn Top-rated về ONI từ Steam Community
 */
export const getSteamGuideLinks = async (): Promise<string[]> => {
  console.log(`[SteamCrawler] Đang quét các bài hướng dẫn ONI được đánh giá cao nhất trên Steam Community...`);
  const guideUrls = new Set<string>(CONFIRMED_ONI_GUIDES);

  try {
    const listUrl = `https://steamcommunity.com/app/${ONI_STEAM_APP_ID}/guides/?browsefilter=toprated`;
    const response = await fetch(listUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": "Steam_Language=english; birthtime=0; want_mature_content=1"
      }
    });

    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);

      $("a[href*='/sharedfiles/filedetails/?id=']").each((_, el) => {
        const href = $(el).attr("href");
        if (href) {
          const match = href.match(/id=\d+/);
          if (match) {
            guideUrls.add(`https://steamcommunity.com/sharedfiles/filedetails/?${match[0]}`);
          }
        }
      });
    }
  } catch (e: any) {
    console.error("[SteamCrawler] Lỗi khi quét danh sách Steam Guides:", e.message);
  }

  // Giới hạn cào tối đa 8 bài hướng dẫn chất lượng nhất mỗi lần để không bị Steam Rate Limit (429)
  const result = Array.from(guideUrls).slice(0, 8);
  console.log(`[SteamCrawler] Chọn ra ${result.length} bài hướng dẫn ONI top đầu để cào.`);
  return result;
};

/**
 * Cào dữ liệu từ 1 trang Steam Community Guide bằng Cheerio (Zero-LLM Token Cost)
 */
export const crawlSteamGuidePage = async (url: string): Promise<Document[]> => {
  console.log(`[SteamCrawler] Đang cào dữ liệu từ Steam Guide: ${url}...`);
  const docs: Document[] = [];

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cookie": "Steam_Language=english; birthtime=0; want_mature_content=1"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Lấy tiêu đề chính của Guide
    const guideTitle = $(".workshopItemTitle, .guideTitle, h1").first().text().trim() || "ONI Steam Guide";

    // Tìm các phân đoạn nội dung Steam Guide
    const subSections = $(".subSection");

    if (subSections.length > 0) {
      subSections.each((_, el) => {
        const sectionTitle = $(el).find(".subSectionTitle").first().text().trim() || "Overview";
        
        // Clone và loại bỏ tiêu đề + phần rác để lấy trọn vẹn 100% văn bản bài viết
        const clone = $(el).clone();
        clone.find(".subSectionTitle, script, style, iframe, .bb_link_host, .workshopItemControlArea").remove();

        const sectionText = clone.text().replace(/\s+/g, " ").trim();

        if (sectionText.length > 40) {
          const fullContent = `# ${guideTitle} - ${sectionTitle}\n\n${sectionText}`;
          docs.push(
            new Document({
              pageContent: fullContent,
              metadata: {
                source: url,
                title: `${guideTitle} - ${sectionTitle}`,
                type: "steam_guide",
                entity_category: "guide"
              }
            })
          );
        }
      });
    }

    // Fallback nếu không khớp subSection
    if (docs.length === 0) {
      const bodyText = $("#highlightContent, .guideDetailUserCustomPage, .workshopItemDescription, body")
        .find("script, style, iframe").remove().end()
        .text()
        .replace(/\s+/g, " ")
        .trim();

      if (bodyText.length > 50) {
        docs.push(
          new Document({
            pageContent: `# ${guideTitle}\n\n${bodyText.slice(0, 4000)}`,
            metadata: {
              source: url,
              title: guideTitle,
              type: "steam_guide",
              entity_category: "guide"
            }
          })
        );
      }
    }

    console.log(`[SteamCrawler] Đã bóc tách ${docs.length} phần từ "${guideTitle}".`);
  } catch (error: any) {
    console.error(`[SteamCrawler] Lỗi khi cào Steam Guide ${url}:`, error.message);
  }

  return docs;
};

/**
 * Cào hàng loạt các trang Steam Guide với khoảng trễ an toàn
 */
export const crawlSteamGuideBatch = async (urls: string[]): Promise<Document[]> => {
  const allDocs: Document[] = [];
  console.log(`[SteamCrawler] Bắt đầu cào ${urls.length} bài hướng dẫn Steam Community...`);

  for (const url of urls) {
    const docs = await crawlSteamGuidePage(url);
    allDocs.push(...docs);
    // Trễ 2.5s để không bị Steam Rate Limit (HTTP 429)
    await new Promise((r) => setTimeout(r, 2500));
  }

  return allDocs;
};
