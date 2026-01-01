-- Add this to your Supabase SQL editor to create the reviewer_programs table

-- Create reviewer_programs table to store which programs each reviewer can access
CREATE TABLE IF NOT EXISTS reviewer_programs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, program)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviewer_programs_user_id ON reviewer_programs(user_id);
