import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'token'

function userFromDecoded(decoded) {
  if (!decoded || typeof decoded !== 'object') return null
  const id = decoded.userId ?? decoded.sub ?? decoded.id
  if (id == null) return null
  return {
    id: String(id),
    name: decoded.name ?? decoded.email ?? 'User',
    email: typeof decoded.email === 'string' ? decoded.email : '',
  }
}

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const applyToken = useCallback((token) => {
    try {
      const decoded = jwtDecode(token)
      setUser(userFromDecoded(decoded))
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      applyToken(token)
    } else {
      setUser(null)
    }
  }, [applyToken])

  const login = useCallback(
    (token) => {
      localStorage.setItem(TOKEN_KEY, token)
      applyToken(token)
    },
    [applyToken]
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
    }),
    [user, login, logout]
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}
