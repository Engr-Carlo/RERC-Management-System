const { sql } = require('../_lib/db');
const { authenticateToken, requireAdmin } = require('../_lib/auth');
const { getAllApplications } = require('../_lib/googleSheets');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const adminCheck = requireAdmin(authResult.user);
  if (adminCheck) {
    return res.status(adminCheck.status).json({ error: adminCheck.error });
  }

  try {
    // Get all applications from Google Sheets
    const applications = await getAllApplications();

    // Extract unique programs from the "Program" field
    const programsSet = new Set();
    
    applications.forEach(app => {
      const program = app['Program'] || app['PROGRAM'] || app['program'];
      if (program && program.trim()) {
        programsSet.add(program.trim());
      }
    });

    const programs = Array.from(programsSet).sort();

    res.status(200).json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
};
