import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function DiscoveryFeed() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects')
        if (!res.ok) {
          throw new Error('Failed to load projects')
        }
        const data = await res.json()
        setProjects(data)
      } catch (err) {
        setError(err.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-tight text-indigo-600 hover:text-indigo-700">
            Colab Hub
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Discovery Feed</h2>
              <p className="mt-1 text-slate-600">
                Explore student-led projects looking for collaborators.
              </p>
            </div>
          </div>

          {loading && (
            <p className="mt-6 text-sm text-slate-500">Loading projects...</p>
          )}

          {!loading && error && (
            <p className="mt-6 text-sm text-rose-600">{error}</p>
          )}

          {!loading && !error && projects.length === 0 && (
            <p className="mt-6 text-sm text-slate-500">
              No projects found. Seed the database or create a new project to see it here.
            </p>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <article
                  key={project._id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <header>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {project.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      by {project.owner?.name ?? 'Unknown owner'}
                    </p>
                  </header>

                  <p className="mt-3 text-sm text-slate-700">{project.description}</p>

                  <div className="mt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Required Roles
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {project.rolesNeeded?.length ? (
                        project.rolesNeeded.map((role) => (
                          <span
                            key={role}
                            className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                          >
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">
                          No specific roles listed
                        </span>
                      )}
                    </div>
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
