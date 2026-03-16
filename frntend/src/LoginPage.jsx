import { useState } from "react";
import MMLogo from "./MMLogo";
import WavesBackground from "./WavesBackground";

function LoginPage({ onLogin, onGoToRegister }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email"); // 'email' | 'otp'
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); 
  const [loading, setLoading] = useState(false);

  const handleSendOTP = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage("Otp sent to your email. (Mock: use 123456)");
      setStep("otp");
    }, 800);
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit otp.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ email });
    }, 800);
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setError("");
    setMessage("");
  };

  const handleResendOTP = () => {
    setOtp("");
    setError("");
    setMessage("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage("Otp resent to your email. (Mock: use 123456)");
    }, 800);
  };

  return (
    <div className="auth-wrapper auth-with-waves">
      {/* Background waves (behind everything) */}
      <WavesBackground />

      {/* Foreground content */}
      <div className="glass-card fade-in-up hover-scale">
        <div className="auth-brand">
          <MMLogo className="auth-logo" />
          <div className="auth-brand-name">MeetMint</div>
        </div>

        <h1 className="glass-title">Welcome back</h1>
        <p className="glass-subtitle">
          {step === "email"
            ? "Sign in to continue to your account"
            : "Enter the otp sent to your email"}
        </p>

        {error && <div className="glass-error">{error}</div>}
        {message && <div className="glass-success">{message}</div>}

        {step === "email" && (
          <form onSubmit={handleSendOTP}>
            <div className="glass-input-group">
              <label>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="name@company.com"
                autoComplete="email"
              />
            </div>

            <button className="glass-btn" disabled={loading}>
              {loading ? "Sending otp…" : "Send otp"}
            </button>

            <div className="glass-footer">
              Don’t have an account?{" "}
              <button
                type="button"
                className="glass-link"
                onClick={onGoToRegister}
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP}>
            <div className="glass-input-group">
              <label>Email</label>
              <input value={email} disabled />
            </div>

            <div className="glass-input-group">
              <label>Otp code</label>
              <input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                disabled={loading}
                placeholder="123456"
                maxLength={6}
                autoFocus
              />
            </div>

            <button className="glass-btn" disabled={loading}>
              {loading ? "Verifying…" : "Verify"}
            </button>

            <div className="otp-actions">
              <button
                type="button"
                className="glass-link"
                onClick={handleBackToEmail}
              >
                ← Change email
              </button>
              <button
                type="button"
                className="glass-link"
                onClick={handleResendOTP}
              >
                Resend otp
              </button>
            </div>

            <div className="glass-footer">
              Don’t have an account?{" "}
              <button
                type="button"
                className="glass-link"
                onClick={onGoToRegister}
              >
                Sign up
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
