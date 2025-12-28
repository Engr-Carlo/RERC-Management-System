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
  const [statusFilter, setStatusFilter] = useState('all');
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
      filtered = filtered.filter(app =>
        app['Research Ethics Clearance Application Status']?.toLowerCase() === statusFilter.toLowerCase()
      );
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
          <h1>Research Ethics Applications</h1>
          <button className="refresh-button" onClick={fetchApplications}>
            🔄 Refresh
          </button>
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
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
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
