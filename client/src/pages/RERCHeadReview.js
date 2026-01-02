import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { applicationService } from '../services/api';
import './RERCHeadReview.css';

const RERCHeadReview = () => {
  const { rowIndex } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplication();
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

  const handleDecline = async () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
    
    const statusText = `review results forwarded via email, ${currentDate}`;
    
    if (!window.confirm('Are you sure you want to DECLINE this application? This will send it back for resubmission.')) {
      return;
    }

    try {
      setUpdating(true);
      await applicationService.updateStatus(rowIndex, statusText, 'resubmission');
      
      alert('Application declined successfully! Status updated.');
      navigate('/rerc-head-panel');
    } catch (err) {
      alert('Failed to update status. Please try again.');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleApprove = async () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
    
    const statusText = `completed; clearance release ${currentDate}`;
    
    if (!window.confirm('Are you sure you want to APPROVE this application? This will mark it as completed.')) {
      return;
    }

    try {
      setUpdating(true);
      await applicationService.updateStatus(rowIndex, statusText, 'approved');
      
      alert('Application approved successfully! Status updated to completed.');
      navigate('/rerc-head-panel');
    } catch (err) {
      alert('Failed to update status. Please try again.');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const renderFieldValue = (fieldName, value) => {
    if (!value) return <span className="field-empty">N/A</span>;

    const isDocumentField = fieldName.toLowerCase().includes('attach') || 
                           fieldName.toLowerCase().includes('proof of payment');
    
    if (isDocumentField && value.startsWith('http')) {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="document-link">
          View Document →
        </a>
      );
    }

    return <span>{value}</span>;
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
          <button onClick={() => navigate('/rerc-head-panel')} className="back-button">
            Back to Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="review-container">
        <div className="review-header">
          <button onClick={() => navigate('/rerc-head-panel')} className="back-button">
            ← Back to RERC Head Panel
          </button>
          <h1>Final Review & Decision</h1>
        </div>

        <div className="decision-banner">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <div>
            <strong>Make Your Final Decision</strong>
            <p>This application has been reviewed by a reviewer. Review the details below and choose to either approve or decline.</p>
          </div>
        </div>

        <div className="decision-buttons">
          <button 
            onClick={handleDecline} 
            className="decision-button decline-button"
            disabled={updating}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
            </svg>
            <div>
              <span className="button-title">DECLINE</span>
              <span className="button-subtitle">Send back for resubmission</span>
            </div>
          </button>

          <button 
            onClick={handleApprove} 
            className="decision-button approve-button"
            disabled={updating}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            <div>
              <span className="button-title">APPROVE</span>
              <span className="button-subtitle">Mark as completed</span>
            </div>
          </button>
        </div>

        <div className="application-details">
          <h2>Application Information</h2>
          
          {application['Remarks'] && (
            <div className="remarks-section">
              <h3>Reviewer Remarks</h3>
              <div className="remarks-content">{application['Remarks']}</div>
            </div>
          )}

          {application['COMMENTS'] && (
            <div className="comments-section">
              <h3>Committee Comments</h3>
              <div className="comments-content">{application['COMMENTS']}</div>
            </div>
          )}

          <div className="section-card">
            <h3>Researcher Information</h3>
            <div className="field-row">
              <div className="field-col">
                <div className="field-label">Lead Researcher</div>
                <div className="field-value">{renderFieldValue('Name of Lead Researcher', application['Name of Lead Researcher (First Name Middle Initial. Last Name) '])}</div>
              </div>
              <div className="field-col">
                <div className="field-label">Student Email</div>
                <div className="field-value">{renderFieldValue('Active Email Address', application['Active Email Address'])}</div>
              </div>
            </div>
            <div className="field-row">
              <div className="field-col full-width">
                <div className="field-label">Other Researchers</div>
                <div className="field-value">{renderFieldValue('Other Researchers', application['Name of Other Researchers  (First Name Middle Initial. Last Name) separate with comma for more than one'])}</div>
              </div>
            </div>
            <div className="field-row">
              <div className="field-col">
                <div className="field-label">College</div>
                <div className="field-value">{renderFieldValue('College', application['College'])}</div>
              </div>
              <div className="field-col">
                <div className="field-label">Program</div>
                <div className="field-value">{renderFieldValue('Program', application['Program'])}</div>
              </div>
            </div>
            <div className="field-row">
              <div className="field-col">
                <div className="field-label">Research Adviser</div>
                <div className="field-value">{renderFieldValue('Research Adviser', application['Name of Research Adviser'])}</div>
              </div>
              <div className="field-col">
                <div className="field-label">Adviser Email</div>
                <div className="field-value">{renderFieldValue('Email Address', application['Email Address'])}</div>
              </div>
            </div>
          </div>

          <div className="section-card">
            <h3>Research Details</h3>
            <div className="field-row">
              <div className="field-col full-width">
                <div className="field-label">Research Title</div>
                <div className="field-value">{renderFieldValue('Research Title', application['APPROVED RESEARCH TITLE'])}</div>
              </div>
            </div>
            <div className="field-row">
              <div className="field-col">
                <div className="field-label">Type of Application</div>
                <div className="field-value">{renderFieldValue('Type of Application', application['Type of Application'])}</div>
              </div>
              <div className="field-col">
                <div className="field-label">Submission Date</div>
                <div className="field-value">{renderFieldValue('Date', application['Date'])}</div>
              </div>
            </div>
          </div>

          <div className="section-card">
            <h3>Documents</h3>
            <div className="field-row">
              <div className="field-col full-width">
                <div className="field-label">Research Ethics Application Form (PNC:PRE-FO-49)</div>
                <div className="field-value">{renderFieldValue('Attach DULY ACCOMPLISHED AND SIGNED PNC:PRE-FO-49', application['Attach DULY ACCOMPLISHED AND SIGNED PNC:PRE-FO-49 Research Ethics Application Form '])}</div>
              </div>
            </div>
            <div className="field-row">
              <div className="field-col full-width">
                <div className="field-label">Informed Consent Form (PNC PRE-FO-50)</div>
                <div className="field-value">{renderFieldValue('Attach DULY ACCOMPLISHED AND SIGNED PNC PRE-FO-50', application['Attach DULY ACCOMPLISHED AND SIGNED PNC PRE-FO-50 Informed Consent Form'])}</div>
              </div>
            </div>
            <div className="field-row">
              <div className="field-col full-width">
                <div className="field-label">Parental Consent Form (PNC PRE-FO-51)</div>
                <div className="field-value">{renderFieldValue('Attach DULY ACCOMPLISHED AND SIGNED PNC PRE-FO-51', application['Attach DULY ACCOMPLISHED AND SIGNED PNC PRE-FO-51 Parental Consent Form for Research Undertaking (For research involving minor participants (below 18 years old))'])}</div>
              </div>
            </div>
            <div className="field-row">
              <div className="field-col full-width">
                <div className="field-label">Approved Manuscript/Research Paper</div>
                <div className="field-value">{renderFieldValue('Attach DULY APPROVED Manuscript/Research Paper', application['Attach DULY APPROVED Manuscript/Research Paper'])}</div>
              </div>
            </div>
            <div className="field-row">
              <div className="field-col full-width">
                <div className="field-label">Proof of Payment</div>
                <div className="field-value">{renderFieldValue('Attach PROOF OF PAYMENT', application['Attach PROOF OF PAYMENT OF RESEARCH ETHICS FEE (Php100.00)'])}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RERCHeadReview;
