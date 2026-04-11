const { sql } = require('../_lib/db');

module.exports = async (req, res) => {
  // Handle CORS for client-side pings
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

  // Allow GET (Vercel Cron) and POST (client wake-up)
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'HEAD') {
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
