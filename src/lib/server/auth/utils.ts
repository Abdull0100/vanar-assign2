import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db';
import { users, sessions, verificationTokens } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { env } from '$env/dynamic/private';
import crypto from 'crypto';

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'admin']).default('user')
});

export const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(['user', 'admin']).default('user'),
  adminKey: z.string().optional()
});

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// User utilities
export async function findUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return result[0] || null;
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}) {
  const hashedPassword = await hashPassword(userData.password);
  
  const newUser = await db
    .insert(users)
    .values({
      id: createId(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'user',
      isEmailVerified: false
    })
    .returning();
  
  return newUser[0];
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  
  if (!user || !user.password) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  const isValidPassword = await verifyPassword(password, user.password);
  
  if (!isValidPassword) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  if (!user.isEmailVerified) {
    return { success: false, error: 'Please verify your email address before signing in. Check your inbox for a verification link.' };
  }
  
  return { success: true, user };
}

// Session utilities
export async function createSession(userId: string, expires: Date) {
  const sessionToken = createId();
  
  const session = await db
    .insert(sessions)
    .values({
      sessionToken,
      userId,
      expires
    })
    .returning();
  
  return session[0];
}

export async function getSession(sessionToken: string) {
  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.sessionToken, sessionToken))
    .limit(1);
  
  return result[0] || null;
}

export async function deleteSession(sessionToken: string) {
  await db
    .delete(sessions)
    .where(eq(sessions.sessionToken, sessionToken));
}

/**
 * Create a secure password reset token
 */
export async function createPasswordResetToken(email: string): Promise<string> {
  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiry time (15 minutes)
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 15);

  // Store token in database
  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
    type: 'password_reset'
  });

  return token;
}

/**
 * Validate a password reset token
 */
export async function validatePasswordResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
  try {
    // Find the token
    const tokenData = await db
      .select()
      .from(verificationTokens)
      .where(
        eq(verificationTokens.token, token)
      )
      .limit(1);

    if (tokenData.length === 0) {
      return { valid: false, error: 'Invalid reset token' };
    }

    const foundToken = tokenData[0];

    // Check if token has expired
    if (new Date() > foundToken.expires) {
      // Delete expired token using composite key
      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, foundToken.identifier),
            eq(verificationTokens.token, foundToken.token)
          )
        );

      return { valid: false, error: 'Reset token has expired' };
    }

    return { valid: true, email: foundToken.identifier };

  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'An error occurred while validating the token' };
  }
}

// Cookie utilities
export function getSessionCookieName(): string {
  return 'authjs.session-token';
}

export function getSessionCookieOptions() {
  const isProduction = env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  };
}
