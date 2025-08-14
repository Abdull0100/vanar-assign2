import { createTransport } from 'nodemailer';
import { env } from '$env/dynamic/private';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return createTransport({
    service: 'gmail',
    auth: {
      user: env.GMAIL_USER,
      pass: env.GMAIL_APP_PASSWORD
    }
  });
};

export async function sendEmailGmail({ 
  to, 
  subject, 
  html, 
  from = env.GMAIL_USER 
}: EmailOptions) {
  // Log the email attempt
  console.log('📧 Gmail SMTP Email service called:', {
    to,
    subject,
    from,
    hasGmailUser: !!env.GMAIL_USER,
    hasAppPassword: !!env.GMAIL_APP_PASSWORD
  });

  // Check if Gmail credentials are configured
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) {
    console.log('⚠️ Gmail credentials not configured - logging email to console');
    console.log('Email would be sent:', { to, subject, from });
    console.log('HTML content:', html);
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    console.log('📤 Creating Gmail transporter...');
    const transporter = createTransporter();

    console.log('📤 Sending email via Gmail SMTP...');
    
    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      html: html
    };

    const result = await transporter.sendMail(mailOptions);

    // Log the response
    console.log('✅ Gmail SMTP response:', JSON.stringify(result, null, 2));

    console.log('✅ Email sent successfully!');
    return { 
      success: true, 
      messageId: result.messageId,
      response: result.response
    };

  } catch (error) {
    console.error('❌ Gmail SMTP error:', error);
    return { success: false, error };
  }
}

export function generateVerificationEmailHtml(name: string, verificationUrl: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - Authenra</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .content {
          background: #f8fafc;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          background: #2563eb;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🛡️ Authenra</div>
        <h1>Verify Your Email Address</h1>
      </div>
      
      <div class="content">
        <p>Hi ${name || 'there'},</p>
        
        <p>Thanks for signing up for Authenra! To complete your account setup, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${verificationUrl}
        </p>
        
        <p><strong>This link will expire in 24 hours.</strong></p>
        
        <p>If you didn't create an account with Authenra, you can safely ignore this email.</p>
      </div>
      
      <div class="footer">
        <p>© 2025 Authenra. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </body>
    </html>
  `;
}

export function generatePasswordResetEmailHtml(name: string, resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Authenra</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .content {
          background: #f8fafc;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          background: #dc2626;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🛡️ Authenra</div>
        <h1>Reset Your Password</h1>
      </div>
      
      <div class="content">
        <p>Hi ${name || 'there'},</p>
        
        <p>We received a request to reset your password for your Authenra account. Click the button below to create a new password:</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${resetUrl}
        </p>
        
        <p><strong>This link will expire in 1 hour.</strong></p>
        
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
      </div>
      
      <div class="footer">
        <p>© 2025 Authenra. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </body>
    </html>
  `;
}
