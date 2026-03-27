const HTML_TAG_RE = /<[^>]*>/g;
const MULTISPACE_RE = /\s+/g;
const ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": "\"",
  "&apos;": "'",
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">"
};

export function stripHtml(input: string | null | undefined) {
  if (!input) {
    return "";
  }

  return decodeEntities(
    input.replace(/<br\s*\/?>/gi, "\n").replace(HTML_TAG_RE, " ").replace(MULTISPACE_RE, " ").trim()
  );
}

export function decodeEntities(input: string) {
  return Object.entries(ENTITY_MAP).reduce(
    (value, [entity, replacement]) => value.replaceAll(entity, replacement),
    input
  );
}

export function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"].forEach((key) =>
      parsed.searchParams.delete(key)
    );
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function excerptText(input: string, maxLength = 320) {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, maxLength - 1).trimEnd()}…`;
}

export function keywordOverlap(a: string, b: string) {
  const left = new Set(tokenizeTitle(a));
  const right = new Set(tokenizeTitle(b));
  let hits = 0;

  for (const token of left) {
    if (right.has(token)) {
      hits += 1;
    }
  }

  return hits;
}

export function tokenizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((part) => part.length >= 3);
}
