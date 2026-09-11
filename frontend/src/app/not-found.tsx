import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-xs">
        <span className="text-5xl">🌾</span>
        <h1 className="text-2xl font-black text-gray-900 mt-4">404 - Page Not Found</h1>
        <p className="text-xs text-gray-500 mt-2">
          The agricultural intelligence record or dashboard page you requested does not exist.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
