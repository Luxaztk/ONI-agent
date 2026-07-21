import { JSDOM } from "jsdom";
import type { WikiSection } from "./types";

/**
 * Cleans Wiki HTML using JSDOM and converts Infobox & sections into clean text blocks.
 */
export function extractCleanWikiSections(wikiHtml: string): { elementName: string; infoboxKeyValueMap: Record<string, string>; sections: WikiSection[] } {
  if (!wikiHtml || !wikiHtml.trim()) {
    return { elementName: "Unknown Entity", infoboxKeyValueMap: {}, sections: [] };
  }

  const dom = new JSDOM(wikiHtml);
  const document = dom.window.document;

  // 1. REMOVE unwanted elements & selectors
  const selectorsToRemove = [
    "head",
    "script",
    "style",
    "noscript",
    "#vector-main-menu",
    "#p-navigation",
    "#footer",
    "#mw-navigation",
    ".printfooter",
    ".catlinks",
    ".navbox",
    "ol.references",
    ".references",
    "#References",
    "#External_links",
    ".external",
    ".mw-editsection",
    ".noprint"
  ];

  selectorsToRemove.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // Extract Entity Name from Page Heading
  const headingEl = document.querySelector("#firstHeading, h1");
  const elementName = headingEl?.textContent?.trim() || "Unknown Entity";

  // 2. TRANSFORM Infobox table into readable Key: Value text and Extract Map
  let infoboxText = "";
  const infoboxKeyValueMap: Record<string, string> = {};
  const infoboxTables = document.querySelectorAll("table.infobox, .infobox, table[class*='infobox']");
  
  infoboxTables.forEach((table) => {
    const rows = table.querySelectorAll("tr");
    const lines: string[] = [];
    
    rows.forEach((row) => {
      const header = row.querySelector("th, td.fn, td.infobox-header")?.textContent?.trim();
      const value = row.querySelector("td:not(.fn):not(.infobox-header)")?.textContent?.trim();
      
      if (header && value && header !== value) {
        const cleanKey = header.replace(/\s+/g, " ");
        const cleanVal = value.replace(/\s+/g, " ");
        lines.push(`${cleanKey}: ${cleanVal}`);
        infoboxKeyValueMap[cleanKey.toLowerCase()] = cleanVal;
      } else if (header) {
        lines.push(`[${header.replace(/\s+/g, " ")}]`);
      }
    });

    if (lines.length > 0) {
      infoboxText += lines.join("\n") + "\n\n";
    }
    table.remove();
  });

  // 3. CHUNK content semantically under <h2> and <h3> tags
  const contentContainer = document.querySelector("#mw-content-text, .mw-parser-output, body") || document.body;
  const sections: WikiSection[] = [];
  
  let currentHeading = "Overview";
  let currentParagraphs: string[] = [];

  if (infoboxText.trim()) {
    currentParagraphs.push("[Infobox Summary]\n" + infoboxText.trim());
  }

  const childNodes = Array.from(contentContainer.children);

  for (const node of childNodes) {
    const tagName = node.tagName.toLowerCase();

    if (tagName === "h2" || tagName === "h3") {
      const fullText = currentParagraphs.join("\n\n").replace(/\s+/g, " ").trim();
      if (fullText) {
        sections.push({ heading: currentHeading, content: fullText });
      }

      currentHeading = node.textContent?.replace(/\[edit\]/g, "").trim() || "Section";
      currentParagraphs = [];
    } else {
      const text = node.textContent?.trim();
      if (text) {
        const cleanText = text.replace(/[ \t]+/g, " ");
        currentParagraphs.push(cleanText);
      }
    }
  }

  const finalText = currentParagraphs.join("\n\n").replace(/\s+/g, " ").trim();
  if (finalText) {
    sections.push({ heading: currentHeading, content: finalText });
  }

  return { elementName, infoboxKeyValueMap, sections };
}
