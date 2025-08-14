export function generateOTPVerificationEmailHtml(name: string, otp: string): string {
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
        .otp-container {
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #2563eb;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
          margin: 10px 0;
        }
        .footer {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-top: 30px;
        }
        .warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          color: #92400e;
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
        
        <p>Thanks for signing up for Authenra! To complete your account setup, please use the verification code below:</p>
        
        <div class="otp-container">
          <p style="margin: 0 0 10px 0; font-weight: 500;">Your verification code:</p>
          <div class="otp-code">${otp}</div>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Enter this code on the verification page</p>
        </div>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>This code will expire in 10 minutes</li>
            <li>Never share this code with anyone</li>
            <li>If you didn't request this code, please ignore this email</li>
          </ul>
        </div>
        
        <p><strong>Need help?</strong> If you're having trouble, you can request a new verification code from your account settings.</p>
      </div>
      
      <div class="footer">
        <p>© 2025 Authenra. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateOTPPasswordResetEmailHtml(name: string, otp: string): string {
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
          color: #dc2626;
          margin-bottom: 10px;
        }
        .content {
          background: #f8fafc;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .otp-container {
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #dc2626;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
          margin: 10px 0;
        }
        .footer {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-top: 30px;
        }
        .warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          color: #92400e;
        }
        .security-notice {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
          color: #991b1b;
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
        
        <p>We received a request to reset your password for your Authenra account. Use the verification code below to proceed:</p>
        
        <div class="otp-container">
          <p style="margin: 0 0 10px 0; font-weight: 500;">Your verification code:</p>
          <div class="otp-code">${otp}</div>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Enter this code on the password reset page</p>
        </div>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>This code will expire in 10 minutes</li>
            <li>Never share this code with anyone</li>
            <li>If you didn't request a password reset, please ignore this email</li>
          </ul>
        </div>
        
        <div class="security-notice">
          <strong>🔒 Security Tip:</strong>
          <p style="margin: 10px 0 0 0;">If you didn't request this password reset, your account may be compromised. Please contact support immediately and change your password if you can still access your account.</p>
        </div>
        
        <p><strong>Need help?</strong> If you're having trouble, you can request a new verification code from the password reset page.</p>
      </div>
      
      <div class="footer">
        <p>© 2025 Authenra. All rights reserved.</p>
        <p>This is an automated email, please do not reply.</p>
      </div>
    </body>
    </html>
  `;
}
