import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './index.css'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import Dashboard from './Dashboard'
import ProcessingPage from './ProcessingPage'
import MotionTheme from './MotionTheme'
import BackgroundParticles from './BackgroundParticles'

function App() {
  const navigate = useNavigate();
  const SESSION_TIMEOUT = 3600000; // 1 hour in milliseconds 

  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('mm_user')
      const loginTime = localStorage.getItem('mm_login_time')

      if (u && loginTime) {
        const now = Date.now();
        if (now - parseInt(loginTime) > SESSION_TIMEOUT) {
          localStorage.removeItem('mm_user');
          localStorage.removeItem('mm_login_time');
          return null;
        }
        return JSON.parse(u)
      }
      return null
    } catch {
      return null
    }
  })

  // Auth Guard
  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('mm_user', JSON.stringify(userData))
    localStorage.setItem('mm_login_time', Date.now().toString())
    navigate('/')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('mm_user')
    localStorage.removeItem('mm_login_time')
    navigate('/login')
  }

  // Active monitoring for session timeout
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        const loginTime = localStorage.getItem('mm_login_time')
        if (loginTime) {
          const now = Date.now();
          if (now - parseInt(loginTime) > SESSION_TIMEOUT) {
            handleLogout();
          }
        }
      }, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="app-alive-container">
      <MotionTheme />

      {/* Background System */}
      <div className="bg">
        <div className="bg-img" id="bgI"></div>
        <div className="bg-vig"></div>
        <div className="bg-grid"></div>
        <div className="bg-wash" id="bgW"></div>
        <div className="bg-grain"></div>
      </div>
      <BackgroundParticles />

      {/* Main Content */}
      <div className="app-content relative z-10 w-full h-full overflow-auto">
        <Routes>
          <Route path="/login" element={
            !user ? <LoginPage onLogin={handleLogin} onGoToRegister={() => navigate('/register')} /> : <Navigate to="/" />
          } />

          <Route path="/register" element={
            !user ? <RegisterPage onRegister={() => navigate('/login')} onGoToLogin={() => navigate('/login')} /> : <Navigate to="/" />
          } />

          <Route path="/processing/:projectId" element={
            user ? <ProcessingPage /> : <Navigate to="/login" />
          } />

          <Route path="/" element={
            user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
