import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { applicationService } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getAll();
      setApplications(data);
      setFilteredApplications(data);
    } catch (err) {
      setError('Failed to load applications. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app =>
        Object.values(app).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => {
        const status = app['Research Ethics Clearance Application Status'] || '';
        const statusLower = status.toLowerCase();
        
        // Map filter values to actual Google Sheet status values
        if (statusFilter === 'pending') {
          return statusLower.includes('pending') || status === '';
        } else if (statusFilter === 'approved') {
          return statusLower.includes('completed');
        } else if (statusFilter === 'needs revision') {
          return statusLower.includes('review results forwarded via email');
        }
        
        return false;
      });
    }

    setFilteredApplications(filtered);
  };

  const handleRowClick = (rowIndex) => {
    navigate(`/application/${rowIndex}`);
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="status-badge status-pending">Pending</span>;

    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved')) {
      return <span className="status-badge status-approved">Approved</span>;
    } else if (statusLower.includes('reject')) {
      return <span className="status-badge status-rejected">Rejected</span>;
    } else if (statusLower.includes('revision')) {
      return <span className="status-badge status-revision">Needs Revision</span>;
    }
    return <span className="status-badge status-pending">{status}</span>;
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getStatistics = () => {
    const total = applications.length;
    const pending = applications.filter(app => {
      const status = app['Research Ethics Clearance Application Status'] || '';
      return status === '' || status.toLowerCase().includes('pending');
    }).length;
    const approved = applications.filter(app => {
      const status = app['Research Ethics Clearance Application Status'] || '';
      return status.toLowerCase().includes('completed');
    }).length;
    const needsRevision = applications.filter(app => {
      const status = app['Research Ethics Clearance Application Status'] || '';
      return status.toLowerCase().includes('review results forwarded');
    }).length;
    
    return { total, pending, approved, needsRevision };
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Research Ethics Applications</h1>
            <p className="dashboard-subtitle">Manage and review ethics clearance submissions</p>
          </div>
          <button className="refresh-button" onClick={fetchApplications}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div className="stat-details">
              <div className="stat-value">{getStatistics().total}</div>
              <div className="stat-label">Total Applications</div>
            </div>
          </div>

          <div className="stat-card stat-pending">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="stat-details">
              <div className="stat-value">{getStatistics().pending}</div>
              <div className="stat-label">Pending Review</div>
            </div>
          </div>

          <div className="stat-card stat-approved">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="stat-details">
              <div className="stat-value">{getStatistics().approved}</div>
              <div className="stat-label">Approved</div>
            </div>
          </div>

          <div className="stat-card stat-revision">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <div className="stat-details">
              <div className="stat-value">{getStatistics().needsRevision}</div>
              <div className="stat-label">Needs Revision</div>
            </div>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="needs revision">Needs Revision</option>
            </select>
          </div>

          <div className="results-count">
            Showing {filteredApplications.length} of {applications.length} applications
          </div>
        </div>

        <div className="table-container">
          <table className="applications-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lead Researcher</th>
                <th>Research Title</th>
                <th>College</th>
                <th>Program</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app, index) => (
                  <tr key={app.rowIndex} className="clickable-row">
                    <td>{index + 1}</td>
                    <td>{truncateText(app['Name of Lead Researcher (First Name Middle Initial. Last Name) '])}</td>
                    <td>{truncateText(app['APPROVED RESEARCH TITLE'], 60)}</td>
                    <td>{truncateText(app['College'])}</td>
                    <td>{truncateText(app['Program'])}</td>
                    <td>{getStatusBadge(app['Research Ethics Clearance Application Status'])}</td>
                    <td>
                      <button
                        className="view-button"
                        onClick={() => handleRowClick(app.rowIndex)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
