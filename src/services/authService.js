import api from './api.js'

export const authService = {
  async loginFarmer(credentials) {
    return api.post('/auth/farmer/login', credentials)
  },

  async loginAuthority(credentials) {
    return api.post('/auth/authority/login', credentials)
  },

  async register(payload) {
    return api.post('/auth/register', payload)
  },

  async logout() {
    localStorage.removeItem('access_token')
  },
}