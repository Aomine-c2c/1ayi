import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex flex-col">
      {/* Nav */}
      <header className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-lg">🌾</div>
          <span className="text-white font-bold text-lg">AYIS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/80 hover:text-white text-sm font-medium transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-white text-primary-800 hover:bg-primary-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-16">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-white/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
          Agricultural Intelligence Platform
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight max-w-3xl text-balance mb-6">
          Smarter farming starts with better data
        </h1>
        <p className="text-white/60 text-lg max-w-xl mb-10 leading-relaxed">
          AYIS brings precision agriculture intelligence to smallholder and commercial farms —
          crop recommendations, yield estimates, and weather-driven insights in one platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/login"
            className="bg-earth-400 hover:bg-earth-300 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm shadow-lg"
          >
            Access Dashboard
          </Link>
          <Link
            href="/register"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-sm border border-white/20"
          >
            Create free account
          </Link>
        </div>

        {/* Feature pills */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl">
          {[
            { icon: '🌾', label: 'Farm Management' },
            { icon: '🌱', label: 'Crop Cycle Tracking' },
            { icon: '🧠', label: 'AI Recommendations' },
            { icon: '🌤️', label: 'Weather Integration' },
            { icon: '📊', label: 'Yield Analytics' },
            { icon: '👥', label: 'Role-based Access' },
          ].map(f => (
            <div
              key={f.label}
              className="flex items-center gap-2.5 bg-white/8 border border-white/10 rounded-xl px-4 py-3 text-left"
            >
              <span className="text-xl">{f.icon}</span>
              <span className="text-white/80 text-sm font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-white/10 text-center text-white/30 text-xs">
        AYIS v1.0.0 — Agricultural Yield Intelligence System
      </footer>
    </div>
  )
}
