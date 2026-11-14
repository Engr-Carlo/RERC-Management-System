import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { applicationService, authService } from '../services/api';
import './RERCHeadPanel.css';

const ITEMS_PER_PAGE = 10;

const RERCHeadPanel = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReviewedApplications();
  }, []);

  useEffect(() => {
    filterApplications();
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, applications]);

  const getFieldValue = (app, ...keys) => {
    for (const key of keys) {
      const value = app?.[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
  };

  const fetchReviewedApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getAll();
      
      // This SY, remarks are optional. A comment alone is enough to trigger review.
      const reviewed = data.filter(app => {
        const status = getFieldValue(app, 'Research Ethics Clearance Application Status', 'Status', 'STATUS');
        const remarks = getFieldValue(app, 'Remarks', 'REMARKS', 'remarks');
        const comments = getFieldValue(app, 'COMMENTS', 'Comment', 'COMMENT', 'Comments');
        
        return (remarks.trim() || comments.trim()) && !status.trim();
      });
      
      setApplications(reviewed);
      setFilteredApplications(reviewed);
    } catch (err) {
      setError('Failed to load applications. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    if (searchTerm) {
      const filtered = applications.filter(app =>
        Object.values(app).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredApplications(filtered);
    } else {
      setFilteredApplications(applications);
    }
  };

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredApplications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredApplications, currentPage]);

  const handleRowClick = (rowIndex) => {
    navigate(`/rerc-head-review/${rowIndex}`);
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
          <p>Loading reviewed applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="rerc-head-container">
        <div className="panel-header">
          <div>
            <h1>For Final Review</h1>
            <p className="panel-subtitle">Applications reviewed by committee members awaiting RERC Head final decision</p>
          </div>
          <button className="refresh-button" onClick={fetchReviewedApplications}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="panel-stats">
          <div className="stat-box stat-pending-review">
            <div className="stat-number">{filteredApplications.length}</div>
            <div className="stat-text">Pending Your Review</div>
          </div>
          <div className="stat-box stat-total-reviewed">
            <div className="stat-number">{applications.length}</div>
            <div className="stat-text">Total Reviewed Applications</div>
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

          <div className="results-count">
            Showing {filteredApplications.length} applications
          </div>
        </div>

        <div className="panel-info-banner">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>These applications have been reviewed by committee members. Only RERC Head can make the final decision to approve or decline.</span>
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
                <th>Reviewer Decision</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    <div className="empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="64" height="64">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <h3>No Applications Pending Review</h3>
                      <p>All reviewed applications have been processed or there are no applications awaiting your final decision.</p>
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
                    <td>{truncateText(
                      getFieldValue(app, 'Remarks', 'REMARKS', 'remarks') ||
                      getFieldValue(app, 'COMMENTS', 'Comment', 'COMMENT', 'Comments')
                    )}</td>
                    <td>
                      {authService.getCurrentUser()?.role === 'rerc_head' ? (
                        <button
                          className="review-button"
                          onClick={() => handleRowClick(app.rowIndex)}
                        >
                          Review & Decide
                        </button>
                      ) : (
                        <span className="access-restricted">RERC Head Only</span>
                      )}
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

export default RERCHeadPanel;
