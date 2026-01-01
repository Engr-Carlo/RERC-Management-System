const postgres = require('postgres');

// Create postgres connection using Supabase/any Postgres URL
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

const sql = postgres(connectionString, {
  ssl: 'require',
  max: 1, // Limit connections for serverless
  idle_timeout: 20,
  connect_timeout: 10
});

module.exports = { sql };
