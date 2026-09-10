"use client"
import type { ReactElement } from 'react'
import { AuthProvider } from '@/lib/auth-context'

export default function RootLayout({ children }: { children: ReactElement }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AYIS — Agricultural Yield Intelligence System</title>
        <meta name="description" content="Agricultural Yield Intelligence System" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌾</text></svg>" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
