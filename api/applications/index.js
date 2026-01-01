const { sql } = require('../_lib/db');
const { getAllApplications } = require('../_lib/googleSheets');
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  try {
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

    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};
