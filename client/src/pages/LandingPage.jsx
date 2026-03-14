import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-50 blur-2xl" />
          <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-slate-100 blur-2xl" />

          <div className="relative">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Find Your Perfect Project Teammates
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
              Pitch ideas, discover collaborators by skill, and build student projects
              from conception to portfolio—all in one place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/feed"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Browse Projects
              </Link>

              <p className="text-sm text-slate-500">
                Start exploring requests and help others grow.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Skill-based discovery</p>
                <p className="mt-1 text-sm text-slate-600">
                  Find the right people faster.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Request lifecycle</p>
                <p className="mt-1 text-sm text-slate-600">
                  Track status from pending to accepted.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Clean, responsive UI</p>
                <p className="mt-1 text-sm text-slate-600">
                  Works great on mobile and desktop.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Colab Hub</span>
          <span className="text-slate-400">MERN project incubation for students</span>
        </div>
      </footer>
    </div>
  )
}

