const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireAdmin } = require('../lib/auth');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
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

  const adminCheck = requireAdmin(authResult.user);
  if (adminCheck) {
    return res.status(adminCheck.status).json({ error: adminCheck.error });
  }

  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT id, username, role, created_at FROM users
      `;
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } else if (req.method === 'POST') {
    try {
      const { username, password, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      if (!['admin', 'reviewer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await sql`
        INSERT INTO users (username, password_hash, role)
        VALUES (${username}, ${hashedPassword}, ${role})
        RETURNING id, username, role
      `;

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.message.includes('unique')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
