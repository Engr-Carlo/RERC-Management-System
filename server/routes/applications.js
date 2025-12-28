const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/googleSheetsService');
const auditService = require('../services/auditService');
const { authenticateToken } = require('../middleware/auth');

// Get all applications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const applications = await googleSheetsService.getAllApplications();
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get single application by row index
router.get('/:rowIndex', authenticateToken, async (req, res) => {
  try {
    const applications = await googleSheetsService.getAllApplications();
    const application = applications.find(app => app.rowIndex === parseInt(req.params.rowIndex));
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Log view action
    await auditService.logView(req.user, application);

    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Update application field
router.patch('/:rowIndex', authenticateToken, async (req, res) => {
  try {
    const { rowIndex } = req.params;
    const { fieldName, value } = req.body;

    if (!fieldName || value === undefined) {
      return res.status(400).json({ error: 'Field name and value required' });
    }

    // Get current application data for audit log
    const applications = await googleSheetsService.getAllApplications();
    const application = applications.find(app => app.rowIndex === parseInt(rowIndex));
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const oldValue = application[fieldName];

    // Update the field
    await googleSheetsService.updateApplicationField(parseInt(rowIndex), fieldName, value);

    // Log the update
    await auditService.logUpdate(req.user, application, fieldName, oldValue, value);

    res.json({ success: true, message: 'Application updated successfully' });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Get audit history for an application
router.get('/:rowIndex/history', authenticateToken, async (req, res) => {
  try {
    const { rowIndex } = req.params;
    const history = await auditService.getApplicationHistory(parseInt(rowIndex));
    res.json(history);
  } catch (error) {
    console.error('Error fetching application history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
