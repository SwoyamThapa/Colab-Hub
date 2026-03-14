import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

function authHeadersJson() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function authHeaders() {
  const token = localStorage.getItem('token')
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function idEquals(a, b) {
  if (a == null || b == null) return false
  return String(a) === String(b)
}

function isAllowedInWorkspace(request, userId) {
  if (!request || !userId) return false
  const authorId = request.author?._id ?? request.author
  const helperId = request.helper?._id ?? request.helper
  if (idEquals(authorId, userId)) return true
  if (helperId != null && idEquals(helperId, userId)) return true
  return false
}

export default function Workspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [taskTitle, setTaskTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [togglingTaskId, setTogglingTaskId] = useState(null)
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [addingResource, setAddingResource] = useState(false)
  const [deletingResourceId, setDeletingResourceId] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (!user || !id) return

    let cancelled = false

    const run = async () => {
      setLoading(true)
      setRequest(null)

      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      try {
        const res = await fetch(`/api/requests/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (cancelled) return

        if (res.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        if (!res.ok) {
          navigate('/feed', { replace: true })
          return
        }

        const data = await res.json()

        if (!isAllowedInWorkspace(data, user.id)) {
          navigate('/feed', { replace: true })
          return
        }

        setRequest(data)
      } catch {
        if (!cancelled) {
          navigate('/feed', { replace: true })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [user, id, navigate])

  const handleAddTask = async (e) => {
    e.preventDefault()
    const trimmed = taskTitle.trim()
    if (!trimmed || !id) return

    setAddingTask(true)
    try {
      const res = await fetch(`/api/requests/${id}/tasks`, {
        method: 'POST',
        headers: authHeadersJson(),
        body: JSON.stringify({ title: trimmed }),
      })

      if (res.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      if (!res.ok) {
        return
      }

      const data = await res.json()
      setRequest(data)
      setTaskTitle('')
    } finally {
      setAddingTask(false)
    }
  }

  const handleToggleTask = async (taskId) => {
    if (!id || !taskId) return

    setTogglingTaskId(taskId)
    try {
      const res = await fetch(`/api/requests/${id}/tasks/${taskId}`, {
        method: 'PUT',
        headers: authHeaders(),
      })

      if (res.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      if (!res.ok) {
        return
      }

      const data = await res.json()
      setRequest(data)
    } finally {
      setTogglingTaskId(null)
    }
  }

  const handleAddResource = async (e) => {
    e.preventDefault()
    const t = resourceTitle.trim()
    const u = resourceUrl.trim()
    if (!t || !u || !id) return

    setAddingResource(true)
    try {
      const res = await fetch(`/api/requests/${id}/resources`, {
        method: 'POST',
        headers: authHeadersJson(),
        body: JSON.stringify({ title: t, url: u }),
      })

      if (res.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      if (!res.ok) {
        return
      }

      const data = await res.json()
      setRequest(data)
      setResourceTitle('')
      setResourceUrl('')
    } finally {
      setAddingResource(false)
    }
  }

  const handleDeleteResource = async (resourceId) => {
    if (!id || !resourceId) return

    setDeletingResourceId(resourceId)
    try {
      const res = await fetch(`/api/requests/${id}/resources/${resourceId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })

      if (res.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      if (!res.ok) {
        return
      }

      const data = await res.json()
      setRequest(data)
    } finally {
      setDeletingResourceId(null)
    }
  }

  if (!user) {
    return null
  }

  const author = request?.author
  const helper = request?.helper
  const tasks = Array.isArray(request?.tasks) ? request.tasks : []
  const resources = Array.isArray(request?.resources) ? request.resources : []

  const hrefForResource = (url) => {
    const s = typeof url === 'string' ? url.trim() : ''
    if (!s) return '#'
    if (/^https?:\/\//i.test(s)) return s
    return `https://${s}`
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
              {loading ? 'Loading…' : request?.title ?? 'Workspace'}
            </h1>
            {!loading && request?.category && (
              <p className="mt-1 text-sm text-slate-600">
                Category:{' '}
                <span className="font-medium text-slate-800">{request.category}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to Dashboard
          </button>
        </header>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
            Loading workspace…
          </div>
        )}

        {!loading && request && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800">Team Members</h2>
                <p className="mt-1 text-sm text-slate-600">
                  People with access to this private workspace.
                </p>

                <div className="mt-6 space-y-6">
                  <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {author?.name ?? 'Unknown'}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {author?.email ?? '—'}
                      </p>
                    </div>
                    <span className="inline-flex w-fit items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
                      Project Lead
                    </span>
                  </div>

                  {helper ? (
                    <div className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {helper?.name ?? 'Unknown'}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {helper?.email ?? '—'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                          Collaborator
                        </span>
                        <select
                          disabled
                          aria-label="Role (coming soon)"
                          className="mt-1 w-full min-w-[10rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm sm:w-auto"
                          defaultValue="Frontend"
                        >
                          <option>Frontend</option>
                          <option>Backend</option>
                          <option>Design</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      No collaborator yet. When someone accepts this request, they will appear here.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-800">Project Resources</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Links and references for your team (repos, designs, docs).
                </p>

                <form onSubmit={handleAddResource} className="mt-6 space-y-3">
                  <div>
                    <label htmlFor="resource-title" className="block text-xs font-medium text-slate-700">
                      Title
                    </label>
                    <input
                      id="resource-title"
                      type="text"
                      value={resourceTitle}
                      onChange={(e) => setResourceTitle(e.target.value)}
                      placeholder="e.g. GitHub Repo"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="resource-url" className="block text-xs font-medium text-slate-700">
                      URL
                    </label>
                    <input
                      id="resource-url"
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      value={resourceUrl}
                      onChange={(e) => setResourceUrl(e.target.value)}
                      placeholder="https://…"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={
                      addingResource ||
                      !resourceTitle.trim() ||
                      !resourceUrl.trim()
                    }
                    className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 sm:w-auto"
                  >
                    {addingResource ? 'Adding…' : 'Add Link'}
                  </button>
                </form>

                <ul className="mt-6 space-y-2">
                  {resources.length === 0 ? (
                    <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
                      No links yet. Add a repo, Figma file, or doc above.
                    </li>
                  ) : (
                    resources.map((res) => {
                      const rid = res._id
                      const busy = deletingResourceId === rid
                      return (
                        <li
                          key={rid}
                          className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
                        >
                          <a
                            href={hrefForResource(res.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex-1 truncate text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                          >
                            {res.title}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteResource(rid)}
                            disabled={busy}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            aria-label={`Remove ${res.title}`}
                            title="Remove link"
                          >
                            ×
                          </button>
                        </li>
                      )
                    })
                  )}
                </ul>
              </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">Project Tasks</h2>
              <p className="mt-1 text-sm text-slate-600">
                Track work for this project. Checkboxes sync for everyone in the workspace.
              </p>

              <form onSubmit={handleAddTask} className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="New task title"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={addingTask || !taskTitle.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {addingTask ? 'Adding…' : 'Add'}
                </button>
              </form>

              <ul className="mt-6 space-y-3">
                {tasks.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
                    No tasks yet. Add one above.
                  </li>
                ) : (
                  tasks.map((task) => {
                    const tid = task._id
                    const busy = togglingTaskId === tid
                    return (
                      <li
                        key={tid}
                        className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(task.isCompleted)}
                          onChange={() => handleToggleTask(tid)}
                          disabled={busy}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                        />
                        <span
                          className={`text-sm ${
                            task.isCompleted
                              ? 'text-slate-500 line-through'
                              : 'font-medium text-slate-900'
                          }`}
                        >
                          {task.title}
                        </span>
                      </li>
                    )
                  })
                )}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
