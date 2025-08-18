import { Pool } from 'pg';
import bcrypt from 'bcrypt';

// Database connection configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'local',
  user: 'root',
  password: 'mysecretpassword'
});

async function addAdminUser() {
  try {
    console.log('🔧 Connecting to database...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Check if admin already exists
    const checkResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['admin@example.com']
    );
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  Admin user already exists:', checkResult.rows[0].email);
      
      // Update existing user to admin
      await pool.query(
        'UPDATE users SET role = $1, updated_at = NOW() WHERE email = $2',
        ['admin', 'admin@example.com']
      );
      console.log('✅ Updated existing user to admin role');
    } else {
      // Create new admin user
      const result = await pool.query(
        `INSERT INTO users (email, name, password_hash, role, verified, disabled, provider, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
         RETURNING id, email, role`,
        [
          'admin@example.com',
          'Admin User',
          hashedPassword,
          'admin',
          true,
          false,
          'email'
        ]
      );
      
      console.log('✅ Admin user created successfully!');
      console.log('   ID:', result.rows[0].id);
      console.log('   Email:', result.rows[0].email);
      console.log('   Role:', result.rows[0].role);
    }
    
    console.log('\n📋 Login Credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    
    console.log('\n🎯 You can now:');
    console.log('   1. Start the server: pnpm dev');
    console.log('   2. Go to: http://localhost:5173/login');
    console.log('   3. Login with the credentials above');
    console.log('   4. Access admin dashboard at: /admin');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addAdminUser();
