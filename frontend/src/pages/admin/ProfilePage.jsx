import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { changeEmail, requestPasswordOTP, changePassword } from '../../services/api';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function ProfilePage() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('email');
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  
  // Password change state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailStatus(null);
    setEmailLoading(true);
    try {
      await changeEmail(newEmail, emailPassword);
      setEmailStatus({ type: 'success', msg: 'Email changed successfully! Logging out...' });
      setNewEmail('');
      setEmailPassword('');
      // Auto-logout and redirect to login
      setTimeout(async () => {
        await logout();
        navigate('/admin/login');
      }, 1500);
    } catch (err) {
      setEmailStatus({ type: 'error', msg: err.response?.data?.error || 'Failed to change email' });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    setPasswordStatus(null);
    setPasswordLoading(true);
    try {
      await requestPasswordOTP();
      setOtpSent(true);
      setPasswordStatus({ type: 'success', msg: 'OTP sent to your email (check console if email not configured)' });
    } catch (err) {
      setPasswordStatus({ type: 'error', msg: 'Failed to send OTP' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', msg: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', msg: 'Password must be at least 8 characters' });
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(otp, newPassword);
      setPasswordStatus({ type: 'success', msg: 'Password changed successfully! Logging out...' });
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
      // Auto-logout and redirect to login
      setTimeout(async () => {
        await logout();
        navigate('/admin/login');
      }, 1500);
    } catch (err) {
      setPasswordStatus({ type: 'error', msg: err.response?.data?.error || 'Failed to change password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <h1>Profile Settings</h1>
      
      <div className="profile-info">
        <p><strong>Name:</strong> {admin?.name}</p>
        <p><strong>Email:</strong> {admin?.email}</p>
        <p><strong>Role:</strong> {admin?.role}</p>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          Change Email
        </button>
        <button
          className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Change Password
        </button>
      </div>

      {activeTab === 'email' && (
        <form className="profile-form" onSubmit={handleEmailChange}>
          <h2>Change Email</h2>
          {emailStatus && <div className={`form-${emailStatus.type}`}>{emailStatus.msg}</div>}
          
          <div className="form-group">
            <label htmlFor="newEmail">New Email</label>
            <input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="new.email@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="emailPassword">Current Password (for verification)</label>
            <input
              id="emailPassword"
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              required
              placeholder="Enter current password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={emailLoading}>
            {emailLoading ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      )}

      {activeTab === 'password' && (
        <div className="profile-form">
          <h2>Change Password</h2>
          {passwordStatus && <div className={`form-${passwordStatus.type}`}>{passwordStatus.msg}</div>}

          {!otpSent ? (
            <div>
              <p className="info-text">An OTP will be sent to your email: <strong>{admin?.email}</strong></p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRequestOTP}
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Sending...' : 'Send OTP to Email'}
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="otp">OTP (check your email)</label>
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
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
