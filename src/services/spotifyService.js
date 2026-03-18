let cachedToken = null
let tokenExpiry = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured')
  }

  const credentials = btoa(`${clientId}:${clientSecret}`)

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    throw new Error(`Spotify auth failed: ${res.status}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

export async function getPreviewUrl(title, artist) {
  try {
    const token = await getAccessToken()
    const query = encodeURIComponent(`${title} ${artist}`)
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!res.ok) return null

    const data = await res.json()
    const tracks = data.tracks?.items ?? []

    // Prefer tracks that match artist name and have a preview
    const withPreview = tracks.filter((t) => t.preview_url)
    if (withPreview.length === 0) return null

    // Try to find a closer artist match
    const artistLower = artist.toLowerCase()
    const bestMatch = withPreview.find((t) =>
      t.artists.some((a) => a.name.toLowerCase().includes(artistLower))
    )

    return (bestMatch ?? withPreview[0]).preview_url
  } catch {
    return null
  }
}

export async function enrichSongsWithPreviews(songs) {
  const results = await Promise.allSettled(
    songs.map((song) => getPreviewUrl(song.title, song.artist))
  )

  return songs.map((song, i) => ({
    ...song,
    previewUrl: results[i].status === 'fulfilled' ? results[i].value : null,
  }))
}
