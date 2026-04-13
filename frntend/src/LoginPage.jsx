import { useState } from 'react'
import MMLogo from './MMLogo'

function LoginPage({ onLogin, onGoToRegister }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [step, setStep] = useState('email') // 'email' | 'otp' | 'forgot' | 'reset-otp'
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSendOTP = (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (!email || !password) {
            setError('Please enter both email and password.')
            return
        }

        // Real login — call backend to "send" OTP
        setLoading(true)
        fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.message || 'Login failed')
                }
                return res.json()
            })
            .then((data) => {
                setLoading(false)
                setMessage(data.message)
                setStep('otp')
            })
            .catch((err) => {
                setLoading(false)
                setError(err.message || 'Error connecting to backend')
            })
    }

    const handleForgotPassword = (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (!email) {
            setError('Please enter your email address.')
            return
        }

        setLoading(true)
        fetch('http://localhost:5000/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || 'Request failed')
                return data
            })
            .then((data) => {
                setLoading(false)
                setMessage(data.message)
                setStep('reset-otp')
            })
            .catch((err) => {
                setLoading(false)
                setError(err.message)
            })
    }

    const handleResetPassword = (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (!otp || otp.length !== 6 || !newPassword) {
            setError('Please enter the 6-digit OTP and your new password.')
            return
        }

        setLoading(true)
        fetch('http://localhost:5000/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, new_password: newPassword }),
        })
            .then(async (res) => {
                const data = await res.json()
                if (!res.ok) throw new Error(data.message || 'Reset failed')
                return data
            })
            .then((data) => {
                setLoading(false)
                setMessage(data.message + ' You can now log in.')
                setStep('email')
                setPassword('')
                setOtp('')
                setNewPassword('')
            })
            .catch((err) => {
                setLoading(false)
                setError(err.message)
            })
    }

    const handleVerifyOTP = (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (!otp || otp.length !== 6) {
            setError('Please enter the 6-digit OTP.')
            return
        }

        // Real verify — call backend to verify OTP
        setLoading(true)
        fetch('http://localhost:5000/api/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, otp }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.message || 'Verification failed')
                }
                return res.json()
            })
            .then((data) => {
                setLoading(false)
                onLogin({ email, id: data.user.id })
            })
            .catch((err) => {
                setLoading(false)
                setError(err.message || 'Invalid OTP or session expired')
            })
    }

    const handleBackToEmail = () => {
        setStep('email')
        setOtp('')
        setError('')
        setMessage('')
    }

    return (
        <>
            <div className="auth-wrapper">
                <div className="glass-card on-stage">
                    <div className="logo-area">
                        <div className="auth-brand">
                            <MMLogo className="auth-logo" />
                            <span className="ultra-clear-logo-text">MEETMINT</span>
                        </div>
                        <h1 className="glass-title">
                            {step === 'forgot' ? 'Reset Password' : step === 'reset-otp' ? 'Verification' : 'Welcome Back'}
                        </h1>
                        <p className="glass-subtitle">
                            {step === 'email' && 'Sign in to continue to your account'}
                            {step === 'otp' && 'Enter the OTP sent to your email'}
                            {step === 'forgot' && 'Enter your email to receive a reset code'}
                            {step === 'reset-otp' && 'Enter the code and your new password'}
                        </p>
                    </div>

                    {error && <div className="glass-error">{error}</div>}
                    {message && <div className="glass-success">{message}</div>}

                    {step === 'email' && (
                        <form onSubmit={handleSendOTP}>
                            <div className="glass-input-group">
                                <label htmlFor="login-email">Email</label>
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    autoComplete="email"
                                />
                            </div>

                            <div className="glass-input-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label htmlFor="login-password">Password</label>
                                    <button
                                        type="button"
                                        className="glass-link"
                                        style={{ fontSize: '0.8rem', marginBottom: '8px' }}
                                        onClick={() => {
                                            setStep('forgot')
                                            setError('')
                                            setMessage('')
                                        }}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <input
                                    id="login-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                            </div>

                            <button type="submit" className="glass-btn" disabled={loading}>
                                {loading ? 'Sending OTP…' : 'Send OTP'}
                            </button>
                        </form>
                    )}

                    {step === 'forgot' && (
                        <form onSubmit={handleForgotPassword}>
                            <div className="glass-input-group">
                                <label htmlFor="forgot-email">Email Address</label>
                                <input
                                    id="forgot-email"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    autoComplete="email"
                                />
                            </div>

                            <button type="submit" className="glass-btn" disabled={loading}>
                                {loading ? 'Sending Code…' : 'Send Reset Code'}
                            </button>

                            <button type="button" className="glass-btn secondary" onClick={handleBackToEmail} style={{ marginTop: '12px' }}>
                                Back to Login
                            </button>
                        </form>
                    )}

                    {step === 'reset-otp' && (
                        <form onSubmit={handleResetPassword}>
                            <div className="glass-input-group">
                                <label htmlFor="reset-otp">OTP Code</label>
                                <input
                                    id="reset-otp"
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    disabled={loading}
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            <div className="glass-input-group">
                                <label htmlFor="reset-new-password">New Password</label>
                                <input
                                    id="reset-new-password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <button type="submit" className="glass-btn" disabled={loading || otp.length !== 6 || !newPassword}>
                                {loading ? 'Resetting…' : 'Reset Password'}
                            </button>

                            <button type="button" className="glass-btn secondary" onClick={handleBackToEmail} style={{ marginTop: '12px' }}>
                                Cancel
                            </button>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form onSubmit={handleVerifyOTP}>
                            <div className="glass-input-group">
                                <label htmlFor="login-email-display">Email</label>
                                <input
                                    id="login-email-display"
                                    type="email"
                                    value={email}
                                    disabled
                                    style={{ opacity: 0.7 }}
                                />
                            </div>

                            <div className="glass-input-group">
                                <label htmlFor="login-otp">OTP Code</label>
                                <input
                                    id="login-otp"
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    disabled={loading}
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            <button type="submit" className="glass-btn" disabled={loading || otp.length !== 6}>
                                {loading ? 'Verifying…' : 'Verify OTP'}
                            </button>

                            <div className="otp-actions">
                                <button type="button" className="glass-link" onClick={handleBackToEmail}>
                                    ← Change Email
                                </button>
                                <button type="button" className="glass-link" onClick={() => {
                                    setOtp('')
                                    setError('')
                                    setLoading(true)
                                    fetch('http://localhost:5000/api/login', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ email, password }),
                                    })
                                        .then(async (res) => {
                                            if (!res.ok) throw new Error('Resend failed')
                                            return res.json()
                                        })
                                        .then((data) => {
                                            setLoading(false)
                                            setMessage('New OTP sent!')
                                        })
                                        .catch((err) => {
                                            setLoading(false)
                                            setError(err.message)
                                        })
                                }}>
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="glass-footer">
                        Don't have an account?{' '}
                        <button type="button" className="glass-link" onClick={onGoToRegister}>
                            Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default LoginPage
