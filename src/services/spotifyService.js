// Audio previews via iTunes Search API — free, no auth required.
// Returns 30-second .m4a preview URLs for the vast majority of popular songs.

export async function getPreviewUrl(title, artist) {
  try {
    const query = encodeURIComponent(`${title} ${artist}`)
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&entity=song&limit=15`
    )

    if (!res.ok) return null

    const data = await res.json()
    const tracks = data.results ?? []

    const withPreview = tracks.filter((t) => t.previewUrl)
    if (withPreview.length === 0) return null

    // Prefer a track whose artist name closely matches
    const artistLower = artist.toLowerCase()
    const bestMatch = withPreview.find((t) =>
      t.artistName?.toLowerCase().includes(artistLower)
    )

    return (bestMatch ?? withPreview[0]).previewUrl
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
