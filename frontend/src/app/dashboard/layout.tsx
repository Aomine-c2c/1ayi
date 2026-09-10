import type { ReactElement } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function DashboardLayout({
  children,
}: {
  children: ReactElement
}): ReactElement {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
    </div>
  )
}
