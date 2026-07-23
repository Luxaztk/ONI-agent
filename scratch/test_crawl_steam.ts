import { crawlSteamGuidePage } from "../electron/modules/ai/crawler/steamCrawler";

async function main() {
  console.log("=== TESTING STEAM CRAWLER ===");
  const url = "https://steamcommunity.com/sharedfiles/filedetails/?id=2154398396";
  const docs = await crawlSteamGuidePage(url);
  console.log(`Extracted ${docs.length} Documents!`);
  
  if (docs.length > 0) {
    console.log("\nSample Document 1:");
    console.log("Title:", docs[0].metadata.title);
    console.log("Content Preview:", docs[0].pageContent.slice(0, 300));
    
    console.log("\nSample Document 5 (Submerged electrolyzers):");
    console.log("Title:", docs[4].metadata.title);
    console.log("Content Preview:", docs[4].pageContent.slice(0, 300));
  }
}

main().catch(console.error);
