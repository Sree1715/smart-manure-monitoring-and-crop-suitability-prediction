/**
 * api.js — Production-ready API client
 *
 * HOW THE BASE URL IS RESOLVED (in order):
 *   1. VITE_API_BASE_URL env var (set this in Vercel dashboard for production)
 *   2. If running locally on localhost/127.0.0.1 → http://127.0.0.1:8000/api
 *   3. If somehow running on a deployed host with NO env var set → we detect
 *      the current origin and append /api, which allows Vercel rewrites to proxy.
 *
 * SETUP REQUIRED (production):
 *   Vercel Dashboard → Project → Settings → Environment Variables
 *     VITE_API_BASE_URL = https://<your-render-service>.onrender.com/api
 */
import axios from 'axios'

// ─── Resolve API base URL ─────────────────────────────────────────────────────
function resolveApiBaseUrl() {
  // Explicit override (set in Vercel env vars)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') // strip trailing slash
  }

  // Local development fallback
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
      return 'http://127.0.0.1:8000/api'
    }
  }

  // Deployed but VITE_API_BASE_URL not set yet — use relative path so
  // the vercel.json rewrite rule can forward /api/* to the backend.
  // This will still fail until the env var is set, but gives a clear error.
  return '/api'
}

export const API_BASE_URL = resolveApiBaseUrl()

// Detect production (not localhost)
export const IS_PRODUCTION =
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  !['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname)

// ─── Friendly error classifier ───────────────────────────────────────────────
export function getErrorMessage(error) {
  // Backend returned a structured error
  if (error.response) {
    const detail = error.response.data?.detail
    if (detail) return typeof detail === 'string' ? detail : JSON.stringify(detail)
    if (error.response.data?.message) return error.response.data.message
    if (error.response.status === 401) return 'Invalid email or password.'
    if (error.response.status === 403)
      return error.response.data?.detail || 'Access denied for this portal.'
    if (error.response.status === 404)
      return 'Endpoint not found. Please check backend version.'
    if (error.response.status >= 500) return 'Server error. Please try again in a moment.'
    return `Request failed (${error.response.status}).`
  }

  // No response → network failure / CORS / backend down
  if (error.request || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    if (IS_PRODUCTION) {
      return 'Cannot reach the server. The backend service may be starting up — please wait 30 seconds and try again.'
    }
    return 'Cannot reach the server. Make sure the backend is running locally (npm run backend).'
  }

  // Timeout
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. The server took too long to respond.'
  }

  return error.message || 'An unexpected error occurred.'
}

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000, // 20s — generous for cold-start on Render free tier
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

// ─── Response interceptor: normalise errors ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
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
    // Build health URL from API_BASE_URL — strip /api suffix
    const healthUrl = API_BASE_URL.endsWith('/api')
      ? `${API_BASE_URL.slice(0, -4)}/api/health`
      : `${API_BASE_URL}/health`
    const res = await axios.get(healthUrl, { timeout: 8000 })
    return res.data?.status === 'healthy'
  } catch {
    return false
  }
}

export default api