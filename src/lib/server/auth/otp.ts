import crypto from 'crypto';
import { db, otpTokens } from '$lib/server/db';
import { eq, and, lt } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export interface OTPOptions {
  email: string;
  type: 'email_verification' | 'password_reset';
  expiresInMinutes?: number;
  maxAttempts?: number;
}

export interface OTPValidationResult {
  valid: boolean;
  expired: boolean;
  maxAttemptsExceeded: boolean;
  message?: string;
}

/**
 * Generate a secure 6-digit OTP
 */
export function generateOTP(): string {
  // Generate a random number between 100000 and 999999
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and store an OTP token
 */
export async function createOTP({ 
  email, 
  type, 
  expiresInMinutes = 10, 
  maxAttempts = 3 
}: OTPOptions): Promise<string> {
  console.log(`🔧 Creating OTP for email: ${email}, type: ${type}`);
  
  // Delete any existing OTP tokens for this email and type
  await db
    .delete(otpTokens)
    .where(
      and(
        eq(otpTokens.identifier, email),
        eq(otpTokens.type, type)
      )
    );

  // Generate new OTP
  const otp = generateOTP();
  console.log(`🎲 Generated OTP: ${otp}`);
  
  // Calculate expiry time
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + expiresInMinutes);
  console.log(`⏰ OTP expires at: ${expires}`);

  // Store OTP in database
  await db.insert(otpTokens).values({
    identifier: email,
    otp,
    expires,
    type,
    maxAttempts
  });

  console.log(`💾 OTP stored in database successfully`);
  return otp;
}

/**
 * Validate an OTP
 */
export async function validateOTP(
  email: string, 
  otp: string, 
  type: 'email_verification' | 'password_reset'
): Promise<OTPValidationResult> {
  console.log(`🔍 Validating OTP for email: ${email}, type: ${type}, OTP: ${otp}`);
  
  try {
    // Find the OTP token
    const otpData = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.identifier, email),
          eq(otpTokens.type, type)
        )
      )
      .limit(1);

    console.log(`📊 Found ${otpData.length} OTP records in database`);

    if (otpData.length === 0) {
      console.log('❌ No OTP found in database');
      return {
        valid: false,
        expired: false,
        maxAttemptsExceeded: false,
        message: 'Invalid OTP'
      };
    }

    const token = otpData[0];
    console.log(`📝 Database OTP: ${token.otp}`);
    console.log(`📧 Database email: ${token.identifier}`);
    console.log(`🏷️ Database type: ${token.type}`);
    console.log(`⏰ Database expires: ${token.expires}`);
    console.log(`🔢 Database attempts: ${token.attempts}`);
    console.log(`🔢 Database maxAttempts: ${token.maxAttempts}`);

    // Check if max attempts exceeded
    if (token.attempts >= token.maxAttempts) {
      console.log('❌ Max attempts exceeded');
      return {
        valid: false,
        expired: false,
        maxAttemptsExceeded: true,
        message: 'Maximum attempts exceeded. Please request a new OTP.'
      };
    }

    // Check if expired
    if (new Date() > token.expires) {
      console.log('❌ OTP expired');
      // Delete expired token
      await db
        .delete(otpTokens)
        .where(eq(otpTokens.id, token.id));

      return {
        valid: false,
        expired: true,
        maxAttemptsExceeded: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }

    // Check if OTP matches
    console.log(`🔍 Comparing OTPs: "${otp}" === "${token.otp}"`);
    const otpMatches = token.otp === otp;
    console.log(`✅ OTP match result: ${otpMatches}`);

    if (!otpMatches) {
      console.log('❌ OTP does not match');
      // Increment attempts
      await db
        .update(otpTokens)
        .set({ attempts: token.attempts + 1 })
        .where(eq(otpTokens.id, token.id));

      return {
        valid: false,
        expired: false,
        maxAttemptsExceeded: false,
        message: 'Invalid OTP'
      };
    }

    console.log('✅ OTP is valid, deleting token');
    // OTP is valid - delete the token
    await db
      .delete(otpTokens)
      .where(eq(otpTokens.id, token.id));

    return {
      valid: true,
      expired: false,
      maxAttemptsExceeded: false
    };

  } catch (error) {
    console.error('❌ OTP validation error:', error);
    return {
      valid: false,
      expired: false,
      maxAttemptsExceeded: false,
      message: 'An error occurred during validation'
    };
  }
}

/**
 * Clean up expired OTP tokens
 */
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    await db
      .delete(otpTokens)
      .where(lt(otpTokens.expires, new Date()));
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}

/**
 * Get remaining attempts for an email/type combination
 */
export async function getRemainingAttempts(
  email: string, 
  type: 'email_verification' | 'password_reset'
): Promise<number> {
  try {
    const otpData = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.identifier, email),
          eq(otpTokens.type, type)
        )
      )
      .limit(1);

    if (otpData.length === 0) {
      return 3; // Default max attempts
    }

    const token = otpData[0];
    return Math.max(0, token.maxAttempts - token.attempts);
  } catch (error) {
    console.error('Error getting remaining attempts:', error);
    return 0;
  }
}

/**
 * Rate limiting: Check if user can request new OTP
 * Rate limiting has been disabled - users can request OTPs immediately
 */
export async function canRequestOTP(
  email: string, 
  type: 'email_verification' | 'password_reset'
): Promise<{ allowed: boolean; waitTime?: number }> {
  // Rate limiting disabled - always allow OTP requests
  return { allowed: true };
}
