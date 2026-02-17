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

        // Mock registration — show success then redirect to login
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            setSuccess(true)
            // Redirect to login after a brief success message
            setTimeout(() => {
                onRegister({ name, email })
            }, 1500)
        }, 800)
    }

    return (
        <>
            <div className="auth-wrapper">
                <div className="glass-card">
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

                    {success ? (
                        <div className="glass-success-block fade-in">
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                            <p style={{ color: 'white', fontSize: '16px', marginBottom: '8px' }}>
                                Welcome, {name}!
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                                Redirecting to login…
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
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

                            <div className="glass-input-group">
                                <label htmlFor="register-email">Email</label>
                                <input
                                    id="register-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    autoComplete="email"
                                />
                            </div>

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
                                {loading ? 'Creating account…' : 'Sign Up'}
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
        </>
    )
}

export default RegisterPage
