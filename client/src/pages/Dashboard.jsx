import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

const API_BASE = 'http://localhost:5005'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const authHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    const fetchRequests = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/requests`)
        if (!res.ok) {
          throw new Error('Failed to load your requests')
        }

        const data = await res.json()
        const nextRequests = Array.isArray(data)
          ? data
          : Array.isArray(data?.requests)
            ? data.requests
            : []

        setRequests(nextRequests)
      } catch (err) {
        setError(err?.message || 'Something went wrong')
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [user, navigate])

  const currentUserId = user?.id ?? null

  const myRequests = useMemo(() => {
    if (!currentUserId) return []
    return requests.filter((r) => {
      const authorId = r?.author?._id ?? r?.author
      return authorId != null && String(authorId) === String(currentUserId)
    })
  }, [requests, currentUserId])

  const myCollaborations = useMemo(() => {
    if (!currentUserId) return []
    return requests.filter((r) => {
      const helperId = r?.helper?._id ?? r?.helper
      return (
        r?.status === 'accepted' &&
        helperId != null &&
        String(helperId) === String(currentUserId)
      )
    })
  }, [requests, currentUserId])

  if (!user) {
    return null
  }

  const handleDeleteRequest = async (idToDelete) => {
    if (!idToDelete) return

    const ok = window.confirm('Delete this project request? This cannot be undone.')
    if (!ok) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      setError(null)
      const res = await fetch(`${API_BASE}/api/requests/${idToDelete}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders(),
        },
      })

      if (res.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.message || 'Failed to delete request')
        return
      }

      setRequests((prev) =>
        prev.filter((r) => String(r?._id) !== String(idToDelete))
      )
    } catch (err) {
      setError(err?.message || 'Something went wrong')
    }
  }

  const handleCompleteRequest = async (idToComplete) => {
    if (!idToComplete) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      setError(null)
      const res = await fetch(`${API_BASE}/api/requests/${idToComplete}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ status: 'completed' }),
      })

      if (res.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.message || 'Failed to mark completed')
        return
      }

      const updated = await res.json()
      setRequests((prev) =>
        prev.map((r) => (String(r?._id) === String(idToComplete) ? updated : r))
      )
    } catch (err) {
      setError(err?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">
            Welcome back, {user.name}!
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            <Link to="/feed" className="text-indigo-600 hover:text-indigo-500">
              Back to Feed
            </Link>
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading your dashboard...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">My Posts</h2>
              <p className="mt-1 text-sm text-slate-600">
                Projects you created as a student request.
              </p>

              {myRequests.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  You haven’t posted any requests yet.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {myRequests.map((r) => (
                    <div
                      key={r._id}
                      className={`rounded-lg border border-slate-200 p-4 ${
                        r.status === 'completed' ? 'bg-slate-100' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {r.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            Category: <span className="font-medium">{r.category}</span>
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                            r.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {r.status === 'completed' ? 'Completed' : r.status}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-slate-700">
                        {r.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/workspace/${r._id}`)}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Enter Workspace
                        </button>
                        {r.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleCompleteRequest(r._id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
                          >
                            Complete Project
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(r._id)}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">Helping With</h2>
              <p className="mt-1 text-sm text-slate-600">
                Requests you accepted and are helping with.
              </p>

              {myCollaborations.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  Nothing to help with yet.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {myCollaborations.map((r) => (
                    <div
                      key={r._id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {r.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            Category: <span className="font-medium">{r.category}</span>
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                          accepted
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-slate-700">
                        {r.description}
                      </p>

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-slate-600">
                          Author:{' '}
                          <span className="font-medium">
                            {r.author?.name ?? 'Unknown author'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/workspace/${r._id}`)}
                          className="inline-flex shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          Enter Workspace
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
