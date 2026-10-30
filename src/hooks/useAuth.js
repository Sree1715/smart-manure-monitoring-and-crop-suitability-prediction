import { useState, useCallback } from 'react'

// Placeholder auth hook. Will be connected to real JWT-based auth
// once the backend authentication endpoints are implemented.
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async () => {
    setLoading(true)
    // TODO: call authService and set user + persist token
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setUser(null)
  }, [])

  return { user, loading, login, logout, isAuthenticated: Boolean(user) }
}
