/**
 * api.js — Production-ready API client for Smart Manure Portal
 */
import axios from 'axios'

// ─── Resolve API base URL ─────────────────────────────────────────────────────
function resolveApiBaseUrl() {
  // 1. Explicit override from environment variable (set in Vercel project settings)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  }

  // 2. Local development fallback
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://127.0.0.1:8000/api'
    }
  }

  // 3. Deployed on Vercel: use direct Render backend or relative /api (proxied via vercel.json)
  return 'https://smart-manure-backend.onrender.com/api'
}

export const API_BASE_URL = resolveApiBaseUrl()

// Detect production (not localhost)
export const IS_PRODUCTION =
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  !['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)

// ─── Friendly error classifier ───────────────────────────────────────────────
export function getErrorMessage(error) {
  // Check if response is raw HTML (e.g. Vercel 404 or index.html fallback)
  if (
    error.response &&
    typeof error.response.data === 'string' &&
    error.response.data.toLowerCase().includes('<!doctype html')
  ) {
    return 'The backend service is starting up on Render. Free-tier servers take ~30-40 seconds on cold start. Please wait a moment and try again.'
  }

  // Backend returned a structured error
  if (error.response) {
    const detail = error.response.data?.detail
    if (detail) return typeof detail === 'string' ? detail : JSON.stringify(detail)
    if (error.response.data?.message) return error.response.data.message
    if (error.response.status === 401) return 'Invalid email or password.'
    if (error.response.status === 403)
      return error.response.data?.detail || 'Access denied for this portal.'
    if (error.response.status === 404)
      return 'API endpoint not found. Please verify backend connection.'
    if (error.response.status >= 500) return 'Server error. The server may be restarting — please try again in a moment.'
    return `Request failed (${error.response.status}).`
  }

  // No response → network failure / CORS / cold start
  if (error.request || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    if (IS_PRODUCTION) {
      return 'Cannot reach the backend server. Render free instances sleep after inactivity and need ~30 seconds to wake up. Please wait a moment and retry.'
    }
    return 'Cannot reach the server. Make sure the backend is running locally (npm run backend).'
  }

  // Timeout
  if (error.code === 'ECONNABORTED') {
    return 'Server took longer than expected to respond. If it is cold-starting on Render, please retry now.'
  }

  return error.message || 'An unexpected error occurred.'
}

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000, // 45s — generous for Render free-tier cold-start
})

// ─── Request interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response interceptor: normalise errors & detect HTML responses ───────────
api.interceptors.response.use(
  (response) => {
    // If an API endpoint accidentally returned HTML (e.g. index.html SPA rewrite)
    if (
      typeof response.data === 'string' &&
      response.data.toLowerCase().includes('<!doctype html')
    ) {
      const err = new Error('Received HTML response instead of JSON API response')
      err.response = response
      err.friendlyMessage =
        'Backend server is currently warming up on Render. Please wait 15 seconds and try again.'
      return Promise.reject(err)
    }
    return response
  },
  (error) => {
    // Auto-clear stale tokens on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    }
    error.friendlyMessage = getErrorMessage(error)
    return Promise.reject(error)
  }
)

// ─── Backend health check ─────────────────────────────────────────────────────
export async function checkBackendHealth() {
  try {
    const healthUrl = API_BASE_URL.endsWith('/api')
      ? `${API_BASE_URL.slice(0, -4)}/api/health`
      : `${API_BASE_URL}/health`
    const res = await axios.get(healthUrl, { timeout: 15000 })
    return res.data?.status === 'healthy'
  } catch {
    return false
  }
}

export default api
