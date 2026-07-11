function App() {
  const error: string | null = null

  return (
    <div className="flex flex-col min-h-screen max-w-[1200px] mx-auto p-5 box-border bg-[#f5f5f7] text-[#1d1d1f] antialiased font-sans">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold m-0 mb-2">My PDF Signer</h1>
        <p className="text-[#86868b] text-sm font-medium m-0">
          Your document is processed locally and never uploaded.
        </p>
      </header>

      <main className="flex-1 bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-8 flex flex-col items-center justify-center border border-[#d2d2d7]">
        {error && (
          <div className="bg-[#ffebeb] text-[#ff3b30] border border-[#ffcccc] px-5 py-3 rounded-lg mb-5 w-full box-border">
            {error}
          </div>
        )}

        <div className="text-center text-[#86868b]">
          <p>Phase 1 Setup Complete. Ready for PDF and Signature components.</p>
        </div>
      </main>

      <footer className="text-center py-5 text-[#86868b] text-xs">
        <p className="m-0">Local PDF Signer — Privacy-First</p>
      </footer>
    </div>
  )
}

export default App
