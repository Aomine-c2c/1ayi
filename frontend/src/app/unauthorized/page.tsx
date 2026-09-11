import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto mb-4 border border-amber-200">
          🔒
        </div>
        <h1 className="text-xl font-bold text-gray-900">Authentication Required</h1>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          You need an active session to access this area of the Agricultural Intelligence Platform.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            Sign in to your account
          </Link>
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-800 py-2 font-medium"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
