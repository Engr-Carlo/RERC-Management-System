const { sql } = require('../_lib/db');

module.exports = async (req, res) => {
  // Only allow GET and HEAD (Vercel Cron sends GET)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Lightweight query — just enough to prevent Supabase from pausing
    await sql`SELECT 1`;
    return res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Keep-alive ping failed:', error);
    return res.status(500).json({ error: 'Database ping failed' });
  }
};
