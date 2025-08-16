import { db } from './db';
import { users } from './db/schema';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
	try {
		console.log('🌱 Seeding database with mock users...');

		// Check if users already exist
		const existingUsers = await db.query.users.findMany();

		if (existingUsers.length > 0) {
			console.log('⚠️  Users already exist in database. Skipping seed...');
			return;
		}

		// Create admin user
		const adminPassword = await bcrypt.hash('admin123', 10);
		const adminUser = await db
			.insert(users)
			.values({
				name: 'Admin User',
				email: 'admin@example.com',
				password: adminPassword,
				role: 'admin',
				emailVerified: new Date(),
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		console.log('✅ Admin user created:', adminUser[0].email);

		// Create regular user
		const userPassword = await bcrypt.hash('user123', 10);
		const regularUser = await db
			.insert(users)
			.values({
				name: 'Test User',
				email: 'user@example.com',
				password: userPassword,
				role: 'user',
				emailVerified: new Date(),
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		console.log('✅ Regular user created:', regularUser[0].email);

		// Create another test user
		const user2Password = await bcrypt.hash('user123', 10);
		const regularUser2 = await db
			.insert(users)
			.values({
				name: 'John Doe',
				email: 'john@example.com',
				password: user2Password,
				role: 'user',
				emailVerified: new Date(),
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		console.log('✅ Second user created:', regularUser2[0].email);

		console.log('🎉 Database seeding completed successfully!');
		console.log('\n📋 Test Accounts:');
		console.log('👑 Admin: admin@example.com / admin123');
		console.log('👤 User: user@example.com / user123');
		console.log('👤 User: john@example.com / user123');
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		throw error;
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
