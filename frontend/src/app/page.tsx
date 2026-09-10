// AYIS frontend — Landing page.
import type { ReactElement } from 'react'

interface PageProps {
  // no props needed for static landing
}

export default function Home(): ReactElement {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1'

  return (
    <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: '#166534', marginBottom: 8 }}>🌾 Agricultural Yield Intelligence System</h1>
      <p style={{ color: '#444', fontSize: 18 }}>AYIS — Next.js frontend for the Django/DRF backend.</p>
      <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '24px 0' }} />
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#166534', marginBottom: 8 }}>API Status</h2>
        <p id="api-status">Checking backend connection...</p>
      </section>
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#166534', marginBottom: 8 }}>Features</h2>
        <ul style={{ lineHeight: 1.8, color: '#333' }}>
          <li>Farm management with map-based location selection</li>
          <li>Crop cycle lifecycle (PLANNED → PLANTED → GROWING → NEAR_HARVEST → HARVESTED)</li>
          <li>Multi-factor crop suitability recommendations</li>
          <li>Weather data from Open-Meteo (no API key required)</li>
          <li>Yield estimation with transparent confidence scores</li>
          <li>Role-based access: Farmer, Agricultural Officer, Administrator</li>
        </ul>
      </section>
      <footer style={{ color: '#888', fontSize: 14, marginTop: 32, borderTop: '1px solid #eee', paddingTop: 16 }}>
        AYIS v1.0.0 — Backend: <a href="http://localhost:8000/api/v1/" style={{ color: '#166534' }}>localhost:8000</a>
      </footer>
    </main>
  )
}
