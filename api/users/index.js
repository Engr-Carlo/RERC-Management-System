const { sql } = require('../_lib/db');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireAdmin } = require('../_lib/auth');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PUT,OPTIONS');
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

  // Change password and reset password don't need admin check
  if (req.method === 'PUT') {
    try {
      // Change password with current password verification
      if (req.query.action === 'changePassword') {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Get current user's password hash
        const user = await sql`
          SELECT password_hash FROM users WHERE id = ${authResult.user.userId}
        `;

        if (user.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user[0].password_hash);
        if (!isValid) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update to new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await sql`
          UPDATE users 
          SET password_hash = ${hashedPassword}
          WHERE id = ${authResult.user.userId}
        `;

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
      }

      // Reset password to default (admin123)
      if (req.query.action === 'resetPassword') {
        const defaultPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await sql`
          UPDATE users 
          SET password_hash = ${hashedPassword}
          WHERE id = ${authResult.user.userId}
        `;

        return res.status(200).json({ success: true, message: 'Password reset to default' });
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Failed to update password' });
    }
  }

  // All other methods require admin
  const adminCheck = requireAdmin(authResult.user);
  if (adminCheck) {
    return res.status(adminCheck.status).json({ error: adminCheck.error });
  }

  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT id, username, email, role, created_at FROM users
      `;
      res.status(200).json(result);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } else if (req.method === 'POST') {
    try {
      const { username, password, email, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      if (!['admin', 'reviewer', 'rerc_head'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await sql`
        INSERT INTO users (username, password_hash, email, role)
        VALUES (${username}, ${hashedPassword}, ${email || null}, ${role})
        RETURNING id, username, email, role
      `;

      res.status(201).json(result[0]);
    } catch (error) {
      if (error.message.includes('unique')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const userId = parseInt(id);

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      if (userId === authResult.user.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await sql`DELETE FROM users WHERE id = ${userId}`;
      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
