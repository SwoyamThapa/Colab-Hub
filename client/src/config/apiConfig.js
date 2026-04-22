const PRODUCTION_API_BASE = 'https://colab-hub-production-1888.up.railway.app'

/**
 * API origin for JSON requests and Socket.io.
 * - In dev, empty string uses same-origin + Vite proxy when VITE_API_BASE_URL is unset.
 * - In production (build), defaults to the Railway host unless VITE_API_BASE_URL is set.
 */
export function getApiBase() {
  const v = import.meta.env.VITE_API_BASE_URL
  if (v != null && String(v).trim() !== '') {
    return String(v).replace(/\/$/, '')
  }
  if (import.meta.env.DEV) {
    return ''
  }
  return PRODUCTION_API_BASE
}

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  const base = getApiBase()
  if (base) {
    return `${base}${p}`
  }
  return p
}
