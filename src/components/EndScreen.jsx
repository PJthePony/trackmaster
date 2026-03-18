import { useState, useEffect } from 'react'
import { generateVerdict } from '../services/claudeService'

function getGrade(score) {
  if (score >= 27) return { grade: 'S', stars: 5, label: 'Perfect Ear' }
  if (score >= 22) return { grade: 'A', stars: 4, label: 'Chart Wizard' }
  if (score >= 16) return { grade: 'B', stars: 3, label: 'Radio Regular' }
  if (score >= 10) return { grade: 'C', stars: 2, label: 'Casual Listener' }
  if (score >= 5)  return { grade: 'D', stars: 1, label: 'Off the Charts' }
  return                  { grade: 'F', stars: 0, label: 'What Year Was That?' }
}

export default function EndScreen({ year, results, totalScore }) {
  const [verdict, setVerdict]               = useState(null)
  const [verdictLoading, setVerdictLoading] = useState(true)
  const [verdictError, setVerdictError]     = useState(null)

  useEffect(() => {
    let cancelled = false

    generateVerdict(totalScore, year)
      .then((text) => {
        if (!cancelled) {
          setVerdict(text)
          setVerdictLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setVerdictError(err.message)
          setVerdictLoading(false)
        }
      })

    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { grade, stars, label } = getGrade(totalScore)
  const starDisplay = '★'.repeat(stars) + '☆'.repeat(5 - stars)

  return (
    <div className="end-screen">

      {/* ── Hero score block ── */}
      <div className="end-screen__hero">
        <div className="end-screen__title">Game Over</div>
        <div className="end-screen__year">Billboard Hot 100 — {year}</div>

        <div className="end-screen__score-display">
          <span className="end-screen__score-number">{totalScore}</span>
          <span className="end-screen__score-denom"> / 30</span>
        </div>

        <div className="end-screen__grade">{grade}</div>
        <div className="end-screen__stars">{starDisplay}</div>
        <div className="end-screen__label">{label}</div>
      </div>

      {/* ── Claude verdict ── */}
      <div className="verdict-box">
        <div className="verdict-box__heading">The Verdict</div>

        {verdictLoading && (
          <div className="verdict-box__loading">
            <div className="loading-dots">
              <span /><span /><span />
            </div>
            <p>Consulting the archives…</p>
          </div>
        )}

        {verdictError && !verdictLoading && (
          <p className="verdict-box__error">Could not load verdict.</p>
        )}

        {verdict && (
          <p className="verdict-box__text">{verdict}</p>
        )}
      </div>

      {/* ── Song-by-song results ── */}
      <div className="results-table">
        <div className="results-table__heading">Song Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Artist</th>
              <th style={{ textAlign: 'center' }}>Tries</th>
              <th style={{ textAlign: 'right' }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr
                key={i}
                className={`results-table__row results-table__row--${r.points > 0 ? 'correct' : 'missed'}`}
              >
                <td>{r.song.rank}</td>
                <td className="results-table__title">{r.song.title}</td>
                <td>{r.song.artist}</td>
                <td className="results-table__attempts">
                  {r.points > 0 ? r.attemptsUsed : '✗'}
                </td>
                <td className="results-table__points">
                  {r.points > 0 ? `+${r.points}` : '0'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="results-table__total">
              <td colSpan={4}>Total</td>
              <td style={{ textAlign: 'right' }}>{totalScore} / 30</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Play again ── */}
      <button
        className="btn-primary end-screen__play-again"
        onClick={() => window.location.reload()}
      >
        Play Again
      </button>

    </div>
  )
}
