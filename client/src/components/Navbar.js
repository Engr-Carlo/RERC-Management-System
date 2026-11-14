import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = authService.getCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const linkClass = (...paths) =>
    `nav-link${paths.some(p => pathname.startsWith(p)) ? ' nav-link--active' : ''}`;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src="/logo.svg" alt="RERC Logo" className="navbar-logo" />
          <h2>RERC Committee Portal</h2>
        </div>

        <button
          className={`hamburger${menuOpen ? ' hamburger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>
        
        <div className={`navbar-menu${menuOpen ? ' navbar-menu--open' : ''}`}>
          <button className={linkClass('/dashboard', '/application')} onClick={() => navTo('/dashboard')}>
            Dashboard
          </button>

          {(user?.role === 'rerc_head' || user?.role === 'admin') && (
            <button className={linkClass('/rerc-head')} onClick={() => navTo('/rerc-head-panel')}>
              For Final Review
            </button>
          )}

          <button className={linkClass('/audit-logs')} onClick={() => navTo('/audit-logs')}>
            Audit Logs
          </button>

          {user?.role === 'admin' && (
            <button className={linkClass('/users')} onClick={() => navTo('/users')}>
              Users
            </button>
          )}
        </div>

        <div className={`navbar-user${menuOpen ? ' navbar-user--open' : ''}`}>
          <span className="user-info">
            <span className="user-name">{user?.username}</span>
            <span className="user-role">{user?.role}</span>
          </span>
          <button className={`${linkClass('/profile')} nav-link--user`} onClick={() => navTo('/profile')}>
            Profile
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
