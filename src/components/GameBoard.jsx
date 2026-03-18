import { useState, useEffect, useRef } from 'react'
import { bothMatch } from '../utils/fuzzyMatch'

function pointsForAttempt(attempt) {
  if (attempt === 1) return 3
  if (attempt === 2) return 2
  if (attempt === 3) return 1
  return 0
}

export default function GameBoard({ year, songs, totalScore, onSongComplete, onGameEnd }) {
  const [songIndex, setSongIndex]       = useState(0)
  const [attempt, setAttempt]           = useState(1)
  const [titleInput, setTitleInput]     = useState('')
  const [artistInput, setArtistInput]   = useState('')
  const [phase, setPhase]               = useState('audio') // 'audio' | 'guess'
  const [countdown, setCountdown]       = useState(5)
  const [resultFlash, setResultFlash]   = useState(null)    // null | { type, message }
  const [isAdvancing, setIsAdvancing]   = useState(false)

  const audioRef     = useRef(null)
  const countdownRef = useRef(null)
  const inputRef     = useRef(null)

  const currentSong = songs[songIndex]
  const songSummary = currentSong?.song_summary ?? ''
  const titleSynonym = currentSong?.title_synonym ?? ''
  const artistSynonym = currentSong?.artist_synonym ?? ''

  // ── Effect 1: Reset all per-song state when song changes ──────────────
  useEffect(() => {
    setAttempt(1)
    setTitleInput('')
    setArtistInput('')
    setResultFlash(null)
    setIsAdvancing(false)
    setCountdown(5)
    setPhase('audio')
  }, [songIndex])

  // ── Effect 2: Manage audio playback and countdown ─────────────────────
  useEffect(() => {
    if (phase !== 'audio') return

    const audio = audioRef.current

    const clearCountdown = () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }

    const finishAudio = () => {
      clearCountdown()
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      setPhase('guess')
    }

    // No preview available — still run the countdown so the year clue
    // gets its moment before the guess form appears
    if (!currentSong?.previewUrl) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current)
            countdownRef.current = null
            setPhase('guess')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
        }
      }
    }

    // Set audio source
    audio.src = currentSong.previewUrl
    audio.currentTime = 0

    // Handle load / playback errors gracefully
    audio.onerror = () => finishAudio()

    // Attempt autoplay (may be blocked by browser policy — timer still runs)
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked; countdown will still advance to guess phase
      })
    }

    // 1-second countdown interval
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          finishAudio()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearCountdown()
      if (audio) {
        audio.pause()
        audio.onerror = null
      }
    }
  }, [phase, songIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 3: Auto-focus title input when guess phase starts ──────────
  useEffect(() => {
    if (phase === 'guess' && !isAdvancing && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [phase, isAdvancing])

  // ── Advance to the next song or end the game ──────────────────────────
  function advanceToNext() {
    if (songIndex >= songs.length - 1) {
      onGameEnd()
    } else {
      setSongIndex((i) => i + 1)
    }
  }

  // ── Shared wrong-answer progression logic ────────────────────────────
  function progressWrong() {
    if (attempt < 3) {
      const nextHint = attempt === 1
        ? 'Not quite — here are some lyrics…'
        : 'Still no — here\'s a hint about the artist…'
      setResultFlash({ type: 'wrong', message: nextHint })
      setTimeout(() => {
        setResultFlash(null)
        setAttempt((a) => a + 1)
        setTitleInput('')
        setArtistInput('')
      }, 1300)
    } else {
      setResultFlash({
        type: 'reveal',
        message: `"${currentSong.title}" by ${currentSong.artist}`,
      })
      setIsAdvancing(true)
      onSongComplete(currentSong, 0, 3)
      setTimeout(() => advanceToNext(), 2600)
    }
  }

  // ── Handle guess submission ───────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault()
    if (isAdvancing) return

    const correct = bothMatch(titleInput.trim(), artistInput.trim(), currentSong)

    if (correct) {
      const pts = pointsForAttempt(attempt)
      setResultFlash({ type: 'correct', message: `Correct! +${pts} point${pts !== 1 ? 's' : ''}` })
      setIsAdvancing(true)
      onSongComplete(currentSong, pts, attempt)
      setTimeout(() => advanceToNext(), 1800)
    } else {
      progressWrong()
    }
  }

  // ── Handle skip / give me a clue ─────────────────────────────────────
  function handlePass() {
    if (isAdvancing) return
    progressWrong()
  }

  if (!currentSong) return null

  // Circumference of the countdown ring (r=18)
  const CIRC = 2 * Math.PI * 18

  return (
    <div className="game-board">
      {/* Hidden audio element — always mounted, src swapped per song */}
      <audio ref={audioRef} preload="auto" />

      {/* Sticky score header */}
      <header className="score-header">
        <div className="score-header__year">{year}</div>
        <div className="score-header__progress">
          Song {songIndex + 1} of {songs.length}
        </div>
        <div className="score-header__score">
          Score: <span className="score-value">{totalScore}</span>
        </div>
      </header>

      {/* Main song card */}
      <div className="song-card">
        <div className="song-card__rank">#{currentSong.rank}</div>

        {/* ── Clue section ── */}
        <div className="clue-section">

          {/* Audio countdown — attempt 1 only */}
          {phase === 'audio' && currentSong.previewUrl && (
            <div className="audio-player">
              <div className="audio-player__label">
                {countdown > 0 ? 'Playing preview…' : 'Time\'s up!'}
              </div>
              <div className="countdown-ring">
                <svg viewBox="0 0 44 44" className="countdown-ring__svg">
                  <circle
                    className="countdown-ring__track"
                    cx="22" cy="22" r="18"
                    fill="none" strokeWidth="3"
                  />
                  <circle
                    className="countdown-ring__fill"
                    cx="22" cy="22" r="18"
                    fill="none" strokeWidth="3"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - countdown / 5)}
                  />
                </svg>
                <span className="countdown-ring__number">{countdown}</span>
              </div>
            </div>
          )}

          {/* No preview available — show countdown without audio */}
          {phase === 'audio' && !currentSong.previewUrl && (
            <div className="audio-player">
              <div className="audio-player__label">No audio — study the year!</div>
              <div className="countdown-ring">
                <svg viewBox="0 0 44 44" className="countdown-ring__svg">
                  <circle
                    className="countdown-ring__track"
                    cx="22" cy="22" r="18"
                    fill="none" strokeWidth="3"
                  />
                  <circle
                    className="countdown-ring__fill"
                    cx="22" cy="22" r="18"
                    fill="none" strokeWidth="3"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - countdown / 5)}
                  />
                </svg>
                <span className="countdown-ring__number">{countdown}</span>
              </div>
            </div>
          )}

          {/* Year clue — always visible */}
          <div className="clue-section__year">
            Year: <strong>{year}</strong>
          </div>

          {/* Attempt 2+: song summary */}
          {attempt >= 2 && phase === 'guess' && songSummary && (
            <div className="lyrics-reveal">
              <div className="lyrics-reveal__label">What it's about</div>
              <blockquote className="lyrics-reveal__text">
                <p>{songSummary}</p>
              </blockquote>
            </div>
          )}

          {/* Attempt 3: synonyms for title and artist */}
          {attempt >= 3 && phase === 'guess' && (titleSynonym || artistSynonym) && (
            <div className="synonym-hint">
              {titleSynonym && (
                <div className="synonym-hint__row">
                  <span className="synonym-hint__label">Title hint</span>
                  <span className="synonym-hint__value">{titleSynonym}</span>
                </div>
              )}
              {artistSynonym && (
                <div className="synonym-hint__row">
                  <span className="synonym-hint__label">Artist hint</span>
                  <span className="synonym-hint__value">{artistSynonym}</span>
                </div>
              )}
            </div>
          )}

        </div>{/* /clue-section */}

        {/* Result flash overlay */}
        {resultFlash && (
          <div className={`result-flash result-flash--${resultFlash.type}`}>
            {resultFlash.message}
          </div>
        )}

        {/* Guess form — only shown in guess phase */}
        {phase === 'guess' && (
          <form className="guess-form" onSubmit={handleSubmit}>
            <div className="guess-form__fields">

              <div className="guess-form__field">
                <label htmlFor="title-input">Song Title</label>
                <input
                  id="title-input"
                  ref={inputRef}
                  type="text"
                  className="guess-form__input"
                  placeholder="Enter song title…"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  disabled={isAdvancing}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              <div className="guess-form__field">
                <label htmlFor="artist-input">Artist</label>
                <input
                  id="artist-input"
                  type="text"
                  className="guess-form__input"
                  placeholder="Enter artist name…"
                  value={artistInput}
                  onChange={(e) => setArtistInput(e.target.value)}
                  disabled={isAdvancing}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

            </div>

            <div className="guess-form__footer">
              <div className="guess-form__attempts" aria-label="Attempts remaining">
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={[
                      'attempt-dot',
                      attempt === n ? 'attempt-dot--active' : '',
                      attempt > n  ? 'attempt-dot--used'   : '',
                    ].filter(Boolean).join(' ')}
                  />
                ))}
              </div>

              <div className="guess-form__actions">
                <button
                  type="button"
                  className="btn-pass"
                  onClick={handlePass}
                  disabled={isAdvancing}
                >
                  {attempt < 3 ? 'Give me a clue' : 'Reveal answer'}
                </button>
                <button
                  type="submit"
                  className="btn-primary guess-form__submit"
                  disabled={isAdvancing || !titleInput.trim() || !artistInput.trim()}
                >
                  Submit Guess
                </button>
              </div>
            </div>
          </form>
        )}

      </div>{/* /song-card */}
    </div>
  )
}
