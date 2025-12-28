import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { userService, authService } from '../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'reviewer' });
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');

    if (newUser.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await userService.create(newUser.username, newUser.password, newUser.role);
      setShowAddModal(false);
      setNewUser({ username: '', password: '', role: 'reviewer' });
      fetchUsers();
      alert('User created successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        await userService.delete(userId);
        fetchUsers();
        alert('User deleted successfully!');
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await userService.changePassword(newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      alert('Password changed successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="users-container">
        <div className="users-header">
          <h1>User Management</h1>
          <div className="header-actions">
            <button className="password-button" onClick={() => setShowPasswordModal(true)}>
              🔑 Change My Password
            </button>
            <button className="add-button" onClick={() => setShowAddModal(true)}>
              ➕ Add User
            </button>
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>
                    {user.username}
                    {user.id === currentUser.id && <span className="current-user-badge">You</span>}
                  </td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    {user.id !== currentUser.id && (
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteUser(user.id, user.username)}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New User</h2>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddUser} className="modal-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength="6"
                  />
                  <small>Minimum 6 characters</small>
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="reviewer">Reviewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Change Password</h2>
                <button className="modal-close" onClick={() => setShowPasswordModal(false)}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="modal-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength="6"
                    autoFocus
                  />
                  <small>Minimum 6 characters</small>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowPasswordModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
