import { useState } from 'react'
import MMLogo from './MMLogo'

function LoginPage({ onLogin, onGoToRegister }) {
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState('email') // 'email' | 'otp'
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSendOTP = (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (!email) {
            setError('Please enter your email.')
            return
        }

        // Mock sending OTP
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            setMessage('OTP sent to your email! (Mock: use 123456)')
            setStep('otp')
        }, 800)
    }

    const handleVerifyOTP = (e) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (!otp || otp.length !== 6) {
            setError('Please enter the 6-digit OTP.')
            return
        }

        // Mock OTP verification — accept any 6-digit code
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            onLogin({ email })
        }, 800)
    }

    const handleBackToEmail = () => {
        setStep('email')
        setOtp('')
        setError('')
        setMessage('')
    }

    const handleResendOTP = () => {
        setOtp('')
        setError('')
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            setMessage('OTP resent to your email! (Mock: use 123456)')
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
                        <h1 className="glass-title">Welcome Back</h1>
                        <p className="glass-subtitle">
                            {step === 'email' && 'Sign in to continue to your account'}
                            {step === 'otp' && 'Enter the OTP sent to your email'}
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

                            <button type="submit" className="glass-btn" disabled={loading}>
                                {loading ? 'Sending OTP…' : 'Send OTP'}
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
                                <button type="button" className="glass-link" onClick={handleResendOTP}>
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
