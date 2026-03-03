import { useState } from 'react'
import MMLogo from './MMLogo'

function RegisterPage({ onRegister, onGoToLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setTimeout(() => onRegister({ name, email }), 1200)
    }, 800)
  }

  return (
    <div className="auth-wrapper">
      <div className="glass-card fade-in-up hover-scale">
        <div className="auth-brand">
          <MMLogo className="auth-logo" />
          <div className="auth-brand-name">MeetMint</div>
        </div>

        <h1 className="glass-title">Create account</h1>
        <p className="glass-subtitle">
          {success ? 'Registration complete!' : 'Sign up to get started'}
        </p>

        {error && <div className="glass-error">{error}</div>}

        {success ? (
          <div className="glass-success-block">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
              Welcome, {name}!
            </div>
            <div style={{ opacity: 0.85 }}>Redirecting to sign in…</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="glass-input-group">
              <label>Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="glass-input-group">
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="glass-input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="glass-input-group">
              <label>Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button className="glass-btn" disabled={loading}>
              {loading ? 'Creating account…' : 'Sign up'}
            </button>

            <div className="glass-footer">
              Already have an account?{' '}
              <button type="button" className="glass-link" onClick={onGoToLogin}>
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default RegisterPage