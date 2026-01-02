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
            <div className="stat-content">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-label">Total Applications</div>
                  <div className="stat-value">{getStatistics().total}</div>
                </div>
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
              </div>
              <div className="stat-chart">
                <div className="chart-bar" style={{height: '45%'}}></div>
                <div className="chart-bar" style={{height: '70%'}}></div>
                <div className="chart-bar" style={{height: '55%'}}></div>
                <div className="chart-bar" style={{height: '85%'}}></div>
                <div className="chart-bar" style={{height: '65%'}}></div>
                <div className="chart-bar" style={{height: '90%'}}></div>
                <div className="chart-bar" style={{height: '75%'}}></div>
                <div className="chart-bar" style={{height: '60%'}}></div>
              </div>
            </div>
          </div>

          <div className="stat-card stat-pending">
            <div className="stat-content">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-label">Pending Review</div>
                  <div className="stat-value">{getStatistics().pending}</div>
                </div>
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                  </svg>
                </div>
              </div>
              <div className="stat-chart">
                <div className="chart-bar" style={{height: '50%'}}></div>
                <div className="chart-bar" style={{height: '65%'}}></div>
                <div className="chart-bar" style={{height: '45%'}}></div>
                <div className="chart-bar" style={{height: '80%'}}></div>
                <div className="chart-bar" style={{height: '55%'}}></div>
                <div className="chart-bar" style={{height: '70%'}}></div>
                <div className="chart-bar" style={{height: '85%'}}></div>
                <div className="chart-bar" style={{height: '60%'}}></div>
              </div>
            </div>
          </div>

          <div className="stat-card stat-approved">
            <div className="stat-content">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-label">Approved</div>
                  <div className="stat-value">{getStatistics().approved}</div>
                </div>
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </div>
              </div>
              <div className="stat-chart">
                <div className="chart-bar" style={{height: '60%'}}></div>
                <div className="chart-bar" style={{height: '75%'}}></div>
                <div className="chart-bar" style={{height: '55%'}}></div>
                <div className="chart-bar" style={{height: '85%'}}></div>
                <div className="chart-bar" style={{height: '70%'}}></div>
                <div className="chart-bar" style={{height: '90%'}}></div>
                <div className="chart-bar" style={{height: '65%'}}></div>
                <div className="chart-bar" style={{height: '80%'}}></div>
              </div>
            </div>
          </div>

          <div className="stat-card stat-revision">
            <div className="stat-content">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-label">Needs Revision</div>
                  <div className="stat-value">{getStatistics().needsRevision}</div>
                </div>
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                </div>
              </div>
              <div className="stat-chart">
                <div className="chart-bar" style={{height: '40%'}}></div>
                <div className="chart-bar" style={{height: '60%'}}></div>
                <div className="chart-bar" style={{height: '50%'}}></div>
                <div className="chart-bar" style={{height: '75%'}}></div>
                <div className="chart-bar" style={{height: '55%'}}></div>
                <div className="chart-bar" style={{height: '85%'}}></div>
                <div className="chart-bar" style={{height: '70%'}}></div>
                <div className="chart-bar" style={{height: '65%'}}></div>
              </div>
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
