import fs from "fs";
import * as cheerio from "cheerio";

const html = fs.readFileSync("scratch/sample_steam_guide.html", "utf-8");
const $ = cheerio.load(html);

console.log("=== INSPECTING .subSection INNER HTML ===");
const subSections = $(".subSection");

subSections.each((index, element) => {
  const clone = $(element).clone();
  clone.find(".subSectionTitle").remove();
  const rawText = clone.text().replace(/\s+/g, " ").trim();
  console.log(`\nSection ${index + 1}: [${$(element).find(".subSectionTitle").text().trim()}]`);
  console.log("Extracted Text Length:", rawText.length);
  if (rawText.length > 0) {
    console.log("Sample Content:", rawText.slice(0, 200));
  }
});
