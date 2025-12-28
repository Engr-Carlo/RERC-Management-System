require('dotenv').config();
const User = require('../models/User');
const db = require('../config/database');

// Wait for database to be ready
function waitForDatabase() {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000); // Wait 1 second for tables to be created
  });
}

async function seedAdmin() {
  try {
    console.log('🌱 Seeding database...');

    // Wait for database to initialize
    await waitForDatabase();

    // Check if admin already exists
    const existingAdmin = await User.findByUsername('admin');
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create('admin', 'admin123', 'admin');
    console.log('✅ Admin user created successfully');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change the password after first login!\n');

    // Create a sample reviewer user
    const reviewer = await User.create('reviewer', 'reviewer123', 'reviewer');
    console.log('✅ Reviewer user created successfully');
    console.log('   Username: reviewer');
    console.log('   Password: reviewer123\n');

    console.log('🎉 Database seeded successfully!');
    
    // Close database connection
    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedAdmin();
