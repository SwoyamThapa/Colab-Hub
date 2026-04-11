import { useContext, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

function authHeadersJson() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function externalHref(url) {
  const s = typeof url === 'string' ? url.trim() : ''
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    const w = parts[0]
    return w.length >= 2 ? w.slice(0, 2).toUpperCase() : `${w[0]}`.toUpperCase()
  }
  const first = parts[0][0] || ''
  const last = parts[parts.length - 1][0] || ''
  return `${first}${last}`.toUpperCase()
}

export default function Profile() {
  const { id } = useParams()
  const { user: currentUser } = useContext(AuthContext)

  const [profileUser, setProfileUser] = useState(null)
  const [galleryProjects, setGalleryProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [editing, setEditing] = useState(false)
  const [editBio, setEditBio] = useState('')
  const [editSkills, setEditSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [editGithub, setEditGithub] = useState('')
  const [editLinkedIn, setEditLinkedIn] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/users/${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.message || 'Failed to load profile')
        }
        const data = await res.json()
        if (cancelled) return
        setProfileUser(data.user)
        setGalleryProjects(Array.isArray(data.completedProjects) ? data.completedProjects : [])
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Something went wrong')
          setProfileUser(null)
          setGalleryProjects([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [id])

  const isOwnProfile =
    currentUser &&
    profileUser &&
    String(currentUser.id) === String(profileUser._id)

  const openEdit = () => {
    if (!profileUser) return
    setEditBio(profileUser.bio ?? '')
    setEditSkills(
      Array.isArray(profileUser.skills) ? [...profileUser.skills] : []
    )
    setEditGithub(profileUser.githubLink ?? '')
    setEditLinkedIn(profileUser.linkedIn ?? '')
    setSkillInput('')
    setEditing(true)
  }

  const addSkillFromInput = () => {
    const trimmed = skillInput.trim()
    if (!trimmed) return
    setEditSkills((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    )
    setSkillInput('')
  }

  const handleSkillInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkillFromInput()
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: authHeadersJson(),
        body: JSON.stringify({
          bio: editBio,
          skills: editSkills,
          githubLink: editGithub,
          linkedIn: editLinkedIn,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.message || 'Failed to update profile')
        return
      }

      const updated = await res.json()
      setProfileUser(updated)
      setEditing(false)
      setError(null)
    } catch (err) {
      setError(err?.message || 'Something went wrong')
    } finally {
      setSavingProfile(false)
    }
  }

  const skillsList = Array.isArray(profileUser?.skills) ? profileUser.skills : []

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <p className="mb-6 text-sm text-slate-600">
          <Link to="/feed" className="text-indigo-600 hover:text-indigo-500">
            Back to Feed
          </Link>
        </p>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
            Loading profile…
          </div>
        )}

        {!loading && error && !profileUser && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 shadow-sm">
            {error}
          </div>
        )}

        {!loading && profileUser && (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div
                  className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-2xl font-bold tracking-tight text-white shadow-md ring-4 ring-indigo-100"
                  aria-hidden
                >
                  {initialsFromName(profileUser.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-800">
                        {profileUser.name}
                      </h1>
                      <p className="mt-1 text-sm text-slate-600">{profileUser.email}</p>
                    </div>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          if (editing) {
                            setEditing(false)
                            setSkillInput('')
                          } else {
                            openEdit()
                          }
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                      >
                        {editing ? 'Cancel' : 'Edit Profile'}
                      </button>
                    )}
                  </div>

                  {(profileUser.githubLink || profileUser.linkedIn) && (
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      {profileUser.githubLink && (
                        <a
                          href={externalHref(profileUser.githubLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                        >
                          GitHub
                        </a>
                      )}
                      {profileUser.linkedIn && (
                        <a
                          href={externalHref(profileUser.linkedIn)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-sky-700 hover:text-sky-600 hover:underline"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  )}

                  {profileUser.bio && (
                    <p className="mt-4 text-sm text-slate-700">{profileUser.bio}</p>
                  )}

                  {skillsList.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skillsList.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {editing && isOwnProfile && (
                <form onSubmit={handleSaveProfile} className="mt-8 space-y-4 border-t border-slate-100 pt-6">
                  {error && (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  )}
                  <div>
                    <label htmlFor="edit-bio" className="block text-xs font-medium text-slate-700">
                      Bio
                    </label>
                    <textarea
                      id="edit-bio"
                      rows={4}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-700">
                      Skills
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        id="edit-skills-input"
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleSkillInputKeyDown}
                        placeholder="Type a skill and press Enter"
                        className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={addSkillFromInput}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-100"
                      >
                        Add
                      </button>
                    </div>
                    {editSkills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {editSkills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-100 pl-3 pr-1 py-1 text-xs font-medium text-indigo-800"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() =>
                                setEditSkills((prev) =>
                                  prev.filter((s) => s !== skill)
                                )
                              }
                              className="flex h-5 w-5 items-center justify-center rounded-full text-indigo-700 hover:bg-indigo-200"
                              aria-label={`Remove ${skill}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="edit-github" className="block text-xs font-medium text-slate-700">
                      GitHub link
                    </label>
                    <input
                      id="edit-github"
                      type="text"
                      value={editGithub}
                      onChange={(e) => setEditGithub(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-linkedin" className="block text-xs font-medium text-slate-700">
                      LinkedIn URL
                    </label>
                    <input
                      id="edit-linkedin"
                      type="text"
                      value={editLinkedIn}
                      onChange={(e) => setEditLinkedIn(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving…' : 'Save'}
                  </button>
                </form>
              )}
            </section>

            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800">Completed Projects</h2>
              <p className="mt-1 text-sm text-slate-600">
                Projects this member finished as author or collaborator.
              </p>

              {galleryProjects.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">No completed projects yet.</p>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {galleryProjects.map((p) => (
                    <article
                      key={p._id}
                      className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{p.title}</h3>
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Completed
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        <span className="font-medium text-slate-700">Category:</span>{' '}
                        {p.category}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
