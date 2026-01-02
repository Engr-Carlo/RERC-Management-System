import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { applicationService } from '../services/api';
import './ApplicationDetail.css';

const ApplicationDetail = () => {
  const { rowIndex } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchApplication();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowIndex]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getById(rowIndex);
      setApplication(data);
    } catch (err) {
      setError('Failed to load application details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await applicationService.getHistory(rowIndex);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleEdit = (fieldName, currentValue) => {
    setEditingField(fieldName);
    setEditValue(currentValue || '');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleSave = async () => {
    try {
      setUpdating(true);
      await applicationService.update(rowIndex, editingField, editValue);
      
      // Update local state
      setApplication({
        ...application,
        [editingField]: editValue
      });
      
      setEditingField(null);
      setEditValue('');
      
      // Refresh history
      fetchHistory();
      
      alert('Updated successfully!');
    } catch (err) {
      alert('Failed to update. Please try again.');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!window.confirm(`Are you sure you want to mark this application as "${status}"?`)) {
      return;
    }

    try {
      setUpdating(true);
      await applicationService.update(rowIndex, 'Remarks', status);
      
      // Update local state
      setApplication({
        ...application,
        'Remarks': status
      });
      
      // Refresh history
      fetchHistory();
      
      alert(`Application status updated to: ${status}`);
    } catch (err) {
      alert('Failed to update status. Please try again.');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment.');
      return;
    }

    if (!window.confirm('Are you sure you want to add this comment?')) {
      return;
    }

    try {
      setUpdating(true);
      
      // Append new comment to existing comments (clean version for Google Sheet)
      const existingComments = application['COMMENTS'] || '';
      const updatedComments = existingComments 
        ? `${existingComments}\n\n${newComment}`
        : newComment;
      
      await applicationService.update(rowIndex, 'COMMENTS', updatedComments);
      
      // Update local state
      setApplication({
        ...application,
        'COMMENTS': updatedComments
      });
      
      setNewComment('');
      fetchHistory();
      
      alert('Comment added successfully!');
    } catch (err) {
      alert('Failed to add comment. Please try again.');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const isDocumentField = (fieldName) => {
    return fieldName.toLowerCase().includes('attach') || 
           fieldName.toLowerCase().includes('proof of payment');
  };

  const isEditableField = (fieldName) => {
    return fieldName === 'Research Ethics Clearance Application Status' || 
           fieldName === 'COMMENTS';
  };

  const renderFieldValue = (fieldName, value) => {
    if (!value) return <span className="empty-value">N/A</span>;

    if (isDocumentField(fieldName)) {
      // Check if it's a URL
      if (value.startsWith('http')) {
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="document-link">
            📎 View Document
          </a>
        );
      }
      return <span>{value}</span>;
    }

    if (editingField === fieldName) {
      return (
        <div className="edit-container">
          {fieldName === 'COMMENTS' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows="4"
              className="edit-textarea"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="edit-input"
              autoFocus
            />
          )}
          <div className="edit-actions">
            <button onClick={handleSave} disabled={updating} className="save-button">
              {updating ? 'Saving...' : 'Save'}
            </button>
            <button onClick={handleCancelEdit} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="field-value-container">
        <span className="field-value">{value}</span>
        {isEditableField(fieldName) && (
          <button
            onClick={() => handleEdit(fieldName, value)}
            className="edit-icon-button"
            title="Edit"
          >
            Edit
          </button>
        )}
      </div>
    );
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div>
        <Navbar />
        <div className="error-container">
          <p>{error || 'Application not found'}</p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="detail-container">
        <div className="detail-header">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
          <h1>Application Details</h1>
          <div className="header-actions">
            <button 
              onClick={() => handleStatusUpdate('For Resubmission')} 
              className="status-button status-resubmission"
              disabled={updating}
            >
              For Resubmission
            </button>
            <button 
              onClick={() => handleStatusUpdate('Approved')} 
              className="status-button status-approved"
              disabled={updating}
            >
              Approved
            </button>
            <button onClick={() => setShowHistory(!showHistory)} className="history-toggle-button">
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>
        </div>

        <div className="detail-content">
          <h2>Researcher Information</h2>
          <div className="field-grid">
              <div className="field-item">
                <label>Lead Researcher:</label>
                {renderFieldValue('Name of Lead Researcher (First Name Middle Initial. Last Name) ', 
                  application['Name of Lead Researcher (First Name Middle Initial. Last Name) '])}
              </div>
              <div className="field-item">
                <label>Student Email:</label>
                {renderFieldValue('Active Email Address', application['Active Email Address'])}
              </div>
              <div className="field-item full-width">
                <label>Other Researchers:</label>
                {renderFieldValue('Name of Other Researchers  (First Name Middle Initial. Last Name) separate with comma for more than one', 
                  application['Name of Other Researchers  (First Name Middle Initial. Last Name) separate with comma for more than one'])}
              </div>
              <div className="field-item">
                <label>College:</label>
                {renderFieldValue('College', application['College'])}
              </div>
              <div className="field-item">
                <label>Program:</label>
                {renderFieldValue('Program', application['Program'])}
              </div>
              <div className="field-item">
                <label>Research Adviser:</label>
                {renderFieldValue('Name of Research Adviser', application['Name of Research Adviser'])}
              </div>
              <div className="field-item">
                <label>Adviser Email:</label>
                {renderFieldValue('Email Address', application['Email Address'])}
              </div>
            </div>

          <h2>Research Details</h2>
          <div className="field-grid">
              <div className="field-item full-width">
                <label>Submission Date:</label>
                {renderFieldValue('Date', application['Date'])}
              </div>
              <div className="field-item full-width">
                <label>RERC Code:</label>
                {renderFieldValue('RERC Code for Revised Submission (Please specify the code assigned by the RERC Committee through your research college representative or research teacher for streamlined tracking of your submission); for New application, write NA', 
                  application['RERC Code for Revised Submission (Please specify the code assigned by the RERC Committee through your research college representative or research teacher for streamlined tracking of your submission); for New application, write NA'])}
              </div>
              <div className="field-item full-width">
                <label>Type of Application:</label>
                {renderFieldValue('Type of Application', application['Type of Application'])}
              </div>
              <div className="field-item full-width">
                <label>Research Title:</label>
                {renderFieldValue('APPROVED RESEARCH TITLE', application['APPROVED RESEARCH TITLE'])}
              </div>
            </div>

          <h2>Documents</h2>
          <div className="field-grid">
              <div className="field-item full-width">
                <label>Research Ethics Application Form (PNC:PRE-FO-49):</label>
                {renderFieldValue('Attach DULY ACCOMPLISHED AND SIGNED PNC:PRE-FO-49 Research Ethics Application Form ', 
                  application['Attach DULY ACCOMPLISHED AND SIGNED PNC:PRE-FO-49 Research Ethics Application Form '])}
              </div>
              <div className="field-item full-width">
                <label>Informed Consent Form (PNC PRE-FO-50):</label>
                {renderFieldValue('Attach DULY ACCOMPLISHED AND SIGNED PNC PRE-FO-50 Informed Consent Form', 
                  application['Attach DULY ACCOMPLISHED AND SIGNED PNC PRE-FO-50 Informed Consent Form'])}
              </div>
              <div className="field-item full-width">
                <label>Parental Consent Form (PNC PRE-FO-51):</label>
                {renderFieldValue('Attach DULY ACCOMPLISHED AND SIGNED PNC PRE-FO-51 Parental Consent Form for Research Undertaking (For research involving minor participants (below 18 years old))', 
                  application['Attach DULY ACCOMPLISHED AND SIGNED PNC PRE-FO-51 Parental Consent Form for Research Undertaking (For research involving minor participants (below 18 years old))'])}
              </div>
              <div className="field-item full-width">
                <label>Approved Manuscript/Research Paper:</label>
                {renderFieldValue('Attach DULY APPROVED Manuscript/Research Paper', 
                  application['Attach DULY APPROVED Manuscript/Research Paper'])}
              </div>
              <div className="field-item full-width">
                <label>Proof of Payment:</label>
                {renderFieldValue('Attach PROOF OF PAYMENT OF RESEARCH ETHICS FEE (Php100.00)', 
                  application['Attach PROOF OF PAYMENT OF RESEARCH ETHICS FEE (Php100.00)'])}
              </div>
            </div>

          <h2>Application Status</h2>
          <div className="field-grid">
              <div className="field-item full-width">
                <label>Status:</label>
                {renderFieldValue('Research Ethics Clearance Application Status', 
                  application['Research Ethics Clearance Application Status'])}
              </div>
              <div className="field-item full-width">
                <label>Remarks:</label>
                {renderFieldValue('Remarks', application['Remarks'])}
              </div>
              <div className="field-item full-width">
                <label>Comments:</label>
                {renderFieldValue('COMMENTS', application['COMMENTS'])}
              </div>
              <div className="field-item full-width">
                <label>Add New Comment:</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Enter your comment here..."
                    rows="3"
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <button 
                    onClick={handleCommentSubmit}
                    disabled={updating || !newComment.trim()}
                    className="btn-primary"
                    style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>

          {showHistory && history.length > 0 && (
            <div>
              <h2>Change History</h2>
              <div className="history-list">
                {history.map((log) => (
                  <div key={log.id} className="history-item">
                    <div className="history-header">
                      <span className="history-user">{log.username}</span>
                      <span className="history-date">{formatDate(log.timestamp)}</span>
                    </div>
                    <div className="history-body">
                      <strong>{log.action}:</strong> {log.field_name}
                      {log.old_value && (
                        <div className="history-change">
                          <span className="old-value">From: {log.old_value}</span>
                          <span className="arrow">→</span>
                          <span className="new-value">To: {log.new_value}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
