import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

export default function DiscoveryFeed() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const decoded = jwtDecode(token)
      // Token payload is signed as: { userId, email } (see server authController)
      setCurrentUserId(decoded?.userId ?? null)
    } catch {
      setCurrentUserId(null)
    }
  }, [])

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch('http://localhost:5005/api/requests')
        if (!res.ok) {
          throw new Error('Failed to load requests')
        }

        const data = await res.json()
        const nextRequests = Array.isArray(data)
          ? data
          : Array.isArray(data?.requests)
            ? data.requests
            : []

        setRequests(nextRequests)
      } catch (err) {
        setError(err.message || 'Something went wrong')
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  const handleAcceptRequest = async (requestId) => {
    setError(null)

    const token = localStorage.getItem('token')
    if (!token) {
      setError('You must be logged in to accept requests.')
      return
    }

    try {
      const res = await fetch(
        `http://localhost:5005/api/requests/${requestId}/accept`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.message || 'Failed to accept request')
        return
      }

      // Update the specific request in-place so the UI changes immediately.
      setRequests((prev) =>
        prev.map((r) => (r._id === requestId ? data : r))
      )
    } catch (err) {
      setError(err?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Discovery Feed
              </h2>
              <p className="mt-1 text-slate-600">
                Browse project requests from students looking for teammates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/create-request')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Create New Request
            </button>
          </div>

          {loading && (
            <p className="mt-6 text-sm text-slate-500">Loading requests...</p>
          )}

          {!loading && error && (
            <p className="mt-6 text-sm text-rose-600">{error}</p>
          )}

          {!loading && !error && requests.length === 0 && (
            <p className="mt-6 text-sm text-slate-500">
              No requests found. Be the first to post one!
            </p>
          )}

          {!loading && !error && requests.length > 0 && (
            <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => (
                <article
                  key={request._id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <header>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {request.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        {request.category}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {request.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      by {request.author?.name ?? 'Unknown author'}
                    </p>
                  </header>

                  <p className="mt-3 text-sm text-slate-700">
                    {request.description}
                  </p>

                  <div className="mt-4">
                    {request.status === 'pending' && currentUserId && (
                      (() => {
                        const authorId =
                          request.author?._id ?? request.author ?? null
                        const isOwnRequest =
                          authorId != null && String(authorId) === String(currentUserId)

                        if (isOwnRequest) return null

                        return (
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(request._id)}
                            className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          >
                            Offer Help
                          </button>
                        )
                      })()
                    )}

                    {request.status === 'accepted' && (
                      <div className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 opacity-80">
                        Accepted
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
