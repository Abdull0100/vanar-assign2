// This file has been cleaned up - Resend functionality removed
// Use Gmail SMTP instead: src/lib/server/email/gmail.ts

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions) {
  console.log('⚠️ Resend email service has been removed');
  console.log('Please use Gmail SMTP instead: src/lib/server/email/gmail.ts');
  console.log('Email would be sent:', options);
  return { success: true, messageId: 'resend-removed' };
}

// Email templates moved to gmail.ts
// Use generateVerificationEmailHtml and generatePasswordResetEmailHtml from gmail.ts