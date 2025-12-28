const postgres = require('postgres');

// Create postgres connection using Supabase/any Postgres URL
const sql = postgres(process.env.POSTGRES_URL || process.env.DATABASE_URL, {
  ssl: 'require'
});

module.exports = { sql };
