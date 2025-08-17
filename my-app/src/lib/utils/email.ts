import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // You can change this to your email provider
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Generate a secure verification token
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

// Send verification email
export async function sendVerificationEmail(
  email: string, 
  name: string, 
  token: string,
  baseUrl: string = 'http://localhost:5173'
): Promise<boolean> {
  try {
    const verificationUrl = `${baseUrl}/verify/${token}`;
    
    const mailOptions = {
      from: `"MyApp" <${process.env.EMAIL_USER || 'noreply@myapp.com'}>`,
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to MyApp! 🚀</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Thank you for signing up! To complete your registration and start using MyApp, 
              please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                        font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                ✅ Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #667eea; font-size: 14px; word-break: break-all;">
              <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="background: #e9ecef; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">
              This verification link will expire in 24 hours. If you didn't create an account, 
              you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px;">
            <p>© 2024 MyApp. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // For development, log the email instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV] Verification email would be sent:');
      console.log('   To:', email);
      console.log('   Subject:', mailOptions.subject);
      console.log('   Verification URL:', verificationUrl);
      console.log('   Email HTML:', mailOptions.html);
      return true;
    }

    // Send the actual email in production
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string, 
  name: string, 
  token: string,
  baseUrl: string = 'http://localhost:5173'
): Promise<boolean> {
  try {
    const resetUrl = `${baseUrl}/reset/${token}`;
    
    const mailOptions = {
      from: `"MyApp" <${process.env.EMAIL_USER || 'noreply@myapp.com'}>`,
      to: email,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request 🔐</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); 
                        color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                        font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);">
                🔑 Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #ff6b6b; font-size: 14px; word-break: break-all;">
              <a href="${resetUrl}" style="color: #ff6b6b;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="background: #e9ecef; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">
              This reset link will expire in 1 hour. If you didn't request a password reset, 
              you can safely ignore this email.
            </p>
          </div>
        </div>
      `
    };

    // For development, log the email instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV] Password reset email would be sent:');
      console.log('   To:', email);
      console.log('   Subject:', mailOptions.subject);
      console.log('   Reset URL:', resetUrl);
      return true;
    }

    // Send the actual email in production
    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return false;
  }
}

export async function sendSignupOtpEmail(email: string, otp: string) {
	// Only run on server
	if (typeof process !== 'undefined' && process.versions?.node) {
		const nodemailer = (await import('nodemailer')).default;

		const transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 587,
			secure: false,
			auth: {
				user: 'sender@gmail.com', // Sender email address
				pass: '12345678'          // Password or app password
			}
		});

		const mailOptions = {
			from: '"No Reply" <sender@gmail.com>', // Not reply email
			to: email,
			subject: 'Your OTP Code',
			text: `Your OTP code is: ${otp}`,
			html: `<p>Your OTP code is: <b>${otp}</b></p>`
		};

		await transporter.sendMail(mailOptions);
		console.log(`[Signup OTP] Sent to ${email}: ${otp}`);
	} else {
		console.log(`[Signup OTP] Would send to ${email}: ${otp} (server only)`);
	}
}
