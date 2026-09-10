import type { ReactElement } from 'react'

interface Props {
  title: string
  children?: ReactElement
  subtitle?: string
  actions?: ReactElement
}

export default function PageHeader({
  title,
  children,
  subtitle,
  actions,
}: Props): ReactElement {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
