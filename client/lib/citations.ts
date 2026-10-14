export const UUID_REGEX =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;

export const BRACKETED_UUID_REGEX =
  /\[(?:\s*[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\s*[,;]?\s*)+\]/g;

/**
 * Normalizes raw chunk passage text.
 * Fixes PDF extraction artifacts where text was broken word-by-word with newlines.
 * Formats as readable paragraph prose with section and list preservation.
 */
export function formatChunkContent(text: string): string {
  if (!text) return "";
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/);
  const lineCount = (trimmed.match(/\n/g) || []).length;

  // If text is abnormally line-broken (e.g. word-by-word \n \n from PDF readers)
  if (words.length > 0 && lineCount > words.length * 0.3) {
    let formatted = words.join(" ");
    // Add paragraph break before numbered sections (e.g., "45. Eligibility")
    formatted = formatted.replace(/(?<!^)(\b\d+\.\s+[A-Z])/g, "\n\n$1");
    // Add paragraph break before bullet points (e.g., "• Requirements" or "- Details")
    formatted = formatted.replace(/(?<!^)([•\-]\s+[A-Z])/g, "\n\n$1");
    return formatted;
  }

  return trimmed;
}

/**
 * Transforms assistant markdown text to map citations to the end of each paragraph/bullet item:
 * 1. Groups markdown into paragraphs / list items.
 * 2. Extracts all cited chunk UUIDs within that paragraph block.
 * 3. Strips out raw bracketed UUID text.
 * 4. Appends a single inline citation badge link at the end of the paragraph: [N Sources](#citation:uuid1,uuid2)
 */
export function transformMarkdownParagraphCitations(content: string): string {
  if (!content) return "";
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  const blocks: { text: string; isBlock: boolean }[] = [];
  let currentBlock: string[] = [];
  let isCurrentList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBlank = line.trim() === "";
    const isListItem = /^(\s*[-*+]|\s*\d+\.)\s+/.test(line);

    if (isBlank) {
      if (currentBlock.length > 0) {
        blocks.push({ text: currentBlock.join("\n"), isBlock: true });
        currentBlock = [];
      }
      blocks.push({ text: line, isBlock: false });
      isCurrentList = false;
    } else if (isListItem) {
      if (currentBlock.length > 0) {
        blocks.push({ text: currentBlock.join("\n"), isBlock: true });
        currentBlock = [];
      }
      isCurrentList = true;
      currentBlock.push(line);
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push({ text: currentBlock.join("\n"), isBlock: true });
  }

  return blocks
    .map((block) => {
      if (!block.isBlock) return block.text;

      const text = block.text;
      const matches = text.match(UUID_REGEX);
      if (!matches || matches.length === 0) return text;

      const uniqueUuids = Array.from(new Set(matches));

      // Remove bracketed UUIDs from text
      let cleaned = text.replace(BRACKETED_UUID_REGEX, () => "").trimEnd();

      // Clean up punctuation spacing: e.g. "orders) ." -> "orders)."
      cleaned = cleaned.replace(/\s+([.,;:])/g, "$1");
      // Clean up multiple inline spaces
      cleaned = cleaned.replace(/[ \t]{2,}/g, " ");

      const count = uniqueUuids.length;
      const label = count === 1 ? "1 Source" : `${count} Sources`;
      const badgeLink = ` [${label}](#citation:${uniqueUuids.join(",")})`;

      return cleaned + badgeLink;
    })
    .join("\n");
}
