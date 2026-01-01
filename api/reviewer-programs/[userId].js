const { sql } = require('../../_lib/db');
const { authenticateToken, requireAdmin } = require('../../_lib/auth');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const adminCheck = requireAdmin(authResult.user);
  if (adminCheck) {
    return res.status(adminCheck.status).json({ error: adminCheck.error });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  // GET - Get programs assigned to a reviewer
  if (req.method === 'GET') {
    try {
      const programs = await sql`
        SELECT program FROM reviewer_programs 
        WHERE user_id = ${parseInt(userId)}
        ORDER BY program
      `;

      res.status(200).json(programs.map(p => p.program));
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to fetch reviewer programs' });
    }
  }
  
  // POST - Assign programs to a reviewer
  else if (req.method === 'POST') {
    try {
      const { programs } = req.body;

      if (!Array.isArray(programs)) {
        return res.status(400).json({ error: 'programs must be an array' });
      }

      // Delete existing assignments
      await sql`
        DELETE FROM reviewer_programs WHERE user_id = ${parseInt(userId)}
      `;

      // Insert new assignments
      if (programs.length > 0) {
        for (const program of programs) {
          await sql`
            INSERT INTO reviewer_programs (user_id, program)
            VALUES (${parseInt(userId)}, ${program})
            ON CONFLICT (user_id, program) DO NOTHING
          `;
        }
      }

      res.status(200).json({ success: true, message: 'Programs updated successfully' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to update reviewer programs' });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
