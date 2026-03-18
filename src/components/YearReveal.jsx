import { useEffect, useState } from 'react'

export default function YearReveal({ year, onDone }) {
  const [stage, setStage] = useState(0)
  // stage 0: blank → fade in "The year is..."
  // stage 1: show year with big animate
  // stage 2: show CTA button

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 800)
    const t2 = setTimeout(() => setStage(2), 2200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div className="year-reveal">
      <div className="vinyl-bg" />
      <div className="reveal-content">
        <p className={`reveal-label ${stage >= 1 ? 'visible' : ''}`}>
          Your year is
        </p>
        <div className={`reveal-year ${stage >= 1 ? 'visible' : ''}`}>
          {year}
        </div>
        <p className={`reveal-sub ${stage >= 2 ? 'visible' : ''}`}>
          Billboard Year-End Hot 100
        </p>
        <button
          className={`btn-primary reveal-btn ${stage >= 2 ? 'visible' : ''}`}
          onClick={onDone}
        >
          Drop the Needle
        </button>
      </div>

      <div className="spinning-vinyl">
        <div className="vinyl-outer">
          <div className="vinyl-label">
            <span>TM</span>
          </div>
        </div>
      </div>
    </div>
  )
}
