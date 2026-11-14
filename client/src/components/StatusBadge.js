import React from 'react';
import './StatusBadge.css';

/**
 * Centralised status badge component.
 * Pass the raw status string from Google Sheets; the component maps it to
 * a readable label and colour class automatically.
 */
const StatusBadge = ({ status }) => {
  if (!status) {
    return <span className="status-badge status-pending">Pending</span>;
  }

  const s = status.toLowerCase();

  if (s.includes('approved') || s.includes('completed') || s.includes('clearance')) {
    return <span className="status-badge status-approved">Approved</span>;
  }
  if (s.includes('resubmission') || s.includes('reject') || s.includes('declined')) {
    return <span className="status-badge status-rejected">Needs Revision</span>;
  }
  if (s.includes('revision')) {
    return <span className="status-badge status-revision">Needs Revision</span>;
  }
  if (s.includes('review') || s.includes('forwarded')) {
    return <span className="status-badge status-review">Under Review</span>;
  }

  // Fallback: show raw value truncated to 30 chars
  const label = status.length > 30 ? status.substring(0, 30) + '…' : status;
  return <span className="status-badge status-pending">{label}</span>;
};

export default StatusBadge;
