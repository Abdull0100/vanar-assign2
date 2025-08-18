import { getDb } from '../src/lib/server/db/index.ts';
import { users } from '../src/lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function createAdminUser() {
	try {
		const db = getDb();
		
		// Check if admin already exists
		const existingAdmin = await db.query.users.findFirst({
			where: eq(users.email, 'admin@example.com')
		});

		if (existingAdmin) {
			console.log('✅ Admin user already exists:', existingAdmin.email);
			return;
		}

		// Create admin user
		const hashedPassword = await bcrypt.hash('admin123', 10);
		
		const [adminUser] = await db.insert(users).values({
			email: 'admin@example.com',
			name: 'Admin User',
			passwordHash: hashedPassword,
			role: 'admin',
			verified: true,
			disabled: false,
			provider: 'email'
		}).returning();

		console.log('✅ Admin user created successfully:');
		console.log('   Email: admin@example.com');
		console.log('   Password: admin123');
		console.log('   Role: admin');
		console.log('   ID:', adminUser.id);

	} catch (error) {
		console.error('❌ Error creating admin user:', error);
	}
}

createAdminUser();
