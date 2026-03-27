import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../services/api';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: request OTP, 2: verify & reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setStatus({ type: 'success', msg: 'If the email exists, an OTP has been sent (check console if email not configured)' });
      setStep(2);
    } catch (err) {
      setStatus({ type: 'error', msg: 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', msg: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setStatus({ type: 'error', msg: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      setStatus({ type: 'success', msg: 'Password reset successfully! Redirecting to login...' });
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.error || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={step === 1 ? handleRequestOTP : handleResetPassword}>
        <h1>Forgot Password</h1>
        
        {status && <div className={`form-${status.type}`}>{status.msg}</div>}

        {step === 1 ? (
          <>
            <p className="info-text">Enter your email to receive a password reset OTP</p>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@portfolio.com"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <p className="info-text">Check your email for the OTP: <strong>{email}</strong></p>
            
            <div className="form-group">
              <label htmlFor="otp">OTP</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Enter 6-digit OTP"
                maxLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input-wrapper">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Min 8 characters"
                  minLength={8}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter password"
                  minLength={8}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              className="btn btn-outline"
              style={{ marginTop: '0.5rem' }}
              onClick={() => setStep(1)}
            >
              <FiArrowLeft /> Back to Email
            </button>
          </>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/admin/login" className="link-muted">
            Remember your password? Login
          </Link>
        </div>
      </form>
    </div>
  );
}
