import { useState } from 'react'
import MMLogo from './MMLogo'

function RegisterPage({ onRegister, onGoToLogin }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState('details') // 'details' | 'otp'
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [message, setMessage] = useState('')

    const handleSubmitDetails = (e) => {
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

        // Real registration Step 1 — call backend to send OTP
        setLoading(true)
        fetch('http://localhost:5000/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data.message || 'Registration failed')
                }
                return data
            })
            .then((data) => {
                setLoading(false)
                setMessage(data.message)
                setStep('otp') // Switch to OTP step
            })
            .catch((err) => {
                setLoading(false)
                setError(err.message || 'Error connecting to backend')
            })
    }

    const handleVerifyOTP = (e) => {
        e.preventDefault()
        setError('')

        if (!otp || otp.length !== 6) {
            setError('Please enter the 6-digit OTP.')
            return
        }

        setLoading(true)
        fetch('http://localhost:5000/api/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp }),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || 'Verification failed')
                return data
            })
            .then((data) => {
                setLoading(false)
                setSuccess(true)
                // Redirect after success
                setTimeout(() => {
                    onRegister({ name, email, id: data.user?.id })
                }, 2000)
            })
            .catch((err) => {
                setLoading(false)
                setError(err.message || 'Invalid or expired OTP')
            })
    }

    return (
        <>
            <div className="auth-wrapper">
                <div className="glass-card on-stage">
                    <div className="logo-area">
                        <div className="auth-brand">
                            <MMLogo className="auth-logo" />
                            <span className="auth-brand-name">MeetMint</span>
                        </div>
                        <h1 className="glass-title">Create Account</h1>
                        <p className="glass-subtitle">
                            {success ? 'Registration complete!' : 'Sign up to get started'}
                        </p>
                    </div>

                    {error && <div className="glass-error">{error}</div>}
                    {message && <div className="glass-success" style={{ marginBottom: '1rem' }}>{message}</div>}

                    {success ? (
                        <div className="glass-success-block fade-in">
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                            <p style={{ color: 'white', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                                Account Verified!
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                                Welcome aboard, {name}.
                            </p>
                        </div>
                    ) : step === 'otp' ? (
                        <form onSubmit={handleVerifyOTP} className="fade-in">
                            <div className="glass-input-group">
                                <label htmlFor="register-otp">Enter 6-digit OTP</label>
                                <input
                                    id="register-otp"
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    disabled={loading}
                                    maxLength={6}
                                    autoFocus
                                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '8px', textAlign: 'center' }}>
                                    We sent a code to {email}
                                </p>
                            </div>

                            <button type="submit" className="glass-btn" disabled={loading || otp.length !== 6}>
                                {loading ? 'Verifying…' : 'Complete Registration'}
                            </button>

                            <button
                                type="button"
                                className="glass-link"
                                style={{ width: '100%', marginTop: '16px' }}
                                onClick={() => setStep('details')}
                            >
                                ← Back to details
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitDetails}>
                            <div className="glass-input-group">
                                <label htmlFor="register-name">Full Name</label>
                                <input
                                    id="register-name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                    autoComplete="name"
                                />
                            </div>

        {error && <div className="glass-error">{error}</div>}

                            <div className="glass-input-group">
                                <label htmlFor="register-password">Password</label>
                                <input
                                    id="register-password"
                                    type="password"
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="glass-input-group">
                                <label htmlFor="register-confirm">Confirm Password</label>
                                <input
                                    id="register-confirm"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                    autoComplete="new-password"
                                />
                            </div>

                            <button type="submit" className="glass-btn" disabled={loading}>
                                {loading ? 'Sending OTP…' : 'Sign Up'}
                            </button>
                        </form>
                    )}

                    <div className="glass-footer">
                        Already have an account?{' '}
                        <button type="button" className="glass-link" onClick={onGoToLogin}>
                            Sign In
                        </button>
                    </div>
                </div>
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