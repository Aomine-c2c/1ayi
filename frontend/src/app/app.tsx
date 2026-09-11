import type { AppProps } from 'next/app'
import { ReactElement, useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps): ReactElement {
  useEffect(() => {
    // Remove server-side Leaflet DOM compatibility warnings
    const win = typeof window !== 'undefined' ? (window as any) : null
    if (win && win.L) {
      delete win.L.Icon.Default.prototype._getIconUrl
      win.L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/default-icon-retina.png',
        iconUrl: '/leaflet/default-icon.png',
        shadowUrl: '/leaflet/default-shadow.png',
      })
    }
  }, [])

  return <Component {...pageProps} />
}
