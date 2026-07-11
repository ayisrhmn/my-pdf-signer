function App() {
  const error: string | null = null

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>My PDF Signer</h1>
        <p className="privacy-notice">
          Your document is processed locally and never uploaded.
        </p>
      </header>

      <main className="app-main">
        {error && <div className="error-banner">{error}</div>}

        <div className="empty-state">
          <p>Phase 1 Setup Complete. Ready for PDF and Signature components.</p>
        </div>
      </main>

      <footer className="app-footer">
        <p>Local PDF Signer — Privacy-First</p>
      </footer>
    </div>
  )
}

export default App
