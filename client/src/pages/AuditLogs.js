import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { auditService } from '../services/api';
import './AuditLogs.css';

const ITEMS_PER_PAGE = 25;

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, []);

  // Debounced filter: waits 300 ms after last change before filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      filterLogs();
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, actionFilter, logs]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await auditService.getAll(200);
      setLogs(data);
      setFilteredLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit logs. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.application_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.field_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action.toLowerCase() === actionFilter.toLowerCase());
    }

    setFilteredLogs(filtered);
  };

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionBadge = (action) => {
    const actionClass = action.toLowerCase();
    return <span className={`action-badge action-${actionClass}`}>{action}</span>;
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="audit-container">
        <div className="audit-header">
          <h1>Audit Logs</h1>
          <button className="refresh-button" onClick={fetchLogs}>
            🔄 Refresh
          </button>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by user, application, or field..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Action:</label>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="view">View</option>
              <option value="update">Update</option>
            </select>
          </div>

          <div className="results-count">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </div>

        <div className="logs-list">
          {filteredLogs.length === 0 ? (
            <div className="no-data">No audit logs found</div>
          ) : (
            paginatedLogs.map((log) => (
              <div key={log.id} className="log-item">
                <div className="log-header">
                  <div className="log-user">
                    <span className="user-icon">User:</span>
                    <strong>{log.username}</strong>
                  </div>
                  {getActionBadge(log.action)}
                  <span className="log-date">{formatDate(log.timestamp)}</span>
                </div>

                <div className="log-body">
                  {log.application_title && (
                    <div className="log-detail">
                      <strong>Application:</strong> {log.application_title}
                      {log.application_row && (
                        <span className="row-badge">Row {log.application_row}</span>
                      )}
                    </div>
                  )}

                  {log.field_name && (
                    <div className="log-detail">
                      <strong>Field:</strong> {log.field_name}
                    </div>
                  )}

                  {log.action === 'UPDATE' && (
                    <div className="log-change">
                      <div className="change-item">
                        <span className="change-label">Old Value:</span>
                        <span className="old-value">{log.old_value || 'N/A'}</span>
                      </div>
                      <span className="arrow">→</span>
                      <div className="change-item">
                        <span className="change-label">New Value:</span>
                        <span className="new-value">{log.new_value || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
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

export default AuditLogs;
