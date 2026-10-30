import React from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function MainLayout({ children }) {
  const location = useLocation()
  const isAuthPage = ['/farmer-login', '/authority-login'].includes(location.pathname)

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      {!isAuthPage && <Footer />}
    </div>
  )
}
