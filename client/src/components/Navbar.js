import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src="/logo.svg" alt="RERC Logo" className="navbar-logo" />
          <h2>RERC Committee Portal</h2>
        </div>
        
        <div className="navbar-menu">
          <button className="nav-button" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          
          {user?.role === 'admin' && (
            <>
              <button className="nav-button" onClick={() => navigate('/audit-logs')}>
                Audit Logs
              </button>
              <button className="nav-button" onClick={() => navigate('/users')}>
                Users
              </button>
            </>
          )}
        </div>

        <div className="navbar-user">
          <span className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className="user-role">{user?.role}</span>
          </span>
          <button className="nav-button" onClick={() => navigate('/profile')}>
            Profile
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
