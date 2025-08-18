import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

// Email configuration with fallback to test service
let transporter: nodemailer.Transporter;

// Initialize email transporter
async function initializeTransporter() {
  console.log('🔍 Checking SMTP configuration...');
  console.log('🔍 SMTP_USER:', process.env.SMTP_USER);
  console.log('🔍 SMTP_HOST:', process.env.SMTP_HOST);
  console.log('🔍 SMTP_PORT:', process.env.SMTP_PORT);
  console.log('🔍 SMTP_FROM:', process.env.SMTP_FROM);
  
  try {
    // Try to use configured SMTP settings
    if (process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      });

      // Test the connection
      await transporter.verify();
      console.log('✅ Email server configured successfully');
      console.log('📧 Using SMTP:', process.env.SMTP_HOST);
      console.log('📧 User:', process.env.SMTP_USER);
      return;
    }
  } catch (error) {
    console.log('⚠️ SMTP configuration failed, using test email service');
    console.error('❌ SMTP Error:', error);
  }

  // Fallback to Ethereal Email (test service)
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('✅ Test email service configured');
    console.log('📧 Test account:', testAccount.user);
  } catch (error) {
    console.error('❌ Failed to configure email service:', error);
  }
}

// Initialize transporter on startup
initializeTransporter();

// Generate a secure verification token
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

// Generate a 6-digit OTP code
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP for password reset
export async function sendPasswordResetOTP(
  email: string, 
  name: string, 
  otp: string,
  baseUrl: string = 'http://localhost:5173'
): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || `"MyApp" <${process.env.SMTP_USER || 'noreply@myapp.com'}>`,
      to: email,
      subject: 'Password Reset OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset OTP 🔐</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${name},</h2>
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              We received a request to reset your password. Use the OTP code below to verify your identity and set a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #fff; border: 3px solid #ff6b6b; border-radius: 10px; padding: 20px; display: inline-block;">
                <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Your OTP Code</h3>
                <div style="font-size: 32px; font-weight: bold; color: #ff6b6b; letter-spacing: 5px; font-family: monospace;">
                  ${otp}
                </div>
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Enter this code on the password reset page to continue. This OTP will expire in 24 hours.
            </p>
          </div>
          
          <div style="background: #e9ecef; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      `
    };

    // Send the actual email
    console.log('📧 Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset OTP sent to:', email);
    console.log('📧 Full response:', JSON.stringify(info, null, 2));
    
    // If using test service, show preview URL
    if (info.messageId) {
      console.log('📧 Message ID:', info.messageId);
      if (info.previewURL) {
        console.log('📧 Preview URL:', info.previewURL);
      } else {
        // Generate preview URL for Ethereal Email
        const previewURL = `https://ethereal.email/message/${info.messageId}`;
        console.log('📧 Preview URL:', previewURL);
      }
    } else {
      console.log('❌ No messageId received from email service');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to send password reset OTP:', error);
    return false;
  }
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
      from: process.env.SMTP_FROM || `"MyApp" <${process.env.SMTP_USER || 'noreply@myapp.com'}>`,
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

    // Send the actual email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    
    // If using test service, show preview URL
    if (info.messageId) {
      console.log('📧 Message ID:', info.messageId);
      if (info.previewURL) {
        console.log('📧 Preview URL:', info.previewURL);
      } else {
        console.log('📧 Check Ethereal Email for preview');
      }
    }
    
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
      from: process.env.SMTP_FROM || `"MyApp" <${process.env.SMTP_USER || 'noreply@myapp.com'}>`,
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

    // Send the actual email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', email);
    
    // If using test service, show preview URL
    if (info.messageId) {
      console.log('📧 Message ID:', info.messageId);
      if (info.previewURL) {
        console.log('📧 Preview URL:', info.previewURL);
      } else {
        console.log('📧 Check Ethereal Email for preview');
      }
    }
    
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
