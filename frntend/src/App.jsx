import { useState } from 'react'
import './index.css'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import Dashboard from './Dashboard'

function App() {
  const [page, setPage] = useState('login') // 'login' | 'register' | 'dashboard'
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
    setPage('dashboard')
  }

  const handleRegister = () => setPage('login')

  const handleLogout = () => {
    setUser(null)
    setPage('login')
  }

  return (
    <div className="app-alive-container">
      {/* global animated background */}
      <div className="alive-bg-base" />
      <div className="alive-orb orb-1" />
      <div className="alive-orb orb-2" />
      <div className="alive-orb orb-3" />
      <div className="alive-noise" />

      {/* app content */}
      <div className="app-content">
        {page === 'login' && (
          <LoginPage
            onLogin={handleLogin}
            onGoToRegister={() => setPage('register')}
          />
        )}

        {page === 'register' && (
          <RegisterPage
            onRegister={handleRegister}
            onGoToLogin={() => setPage('login')}
          />
        )}

        {page === 'dashboard' && <Dashboard user={user} onLogout={handleLogout} />}
      </div>
    </div>
  )
}

export default App