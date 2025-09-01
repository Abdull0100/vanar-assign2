import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error('DATABASE_URL environment variable is required');
	process.exit(1);
}

const sql = postgres(connectionString);

async function seedActivityData() {
	try {
		console.log('🌱 Seeding activity tracking data...');

		// Get existing users
		const users = await sql`SELECT id, email, name, role FROM users LIMIT 10`;

		if (users.length === 0) {
			console.log('No users found. Please run the main seed script first.');
			return;
		}

		console.log(`Found ${users.length} users to seed data for`);

		// Seed user stats
		for (const user of users) {
			try {
				await sql`
          INSERT INTO "userStats" (
            "userId", "totalChatMessages", "totalConversations", 
            "profileUpdateCount", "passwordChangeCount", "lastActivity", "lastLogin"
          ) VALUES (
            ${user.id}, 
            ${Math.floor(Math.random() * 50) + 1}, 
            ${Math.floor(Math.random() * 10) + 1},
            ${Math.floor(Math.random() * 5)},
            ${Math.floor(Math.random() * 3)},
            ${new Date().toISOString()},
            ${new Date().toISOString()}
          )
          ON CONFLICT ("userId") DO NOTHING
        `;

				console.log(`✅ Created stats for user: ${user.email}`);
			} catch (error) {
				if (error.message.includes('duplicate key')) {
					console.log(`⚠️ Stats already exist for user: ${user.email}`);
				} else {
					console.error(`❌ Error creating stats for user ${user.email}:`, error.message);
				}
			}
		}

		// Seed user activities
		const activityTypes = ['chat_message', 'profile_update', 'password_change', 'login', 'logout'];
		const descriptions = [
			'User sent a chat message',
			'User updated profile information',
			'User changed password',
			'User logged in',
			'User logged out'
		];

		for (const user of users) {
			const numActivities = Math.floor(Math.random() * 20) + 5;

			for (let i = 0; i < numActivities; i++) {
				const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
				const description = descriptions[activityTypes.indexOf(activityType)];
				const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days

				try {
					await sql`
            INSERT INTO "userActivities" (
              "userId", "activityType", "description", "metadata", 
              "ipAddress", "userAgent", "createdAt"
            ) VALUES (
              ${user.id}, ${activityType}, ${description}, 
              ${JSON.stringify({ sample: true })},
              ${`192.168.1.${Math.floor(Math.random() * 255)}`},
              ${'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},
              ${createdAt.toISOString()}
            )
          `;
				} catch (error) {
					console.error(`❌ Error creating activity for user ${user.email}:`, error.message);
				}
			}

			console.log(`✅ Created ${numActivities} activities for user: ${user.email}`);
		}

		// Seed user sessions
		for (const user of users) {
			const numSessions = Math.floor(Math.random() * 10) + 2;

			for (let i = 0; i < numSessions; i++) {
				const loginTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
				const logoutTime =
					Math.random() > 0.3
						? new Date(loginTime.getTime() + Math.random() * 8 * 60 * 60 * 1000)
						: null; // 30% chance of active session

				try {
					await sql`
            INSERT INTO "userSessions" (
              "userId", "sessionToken", "ipAddress", "userAgent", 
              "loginTime", "logoutTime", "isActive"
            ) VALUES (
              ${user.id}, 
              ${`session_${user.id}_${i}_${Date.now()}`},
              ${`192.168.1.${Math.floor(Math.random() * 255)}`},
              ${'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},
              ${loginTime.toISOString()},
              ${logoutTime?.toISOString() || null},
              ${!logoutTime}
            )
          `;
				} catch (error) {
					console.error(`❌ Error creating session for user ${user.email}:`, error.message);
				}
			}

			console.log(`✅ Created ${numSessions} sessions for user: ${user.email}`);
		}

		// Seed admin actions (only for admin users)
		const adminUsers = users.filter((u) => u.role === 'admin');
		const regularUsers = users.filter((u) => u.role === 'user');

		if (adminUsers.length > 0 && regularUsers.length > 0) {
			const actionTypes = ['user_delete', 'user_disable', 'user_enable', 'role_change'];
			const actionDescriptions = [
				'Admin deleted user: {email}',
				'Admin disabled user: {email}',
				'Admin enabled user: {email}',
				'Admin changed role for {email} from user to admin'
			];

			for (const admin of adminUsers) {
				const numActions = Math.floor(Math.random() * 15) + 5;

				for (let i = 0; i < numActions; i++) {
					const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
					const targetUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
					const description = actionDescriptions[actionTypes.indexOf(actionType)].replace(
						'{email}',
						targetUser.email
					);
					const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

					try {
						await sql`
              INSERT INTO "adminActions" (
                "adminId", "targetUserId", "actionType", "description", 
                "metadata", "ipAddress", "userAgent", "createdAt"
              ) VALUES (
                ${admin.id}, ${targetUser.id}, ${actionType}, ${description},
                ${JSON.stringify({ sample: true, targetEmail: targetUser.email })},
                ${`192.168.1.${Math.floor(Math.random() * 255)}`},
                ${'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},
                ${createdAt.toISOString()}
              )
            `;
					} catch (error) {
						console.error(
							`❌ Error creating admin action for admin ${admin.email}:`,
							error.message
						);
					}
				}

				console.log(`✅ Created ${numActions} admin actions for admin: ${admin.email}`);
			}
		}

		console.log('🎉 Activity tracking data seeding completed successfully!');
	} catch (error) {
		console.error('❌ Error seeding activity data:', error);
	} finally {
		await sql.end();
	}
}

seedActivityData();
