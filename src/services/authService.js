import api, { getErrorMessage } from './api.js'

export const authService = {
  async loginFarmer(credentials) {
    try {
      return await api.post('/auth/farmer/login', credentials)
    } catch (err) {
      // Attach friendly message and re-throw so callers get consistent errors
      err.friendlyMessage = getErrorMessage(err)
      throw err
    }
  },

  async loginAuthority(credentials) {
    try {
      return await api.post('/auth/authority/login', credentials)
    } catch (err) {
      err.friendlyMessage = getErrorMessage(err)
      throw err
    }
  },

  async sendOtp(email, purpose = 'registration') {
    try {
      return await api.post('/auth/send-otp', { email, purpose })
    } catch (err) {
      err.friendlyMessage = getErrorMessage(err)
      throw err
    }
  },

  async verifyOtp(email, otp) {
    try {
      return await api.post('/auth/verify-otp', { email, otp })
    } catch (err) {
      err.friendlyMessage = getErrorMessage(err)
      throw err
    }
  },

  async register(payload) {
    try {
      return await api.post('/auth/register', payload)
    } catch (err) {
      err.friendlyMessage = getErrorMessage(err)
      throw err
    }
  },

  async logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  },
}