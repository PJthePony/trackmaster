export default function LoadingScreen({ year, error }) {
  if (error) {
    return (
      <div className="loading-screen">
        <div className="loading-card error-card">
          <div className="error-icon">&#9888;</div>
          <h2>Static on the Line</h2>
          <p className="error-msg">{error}</p>
          <p className="error-hint">Check your API keys in <code>.env</code> and refresh.</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="loading-screen">
      <div className="loading-card">
        <div className="cassette-anim">
          <div className="cassette-body">
            <div className="cassette-window">
              <div className="reel reel-left spinning" />
              <div className="tape-strip" />
              <div className="reel reel-right spinning" />
            </div>
          </div>
        </div>
        <h2 className="loading-title">Digging Through the Crates</h2>
        <p className="loading-sub">Pulling the top hits of <strong>{year}</strong>…</p>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}
