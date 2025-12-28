const { sql } = require('@vercel/postgres');
const { authenticateToken, requireAdmin } = require('../lib/auth');

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

  const adminCheck = requireAdmin(authResult.user);
  if (adminCheck) {
    return res.status(adminCheck.status).json({ error: adminCheck.error });
  }

  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const result = await sql`
      SELECT * FROM audit_logs 
      ORDER BY timestamp DESC 
      LIMIT ${limit}
    `;

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};
