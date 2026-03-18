function normalize(str) {
  return str
    .toLowerCase()
    // Remove featured artist annotations
    .replace(/\(feat\..*?\)/gi, '')
    .replace(/\bfeat\..*$/gi, '')
    .replace(/\bft\..*$/gi, '')
    .replace(/\(ft\..*?\)/gi, '')
    // Remove "The" at start
    .replace(/^the\s+/i, '')
    // Strip all punctuation (keep only letters, numbers, spaces)
    .replace(/[^a-z0-9\s]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

// Simple suffix stripping to handle common tense/plural variations
// e.g. "running" → "run", "danced" → "danc", "songs" → "song"
function stem(word) {
  if (word.length > 6 && word.endsWith('ing')) return word.slice(0, -3)
  if (word.length > 5 && word.endsWith('ed'))  return word.slice(0, -2)
  if (word.length > 4 && word.endsWith('er'))  return word.slice(0, -2)
  if (word.length > 4 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

function stemPhrase(str) {
  return str.split(' ').map(stem).join(' ')
}

// Levenshtein edit distance
function levenshtein(a, b) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[a.length][b.length]
}

// Allowed edit distance scales with string length:
// ≤4 chars  → must be exact
// 5–7 chars → 1 edit
// 8+ chars  → 2 edits
function maxDistance(len) {
  if (len <= 4) return 0
  if (len <= 7) return 1
  return 2
}

export function fuzzyMatch(input, target) {
  const normInput  = normalize(input)
  const normTarget = normalize(target)

  if (normInput === normTarget) return true

  // Stemmed comparison (handles tense/plural differences)
  const stemmedInput  = stemPhrase(normInput)
  const stemmedTarget = stemPhrase(normTarget)

  if (stemmedInput === stemmedTarget) return true

  // Levenshtein on stemmed strings (handles minor misspellings)
  const dist = levenshtein(stemmedInput, stemmedTarget)
  return dist <= maxDistance(stemmedTarget.length)
}

export function bothMatch(titleInput, artistInput, song) {
  return fuzzyMatch(titleInput, song.title) && fuzzyMatch(artistInput, song.artist)
}
