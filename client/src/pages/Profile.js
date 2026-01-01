import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { authService, userService } from '../services/api';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await authService.getMe();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          navigate('/login');
        } else {
          setUser(currentUser);
        }
      }
    };
    
    fetchUserData();
  }, [navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      await userService.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!window.confirm('Are you sure you want to reset your password to admin123? You will need to log in again.')) {
      return;
    }

    try {
      setLoading(true);
      await userService.resetPassword();
      setSuccess('Password reset to admin123. Please log in again.');
      setTimeout(() => {
        authService.logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <Navbar />
      <div className="profile-container">
        <div className="profile-card">
          <h1>My Profile</h1>
          
          <div className="profile-info">
            <div className="info-row">
              <label>Username:</label>
              <span>{user.username}</span>
            </div>
            <div className="info-row">
              <label>Email:</label>
              <span>{user.email || 'N/A'}</span>
            </div>
            <div className="info-row">
              <label>Role:</label>
              <span className="role-badge">
                {user.role === 'admin' ? 'Administrator' : 
                 user.role === 'rerc_head' ? 'RERC Head' : 'Reviewer'}
              </span>
            </div>
          </div>

          <div className="divider"></div>

          <div className="password-section">
            <h2>Change Password</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Current Password:</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label>New Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>

            <div className="divider"></div>

            <div className="reset-section">
              <h3>Forgot Password?</h3>
              <p>Reset your password to the default (admin123)</p>
              <button 
                onClick={handleResetToDefault} 
                className="btn-danger"
                disabled={loading}
              >
                Reset to Default Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
