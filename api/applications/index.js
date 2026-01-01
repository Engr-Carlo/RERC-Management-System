const { sql } = require('../_lib/db');
const { getAllApplications, updateApplication } = require('../_lib/googleSheets');
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

  try {
    // GET single application by rowIndex
    if (req.method === 'GET' && req.query.rowIndex) {
      const applications = await getAllApplications();
      const application = applications.find(app => String(app.rowIndex) === String(req.query.rowIndex));
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }
      
      return res.status(200).json(application);
    }

    // GET application history
    if (req.method === 'GET' && req.query.history === 'true' && req.query.rowIndex) {
      const logs = await sql`
        SELECT * FROM audit_logs 
        WHERE application_row = ${req.query.rowIndex}
        ORDER BY timestamp DESC
      `;
      return res.status(200).json(logs);
    }

    // PATCH - Update application field
    if (req.method === 'PATCH' && req.query.rowIndex) {
      const { fieldName, value } = req.body;
      
      if (!fieldName) {
        return res.status(400).json({ error: 'Field name is required' });
      }

      // Get current application to get old value
      const applications = await getAllApplications();
      const application = applications.find(app => String(app.rowIndex) === String(req.query.rowIndex));
      
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }

      const oldValue = application[fieldName] || '';
      
      // Update Google Sheet
      await updateApplication(req.query.rowIndex, fieldName, value);

      // Log the change
      await sql`
        INSERT INTO audit_logs (user_id, username, action, application_row, application_title, field_name, old_value, new_value)
        VALUES (
          ${authResult.user.userId},
          ${authResult.user.username},
          'update',
          ${req.query.rowIndex},
          ${application['APPROVED RESEARCH TITLE'] || 'N/A'},
          ${fieldName},
          ${oldValue},
          ${value}
        )
      `;

      return res.status(200).json({ message: 'Application updated successfully' });
    }

    // GET all applications (default)
    if (req.method === 'GET') {
      let applications = await getAllApplications();

      // If user is a reviewer (not admin), filter by assigned programs
      if (authResult.user.role === 'reviewer') {
        const assignedPrograms = await sql`
          SELECT program FROM reviewer_programs 
          WHERE user_id = ${authResult.user.userId}
        `;

        const programNames = assignedPrograms.map(p => p.program);

        // If reviewer has no assigned programs, return empty array
        if (programNames.length === 0) {
          return res.status(200).json([]);
        }

        // Filter applications by assigned programs
        applications = applications.filter(app => {
          const appProgram = app['Program'] || app['PROGRAM'] || app['program'] || '';
          return programNames.includes(appProgram.trim());
        });
      }

      return res.status(200).json(applications);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in applications API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
