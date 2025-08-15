import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5433/local';
const client = postgres(connectionString);
const db = drizzle(client);

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with mock users...');

    // Check if users already exist
    const existingUsers = await db.execute(sql`SELECT * FROM users LIMIT 1`);
    
    if (existingUsers.length > 0) {
      console.log('⚠️  Users already exist in database. Skipping seed...');
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const now = new Date().toISOString();
    await db.execute(sql`
      INSERT INTO users (name, email, password, role, "emailVerified", "createdAt", "updatedAt")
      VALUES (${'Admin User'}, ${'admin@example.com'}, ${adminPassword}, ${'admin'}, ${now}, ${now}, ${now})
    `);

    console.log('✅ Admin user created: admin@example.com');

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    await db.execute(sql`
      INSERT INTO users (name, email, password, role, "emailVerified", "createdAt", "updatedAt")
      VALUES (${'Test User'}, ${'user@example.com'}, ${userPassword}, ${'user'}, ${now}, ${now}, ${now})
    `);

    console.log('✅ Regular user created: user@example.com');

    // Create another test user
    const user2Password = await bcrypt.hash('user123', 10);
    await db.execute(sql`
      INSERT INTO users (name, email, password, role, "emailVerified", "createdAt", "updatedAt")
      VALUES (${'John Doe'}, ${'john@example.com'}, ${user2Password}, ${'user'}, ${now}, ${now}, ${now})
    `);

    console.log('✅ Second user created: john@example.com');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('👑 Admin: admin@example.com / admin123');
    console.log('👤 User: user@example.com / user123');
    console.log('👤 User: john@example.com / user123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
