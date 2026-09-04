/**
 * AuthContext.jsx — global login state for NEED.
 *
 * WHAT: A React context that tells every component who is logged in.
 * WHY:  Without a context, each page would need to re-fetch /api/auth/me
 *       independently, and the navbar would have no way to know the username.
 * HOW:
 *   1. <AuthProvider> wraps the whole app in main.jsx.
 *   2. On mount it calls GET /api/auth/me to restore the session after a
 *      page refresh (so the user stays logged in).
 *   3. Components call `useAuth()` to read `user`, call `login()`, or
 *      call `logout()`.
 *
 * The `loading` flag is true only during the initial /me check. Pages that
 * need auth can show a spinner until loading is false.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getMe, loginUser, logoutUser, registerUser } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Synchronously restore cached user from localStorage on refresh to prevent unauthenticated flash
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('need_user')
      if (!cached) return null
      const parsed = JSON.parse(cached)
      if (parsed && parsed.id) {
        const token = parsed.token || localStorage.getItem('need_token') || `user-${parsed.id}`
        if (!localStorage.getItem('need_token')) {
          localStorage.setItem('need_token', token)
        }
        return { ...parsed, token }
      }
      return null
    } catch {
      return null
    }
  })

  // Start in loading state until verified
  const [loading, setLoading] = useState(true)

  // Verify and re-synchronize session with backend upon application mount
  useEffect(() => {
    let isMounted = true

    async function syncAuth() {
      try {
        const serverUser = await getMe()
        if (isMounted && serverUser) {
          const token = serverUser.token || localStorage.getItem('need_token') || `user-${serverUser.id}`
          const fullUser = { ...serverUser, token }
          setUser(fullUser)
          localStorage.setItem('need_user', JSON.stringify(fullUser))
          localStorage.setItem('need_token', token)
        }
      } catch (err) {
        // 401 Unauthorized means the session/token is invalid or expired
        if (err?.response?.status === 401) {
          if (isMounted) {
            setUser(null)
            localStorage.removeItem('need_user')
            localStorage.removeItem('need_token')
          }
        } else {
          // If server was temporarily busy or network glitch, keep cached user
          console.warn('Session verification warning:', err?.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    syncAuth()

    return () => {
      isMounted = false
    }
  }, [])

  /** Call the login endpoint, store the returned user and token. */
  const login = useCallback(async (email, password) => {
    const userData = await loginUser(email, password)
    const token = userData.token || (userData.id ? `user-${userData.id}` : '')
    const fullUser = { ...userData, token }
    setUser(fullUser)
    localStorage.setItem('need_user', JSON.stringify(fullUser))
    if (token) {
      localStorage.setItem('need_token', token)
    }
    return fullUser
  }, [])

  /** Register a new account, then automatically log them in. */
  const register = useCallback(async (data) => {
    const userData = await registerUser(data)
    const token = userData.token || (userData.id ? `user-${userData.id}` : '')
    const fullUser = { ...userData, token }
    setUser(fullUser)
    localStorage.setItem('need_user', JSON.stringify(fullUser))
    if (token) {
      localStorage.setItem('need_token', token)
    }
    return fullUser
  }, [])

  /** Clear the server session and local state. */
  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } catch (err) {
      console.warn('Logout API warning:', err?.message)
    } finally {
      localStorage.removeItem('need_user')
      localStorage.removeItem('need_token')
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth() — the hook components call to access auth state.
 *
 * Example:
 *   const { user, logout } = useAuth()
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
