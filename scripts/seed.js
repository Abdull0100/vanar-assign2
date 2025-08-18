// scripts/seed.js
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("❌ DATABASE_URL is not set in .env");
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

async function seedDatabase() {
  try {
    console.log("🌱 Seeding database with mock users...");

    const existingUsers = await db.execute(sql`SELECT * FROM users LIMIT 1`);
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      console.log("⚠️  Users already exist. Skipping seed...");
      return;
    }

    const now = new Date().toISOString();
    const adminPassword = await bcrypt.hash("admin123", 10);

    await db.execute(sql`
      INSERT INTO users (name, email, password, role, "emailVerified", "createdAt", "updatedAt")
      VALUES (${'Admin User'}, ${'admin@example.com'}, ${adminPassword}, ${'admin'}, ${now}, ${now}, ${now})
    `);

    console.log("✅ Admin user created: admin@example.com");
  } finally {
    await client.end();
  }
}

seedDatabase()
  .then(() => {
    console.log("✅ Seed script completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
