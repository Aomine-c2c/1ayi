import type { ReactElement, InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  help?: string
}

export default function Input({
  label,
  error,
  help,
  className = '',
  id,
  ...props
}: Props): ReactElement {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md
          px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
          focus:ring-blue-500 focus:border-blue-500`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {help && !error && <p className="text-gray-500 text-sm mt-1">{help}</p>}
    </div>
  )
}
