const { sql } = require('../_lib/db');
const bcrypt = require('bcryptjs');
const { generateToken, authenticateToken } = require('../_lib/auth');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  // POST /auth?action=login - Login
  if (req.method === 'POST' && action === 'login') {
    try {
      const { username, password } = req.body;
      const email = username; // Accept both email and username for login

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Try to find user by email first, then by username for backwards compatibility
      const result = await sql`
        SELECT * FROM users WHERE email = ${email} OR username = ${email}
      `;

      if (result.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result[0];
      const isValidPassword = await bcrypt.compare(password, user.password || user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user);

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  // GET /auth?action=me - Get current user
  if (req.method === 'GET' && action === 'me') {
    const authResult = authenticateToken(req);
    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    try {
      const result = await sql`
        SELECT id, username, email, role, created_at FROM users WHERE id = ${authResult.user.userId}
      `;

      if (result.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(400).json({ error: 'Invalid action. Use ?action=login or ?action=me' });
};
