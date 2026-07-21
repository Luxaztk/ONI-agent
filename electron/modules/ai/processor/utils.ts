/**
 * Safely parses any number/string input into a numeric float or undefined.
 * Handles units (e.g. "100%", "-183 °C", "120 W", "+10 Decor") and formatted strings.
 */
export function parseNumber(value: any): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value === "number") {
    return isNaN(value) ? undefined : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.endsWith("%")) {
      const parsedPercent = parseFloat(trimmed.replace("%", ""));
      return isNaN(parsedPercent) ? undefined : parsedPercent / 100;
    }
    const match = trimmed.match(/-?\d+(\.\d+)?/);
    if (match) {
      const parsed = parseFloat(match[0]);
      return isNaN(parsed) ? undefined : parsed;
    }
  }
  return undefined;
}

/**
 * Formats name into a standardized URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "_")
    .replace(/^-+|-+$/g, "");
}

/**
 * Estimates token count based on standard ratio (approx. 4 characters per token).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Gracefully splits a text block exceeding maxTokens at sentence boundaries ('.').
 */
export function splitBySentence(text: string, maxTokens: number = 2000): string[] {
  if (estimateTokens(text) <= maxTokens) {
    return [text];
  }

  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g) || [text];
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (estimateTokens(currentChunk + sentence) > maxTokens) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      if (estimateTokens(sentence) > maxTokens) {
        const charLimit = maxTokens * 4;
        let remaining = sentence;
        while (remaining.length > 0) {
          chunks.push(remaining.slice(0, charLimit).trim());
          remaining = remaining.slice(charLimit);
        }
        currentChunk = "";
      } else {
        currentChunk = sentence;
      }
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}
