function sanitizeTag(tag) {
  return tag.replace(/^#+/, "").trim().toLowerCase();
}

export function extractHashtagsFromCaption(caption = "") {
  const matches = caption.match(/#([a-zA-Z0-9_]+)/g) || [];
  return matches.map((tag) => sanitizeTag(tag)).filter(Boolean);
}

export function normalizeHashtags(input = [], caption = "") {
  const tags = [...input, ...extractHashtagsFromCaption(caption)]
    .map((tag) => sanitizeTag(tag))
    .filter(Boolean);

  return [...new Set(tags)].slice(0, 25);
}
