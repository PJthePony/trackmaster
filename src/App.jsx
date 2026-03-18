import { useState, useEffect } from 'react'
import YearReveal from './components/YearReveal'
import GameBoard from './components/GameBoard'
import EndScreen from './components/EndScreen'
import LoadingScreen from './components/LoadingScreen'
import { fetchSongsForYear } from './services/claudeService'
import { enrichSongsWithPreviews } from './services/spotifyService'

function getRandomYear() {
  return Math.floor(Math.random() * (2025 - 1950 + 1)) + 1950
}

const PHASES = {
  YEAR_REVEAL: 'year-reveal',
  LOADING: 'loading',
  PLAYING: 'playing',
  END: 'end',
}

export default function App() {
  const [year, setYear] = useState(getRandomYear)
  const [phase, setPhase] = useState(PHASES.YEAR_REVEAL)
  const [songs, setSongs] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [results, setResults] = useState([]) // [{song, points, attempts}]

  const totalScore = results.reduce((sum, r) => sum + r.points, 0)

  async function loadGame() {
    setPhase(PHASES.LOADING)
    try {
      const rawSongs = await fetchSongsForYear(year)
      const enriched = await enrichSongsWithPreviews(rawSongs)
      setSongs(enriched)
      setPhase(PHASES.PLAYING)
    } catch (err) {
      setLoadError(err.message)
    }
  }

  function handleYearRevealDone() {
    loadGame()
  }

  function handleSongComplete(song, points, attemptsUsed) {
    setResults((prev) => [...prev, { song, points, attemptsUsed }])
  }

  function handleGameEnd() {
    setPhase(PHASES.END)
  }

  return (
    <div className="app">
      {phase === PHASES.YEAR_REVEAL && (
        <YearReveal year={year} onDone={handleYearRevealDone} onReroll={() => setYear(getRandomYear())} />
      )}

      {phase === PHASES.LOADING && (
        <LoadingScreen year={year} error={loadError} />
      )}

      {phase === PHASES.PLAYING && songs.length > 0 && (
        <GameBoard
          year={year}
          songs={songs}
          totalScore={totalScore}
          completedCount={results.length}
          onSongComplete={handleSongComplete}
          onGameEnd={handleGameEnd}
        />
      )}

      {phase === PHASES.END && (
        <EndScreen
          year={year}
          results={results}
          totalScore={totalScore}
        />
      )}
    </div>
  )
}
