import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-4 border border-rose-200">
          ⛔
        </div>
        <h1 className="text-xl font-bold text-gray-900">Access Restricted (403)</h1>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Your account role does not possess the permissions required to view or execute actions on this resource.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/dashboard/profile"
            className="text-xs text-gray-500 hover:text-gray-800 py-2 font-medium"
          >
            Review your role permissions
          </Link>
        </div>
      </div>
    </div>
  )
}
