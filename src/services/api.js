import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

// ─── Friendly error classifier ───────────────────────────────────────────────
export function getErrorMessage(error) {
  // Backend returned a structured error
  if (error.response) {
    const detail = error.response.data?.detail
    if (detail) return typeof detail === 'string' ? detail : JSON.stringify(detail)
    if (error.response.data?.message) return error.response.data.message
    if (error.response.status === 401) return 'Invalid email or password.'
    if (error.response.status === 403) return error.response.data?.detail || 'Access denied for this portal.'
    if (error.response.status === 404) return 'Endpoint not found. Please check backend version.'
    if (error.response.status >= 500) return 'Server error. Please try again in a moment.'
    return `Request failed (${error.response.status}).`
  }

  // Request was made but no response received → backend is down / CORS / network
  if (error.request || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Cannot reach the server. Make sure the backend is running: npm run backend'
  }

  // Request cancelled due to timeout
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. The server took too long to respond.'
  }

  return error.message || 'An unexpected error occurred.'
}

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ─── Request interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response interceptor: normalise errors ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto clear stale tokens on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    }

    // Attach a human-readable message so every caller can do error.friendlyMessage
    error.friendlyMessage = getErrorMessage(error)

    return Promise.reject(error)
  }
)

// ─── Backend health check (call once on app boot) ────────────────────────────
export async function checkBackendHealth() {
  try {
    const res = await axios.get(
      `${API_BASE_URL.replace('/api', '')}/api/health`,
      { timeout: 5000 }
    )
    return res.data?.status === 'healthy'
  } catch {
    return false
  }
}

export default api