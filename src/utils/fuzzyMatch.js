function normalize(str) {
  return str
    .toLowerCase()
    // Remove featured artist annotations
    .replace(/\(feat\..*?\)/gi, '')
    .replace(/feat\..*$/gi, '')
    .replace(/ft\..*$/gi, '')
    .replace(/\(ft\..*?\)/gi, '')
    // Remove "The" at start
    .replace(/^the\s+/i, '')
    // Strip punctuation except spaces
    .replace(/[^\w\s]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

export function fuzzyMatch(input, target) {
  const normInput = normalize(input)
  const normTarget = normalize(target)
  if (normInput === normTarget) return true

  // Also try stripping leading "The" from target for comparison
  const targetNoThe = normalize(target.replace(/^the\s+/i, ''))
  if (normInput === targetNoThe) return true

  return false
}

export function bothMatch(titleInput, artistInput, song) {
  return fuzzyMatch(titleInput, song.title) && fuzzyMatch(artistInput, song.artist)
}
