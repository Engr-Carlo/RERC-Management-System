const { sql } = require('./_lib/db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const debug = {
      envVars: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasGoogleCreds: !!process.env.GOOGLE_CREDENTIALS_BASE64,
        hasSpreadsheetId: !!process.env.SPREADSHEET_ID,
        hasSheetName: !!process.env.SHEET_NAME,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
      },
      database: null,
      users: null,
      error: null
    };

    // Try to query database
    try {
      const result = await sql`SELECT * FROM users LIMIT 5`;
      debug.database = 'connected';
      debug.users = result.rows.map(u => ({ 
        id: u.id, 
        username: u.username, 
        role: u.role,
        hasPassword: !!u.password_hash || !!u.password
      }));
    } catch (dbError) {
      debug.database = 'error';
      debug.error = dbError.message;
    }

    return res.status(200).json(debug);
  } catch (error) {
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
};
