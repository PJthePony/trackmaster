import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
})

const MODEL = 'claude-sonnet-4-20250514'

export async function fetchSongsForYear(year) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2500,
    messages: [
      {
        role: 'user',
        content: `Return the Billboard Year-End Hot 100 top 10 songs for the year ${year} as a JSON array.

Each element must have exactly these fields:
- "rank": integer 1–10
- "title": the song title (string)
- "artist": the primary artist name (string, no "feat." additions)
- "lyrics_preview": a two-line lyrical paraphrase that captures the opening theme, imagery, and feel of the song WITHOUT quoting the actual copyrighted lyrics verbatim — write it in the style and voice of the song so it's recognizable to fans, separated by a newline character

Important:
- Use accurate Billboard chart data
- For lyrics_preview, paraphrase the opening lines' meaning and mood — do not reproduce exact copyrighted text
- Return ONLY valid JSON — no markdown fences, no explanation, no extra text
- Format: [{"rank":1,"title":"...","artist":"...","lyrics_preview":"line1\\nline2"},...]`,
      },
    ],
  })

  const text = response.content[0].text.trim()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`Claude returned non-JSON: ${text.slice(0, 200)}`)
  return JSON.parse(jsonMatch[0])
}

export async function generateVerdict(score, year) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 250,
    messages: [
      {
        role: 'user',
        content: `A player scored ${score} out of 30 points on a music trivia game about the top Billboard hits of ${year}. Write exactly 2 witty, punchy sentences as a verdict on their performance. Reference the musical era of ${year}. Be playful and specific. Return only the two sentences, nothing else.`,
      },
    ],
  })

  return response.content[0].text.trim()
}
