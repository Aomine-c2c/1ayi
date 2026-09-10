"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api/client'
import type { Farm } from '@/lib/types'

function Loading() { return <div className="text-center py-12 text-gray-500">Loading farms...</div> }

function ErrorState({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
      {msg}
    </div>
  )
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api.getFarms()
        setFarms(data)
      } catch (e: any) {
        setError(e.message || 'Failed to load farms')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Farms</h1>
        <p className="text-gray-500 mt-1">Manage your agricultural land holdings</p>
      </div>

      {error && <ErrorState msg={error} />}
      {loading ? <Loading /> : farms.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded p-8 text-center">
          <p className="text-gray-500 mb-4">No farms found.</p>
          <p className="text-sm text-gray-400">Create your first farm to start tracking crops and yields.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {farms.map(farm => (
            <div key={farm.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{farm.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {farm.area_ha ? `${farm.area_ha.toFixed(2)} ha` : 'Area not set'} {farm.notes ? `· ${farm.notes}` : ''}
                  </p>
                </div>
                <span className="text-xs text-gray-400">ID: {farm.id}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Lat:</span> {farm.latitude?.toFixed(6) ?? '—'}
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Lng:</span> {farm.longitude?.toFixed(6) ?? '—'}
                </div>
              </div>
              {farm.owner_username && (
                <p className="text-xs text-gray-400 mt-2">Owner: {farm.owner_username}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
