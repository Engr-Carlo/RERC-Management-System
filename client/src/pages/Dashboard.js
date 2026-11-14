import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { applicationService } from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './Dashboard.css';

const ITEMS_PER_PAGE = 10;

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const getFieldValue = useCallback((app, ...keys) => {
    for (const key of keys) {
      const value = app?.[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
  }, []);

  const getStatusValue = useCallback(
    (app) => getFieldValue(app, 'Research Ethics Clearance Application Status', 'Status', 'STATUS'),
    [getFieldValue]
  );
  const getCommentsValue = useCallback(
    (app) => getFieldValue(app, 'COMMENTS', 'Comment', 'COMMENT', 'Comments'),
    [getFieldValue]
  );
  const getRemarksValue = useCallback(
    (app) => getFieldValue(app, 'Remarks', 'REMARKS', 'remarks'),
    [getFieldValue]
  );
  const getSubmissionTimestamp = useCallback((app) => app?.Timestamp || app?.Date || '', []);

  const fetchApplications = useCallback(async () => {
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
  }, []);

  const filterApplications = useCallback(() => {
    let filtered = applications;

    // This SY, remarks are optional and comments alone count as a review.
    // When not viewing "all", keep only applications that are still pending review.
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => {
        const remarks = getRemarksValue(app);
        const comments = getCommentsValue(app);
        const status = getStatusValue(app);
        return !status.trim() && !(remarks.trim() || comments.trim());
      });
    }

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
        const status = getStatusValue(app);
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
  }, [applications, getCommentsValue, getRemarksValue, getStatusValue, searchTerm, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Debounced filter — waits 300 ms after last search/filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      filterApplications();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [filterApplications]);

  const handleRowClick = (rowIndex) => {
    navigate(`/application/${rowIndex}`);
  };

  const getStatusBadge = (status) => <StatusBadge status={status} />;

  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getStatistics = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(app => {
      const status = getStatusValue(app);
      return status === '' || status.toLowerCase().includes('pending');
    }).length;
    const approved = applications.filter(app => {
      const status = getStatusValue(app);
      return status.toLowerCase().includes('completed');
    }).length;
    const needsRevision = applications.filter(app => {
      const status = getStatusValue(app);
      return status.toLowerCase().includes('review results forwarded');
    }).length;
    return { total, pending, approved, needsRevision };
  }, [applications, getStatusValue]);

  const getMonthlyData = useMemo(() => {
    const monthCounts = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    applications.forEach(app => {
      const timestamp = getSubmissionTimestamp(app);
      if (timestamp) {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        }
      }
    });
    return Object.entries(monthCounts)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-6)
      .map(([month, count]) => ({ month, applications: count }));
  }, [applications, getSubmissionTimestamp]);

  const getStatusData = useMemo(() => [
    { name: 'Pending', value: getStatistics.pending, color: '#3B82F6' },
    { name: 'Approved', value: getStatistics.approved, color: '#10B981' },
    { name: 'Needs Revision', value: getStatistics.needsRevision, color: '#F59E0B' }
  ].filter(item => item.value > 0), [getStatistics]);

  const getTrendData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthNames[date.getMonth()];
      const monthApps = applications.filter(app => {
        const submissionTimestamp = getSubmissionTimestamp(app);
        if (!submissionTimestamp) return false;
        const appDate = new Date(submissionTimestamp);
        if (isNaN(appDate.getTime())) return false;
        return appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear();
      });
      const total = monthApps.length;
      const pending = monthApps.filter(app => {
        const status = getStatusValue(app);
        return status === '' || status.toLowerCase().includes('pending');
      }).length;
      const approved = monthApps.filter(app => {
        const status = getStatusValue(app);
        return status.toLowerCase().includes('completed');
      }).length;
      const needsRevision = monthApps.filter(app => {
        const status = getStatusValue(app);
        return status.toLowerCase().includes('review results forwarded');
      }).length;
      last6Months.push({ month: monthKey, total, pending, approved, needsRevision });
    }
    return last6Months;
  }, [applications, getStatusValue, getSubmissionTimestamp]);

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredApplications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredApplications, currentPage]);

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

        {/* Statistics Cards with Real Charts */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-content">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-label">Total Applications</div>
                  <div className="stat-value">{getStatistics.total}</div>
                </div>
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
              </div>
              <div className="stat-chart">
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={getMonthlyData}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }} 
                      stroke="rgba(255, 255, 255, 0.3)"
                    />
                    <Bar dataKey="applications" fill="rgba(255, 255, 255, 0.8)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="stat-card stat-pending">
            <div className="stat-content">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-label">Pending Review</div>
                  <div className="stat-value">{getStatistics.pending}</div>
                </div>
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                  </svg>
                </div>
              </div>
              <div className="stat-chart">
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={getTrendData}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }} 
                      stroke="rgba(255, 255, 255, 0.3)"
                    />
                    <Line type="monotone" dataKey="pending" stroke="rgba(255, 255, 255, 0.9)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="stat-card stat-approved">
            <div className="stat-content">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-label">Approved</div>
                  <div className="stat-value">{getStatistics.approved}</div>
                </div>
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </div>
              </div>
              <div className="stat-chart">
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={getTrendData}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }} 
                      stroke="rgba(255, 255, 255, 0.3)"
                    />
                    <Bar dataKey="approved" fill="rgba(255, 255, 255, 0.8)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="stat-card stat-revision">
            <div className="stat-content">
              <div className="stat-header">
                <div className="stat-info">
                  <div className="stat-label">Needs Revision</div>
                  <div className="stat-value">{getStatistics.needsRevision}</div>
                </div>
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                </div>
              </div>
              <div className="stat-chart">
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={getTrendData}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }} 
                      stroke="rgba(255, 255, 255, 0.3)"
                    />
                    <Line type="monotone" dataKey="needsRevision" stroke="rgba(255, 255, 255, 0.9)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Large Data Visualization Section */}
        <div className="charts-section">
          <div className="large-chart-card">
            <h3>Application Submissions Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ background: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} name="Total Applications" />
                <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={3} name="Pending Review" />
                <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={3} name="Approved" />
                <Line type="monotone" dataKey="needsRevision" stroke="#EF4444" strokeWidth={3} name="Needs Revision" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="large-chart-card">
            <h3>Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                data={getStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
                <th>RERC Code</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    <div className="empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                      <h3>No Applications Found</h3>
                      <p>Try adjusting your search term or status filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((app, index) => {
                  const rercCode = app['RERC Code for Revised Submission (Please specify the code assigned by the RERC Committee through your research college representative or research teacher for streamlined tracking of your submission); for New application, write NA'] || 'N/A';
                  const displayRercCode = rercCode === 'NA' ? 'N/A' : rercCode;
                  
                  return (
                  <tr key={app.rowIndex} className="clickable-row">
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td>{truncateText(app['Name of Lead Researcher (First Name Middle Initial. Last Name) '])}</td>
                    <td>{truncateText(app['APPROVED RESEARCH TITLE'], 60)}</td>
                    <td>{truncateText(app['College'])}</td>
                    <td>{truncateText(app['Program'])}</td>
                    <td className="rerc-code-cell">{truncateText(displayRercCode, 30)}</td>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-btn${currentPage === page ? ' page-btn--active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="page-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
