const { sql } = require('../_lib/db');
const { getAllApplications, updateApplicationField } = require('../_lib/googleSheets');
const { authenticateToken } = require('../_lib/auth');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { rowIndex } = req.query;

  if (req.method === 'GET') {
    try {
      const applications = await getAllApplications();
      const application = applications.find(app => app.rowIndex === parseInt(rowIndex));

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      // Log view action
      await sql`
        INSERT INTO audit_logs (user_id, username, action, application_row, application_title)
        VALUES (${authResult.user.userId}, ${authResult.user.username}, 'VIEW', ${parseInt(rowIndex)}, ${application['APPROVED RESEARCH TITLE'] || 'N/A'})
      `;

      res.status(200).json(application);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to fetch application' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { fieldName, value } = req.body;

      if (!fieldName || value === undefined) {
        return res.status(400).json({ error: 'Field name and value required' });
      }

      // Get current data
      const applications = await getAllApplications();
      const application = applications.find(app => app.rowIndex === parseInt(rowIndex));

      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const oldValue = application[fieldName];

      // Update the field
      await updateApplicationField(parseInt(rowIndex), fieldName, value);

      // Log the update
      await sql`
        INSERT INTO audit_logs 
        (user_id, username, action, application_row, application_title, field_name, old_value, new_value)
        VALUES (
          ${authResult.user.userId}, 
          ${authResult.user.username}, 
          'UPDATE', 
          ${parseInt(rowIndex)}, 
          ${application['APPROVED RESEARCH TITLE'] || 'N/A'},
          ${fieldName},
          ${oldValue || ''},
          ${value || ''}
        )
      `;

      res.status(200).json({ success: true, message: 'Application updated successfully' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to update application' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
