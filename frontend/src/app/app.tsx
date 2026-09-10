import type { AppProps } from 'next/app'
import { ReactElement, useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps): ReactElement {
  useEffect(() => {
    // Remove server-side Leaflet DOM compatibility warnings
    if (window && window.L) {
      delete window.L.Icon.Default.prototype._getIconUrl
      window.L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/default-icon-retina.png',
        iconUrl: '/leaflet/default-icon.png',
        shadowUrl: '/leaflet/default-shadow.png',
      })
    }
  }, [])

  return <Component {...pageProps} />
}
