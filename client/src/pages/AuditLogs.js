import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { auditService } from '../services/api';
import './AuditLogs.css';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [searchTerm, actionFilter, logs]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditService.getAll(200);
      setLogs(data);
      setFilteredLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
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
            filteredLogs.map((log) => (
              <div key={log.id} className="log-item">
                <div className="log-header">
                  <div className="log-user">
                    <span className="user-icon">👤</span>
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
      </div>
    </div>
  );
};

export default AuditLogs;
