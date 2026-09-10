import type { ReactElement } from 'react'

export default function Footer(): ReactElement {
  return (
    <footer className="bg-gray-800 text-gray-400 text-center py-4 mt-auto">
      <div className="container mx-auto px-4">
        <p className="text-sm">
          Agricultural Yield Intelligence System — AYIS v1.0.0
        </p>
        <p className="text-xs mt-1">
          Help farmers make better crop-production decisions.
        </p>
      </div>
    </footer>
  )
}
