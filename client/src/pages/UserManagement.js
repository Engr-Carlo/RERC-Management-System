import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { userService, authService, programService, reviewerProgramService } from '../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [reviewerPrograms, setReviewerPrograms] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProgramsModal, setShowProgramsModal] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState(null);
  const [allPrograms, setAllPrograms] = useState([]);
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'reviewer' });
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchUsers();
    fetchPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPrograms = async () => {
    try {
      const programs = await programService.getAll();
      setAllPrograms(programs);
    } catch (err) {
      console.error('Failed to load programs:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userService.getAll();
      setUsers(data);
      
      // Fetch programs for each reviewer
      const programsMap = {};
      for (const user of data) {
        if (user.role === 'reviewer') {
          try {
            const programs = await reviewerProgramService.getPrograms(user.id);
            programsMap[user.id] = programs;
          } catch (err) {
            programsMap[user.id] = [];
          }
        }
      }
      setReviewerPrograms(programsMap);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.error || 'Failed to load users. Please refresh the page.');
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

  const handleManagePrograms = async (user) => {
    setSelectedReviewer(user);
    setError('');
    try {
      const programs = await reviewerProgramService.getPrograms(user.id);
      setAssignedPrograms(programs);
      setShowProgramsModal(true);
    } catch (err) {
      console.error('Failed to load reviewer programs:', err);
      setAssignedPrograms([]);
      setShowProgramsModal(true);
    }
  };

  const handleToggleProgram = (program) => {
    if (assignedPrograms.includes(program)) {
      setAssignedPrograms(assignedPrograms.filter(p => p !== program));
    } else {
      setAssignedPrograms([...assignedPrograms, program]);
    }
  };

  const handleSavePrograms = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await reviewerProgramService.updatePrograms(selectedReviewer.id, assignedPrograms);
      setShowProgramsModal(false);
      alert('Programs updated successfully!');
      fetchUsers(); // Refresh to show updated programs
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update programs');
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
              Change My Password
            </button>
            {currentUser.role === 'admin' && (
              <button className="add-button" onClick={() => setShowAddModal(true)}>
                Add User
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-message" style={{marginBottom: '20px'}}>{error}</div>}

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Role</th>
                <th>Assigned Programs</th>
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
                  <td>
                    {user.role === 'reviewer' ? (
                      <div className="programs-display">
                        {reviewerPrograms[user.id]?.length > 0 ? (
                          <>
                            <span className="program-count">{reviewerPrograms[user.id].length} program(s)</span>
                            <div className="program-list-tooltip">
                              {reviewerPrograms[user.id].join(', ')}
                            </div>
                          </>
                        ) : (
                          <span className="no-programs">No programs assigned</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted">All programs</span>
                    )}
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {user.role === 'reviewer' && currentUser.role === 'admin' && (
                        <button
                          className="programs-button"
                          onClick={() => handleManagePrograms(user)}
                        >
                          Manage Programs
                        </button>
                      )}
                      {currentUser.role === 'admin' && user.id !== currentUser.id && (
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteUser(user.id, user.username)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
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
                  &times;
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
                    disabled
                  >
                    <option value="reviewer">Reviewer</option>
                  </select>
                  <small>Only reviewers can be created. There can only be one admin.</small>
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
                  &times;
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

        {/* Manage Programs Modal */}
        {showProgramsModal && (
          <div className="modal-overlay" onClick={() => setShowProgramsModal(false)}>
            <div className="modal-content programs-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Manage Programs for {selectedReviewer?.username}</h2>
                <button className="modal-close" onClick={() => setShowProgramsModal(false)}>
                  &times;
                </button>
              </div>

              <form onSubmit={handleSavePrograms} className="modal-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <label>Assigned Programs</label>
                  <p className="help-text">Select which programs this reviewer can access:</p>
                  
                  <div className="programs-list">
                    {allPrograms.length === 0 ? (
                      <p className="no-programs">No programs found in the database. Make sure applications exist in the Google Sheet.</p>
                    ) : (
                      allPrograms.map((program) => (
                        <label key={program} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={assignedPrograms.includes(program)}
                            onChange={() => handleToggleProgram(program)}
                          />
                          <span>{program}</span>
                        </label>
                      ))
                    )}
                  </div>
                  
                  <small className="programs-count">
                    {assignedPrograms.length} of {allPrograms.length} programs selected
                  </small>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowProgramsModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Save Programs
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
