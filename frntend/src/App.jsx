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
  const [theme, setTheme] = useState(localStorage.getItem('mm-theme') || 'blue');
  const [activeHover, setActiveHover] = useState(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('mm-theme', theme);
  }, [theme]);

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
        {/* Interactive Gesture-Based Theme Wheel (with Enlarging Quadrants) */}
        {user && (
          <div 
            className="theme-boundary-wheel" 
            onMouseDown={() => {
              const handleMouseUp = () => {
                window.removeEventListener('mousemove', handleDragUpdate);
                window.removeEventListener('mouseup', handleMouseUp);
                setActiveHover(null);
              };
              const handleDragUpdate = (e) => {
                const el = document.querySelector('.theme-boundary-wheel');
                if (!el) return;
                const r = el.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                const dx = e.clientX - cx;
                const dy = e.clientY - cy;
                
                let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                if (angle < 0) angle += 360;
                if (angle >= 360) angle -= 360;

                let targetTheme = 'blue';
                if (angle < 90) targetTheme = 'blue';
                else if (angle < 180) targetTheme = 'red';
                else if (angle < 270) targetTheme = 'purple';
                else targetTheme = 'emerald';
                
                setTheme(targetTheme);
                setActiveHover(targetTheme);
              };
              window.addEventListener('mousemove', handleDragUpdate);
              window.addEventListener('mouseup', handleMouseUp);
            }}
            style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              zIndex: 99999,
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.4)',
              boxShadow: '0 15px 50px rgba(0,0,0,0.8), inset 0 0 10px rgba(255,255,255,0.2)',
              cursor: 'grab',
              animation: 'fabPopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Kinetic Ring SVG (Boundary stays even) */}
            <svg 
              width="60" 
              height="60" 
              viewBox="0 0 100 100" 
              style={{ position: 'absolute', overflow: 'visible', pointerEvents: 'none', zIndex: 5 }}
            >
              {/* Top-Right: Blue */}
              <path 
                d="M 50,10 A 40,40 0 0,1 90,50" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth={activeHover === 'blue' ? 18 : 10}
                style={{ transition: 'stroke-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', opacity: theme === 'blue' ? 1 : 0.6 }}
              />
              {/* Bottom-Right: Red */}
              <path 
                d="M 90,50 A 40,40 0 0,1 50,90" 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth={activeHover === 'red' ? 18 : 10}
                style={{ transition: 'stroke-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', opacity: theme === 'red' ? 1 : 0.6 }}
              />
              {/* Bottom-Left: Purple */}
              <path 
                d="M 50,90 A 40,40 0 0,1 10,50" 
                fill="none" 
                stroke="#8b5cf6" 
                strokeWidth={activeHover === 'purple' ? 18 : 10}
                style={{ transition: 'stroke-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', opacity: theme === 'purple' ? 1 : 0.6 }}
              />
              {/* Top-Left: Emerald */}
              <path 
                d="M 10,50 A 40,40 0 0,1 50,10" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth={activeHover === 'emerald' ? 18 : 10}
                style={{ transition: 'stroke-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', opacity: theme === 'emerald' ? 1 : 0.6 }}
              />
            </svg>

            {/* Glossy Specular Highlight Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 45%, transparent 100%)',
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 6
            }} />

            {/* Inner Glass Center */}
            <div style={{
              position: 'absolute',
              inset: '6px',
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(35px) saturate(250%)',
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.7)'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: theme === 'red' ? '#ef4444' : theme === 'purple' ? '#8b5cf6' : theme === 'emerald' ? '#10b981' : '#3b82f6',
                boxShadow: `0 0 15px ${theme === 'red' ? '#ef4444' : theme === 'purple' ? '#8b5cf6' : theme === 'emerald' ? '#10b981' : '#3b82f6'}`,
                transition: 'background 0.3s ease'
              }} />
            </div>
          </div>
        )}


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
            user ? <Dashboard user={user} onLogout={handleLogout} theme={theme} setTheme={setTheme} /> : <Navigate to="/login" />
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
