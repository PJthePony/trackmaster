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
- "song_summary": a 1–2 sentence description of what the song is about — its theme, story, or emotional core — specific enough to jog a fan's memory but without naming the title or artist
- "title_synonym": a clever synonym or thematic equivalent of the song title that hints at its meaning without stating it directly (e.g. if the title is "Thriller", write "Spine-Tingling Chiller")
- "artist_synonym": a creative wordplay or synonym phrase for the artist name that hints at who it is without stating it directly (e.g. if the artist is "Michael Jackson", write "Divine Messenger + Son of Jack")

Important:
- Use accurate Billboard chart data
- title_synonym and artist_synonym should be genuinely helpful hints, not impossible riddles
- Return ONLY valid JSON — no markdown fences, no explanation, no extra text
- Format: [{"rank":1,"title":"...","artist":"...","song_summary":"...","title_synonym":"...","artist_synonym":"..."},...]`,
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
