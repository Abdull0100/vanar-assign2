import { GMAIL_USER, GMAIL_APP_PASSWORD } from '$env/static/private';
import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
	if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
		console.warn('Gmail credentials not configured. Email functionality will be disabled.');
		return null;
	}

	return nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: GMAIL_USER,
			pass: GMAIL_APP_PASSWORD
		}
	});
};

// Email templates
const createVerificationEmail = (email: string, url: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Vanar Chain</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🔗 Vanar Chain</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">The Chain That Thinks</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #667eea;">
        <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
        <p>Welcome to Vanar Chain! To complete your registration and start exploring the AI-native blockchain, please verify your email address.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">Verify Email Address</a>
        </div>
        
        <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #667eea; word-break: break-all;">${url}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="font-size: 14px; color: #666; margin: 0;">
                This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>© 2025  Vanar Chain. All rights reserved.</p>
        <p>The Chain That Thinks</p>
    </div>
</body>
</html>
`;

const createPasswordResetEmail = (email: string, url: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Vanar Chain</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Vanar Chain</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #dc3545;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p>We received a request to reset your password for your Vanar Chain account. Click the button below to create a new password.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">Reset Password</a>
        </div>
        
        <p style="font-size: 14px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #dc3545; word-break: break-all;">${url}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="font-size: 14px; color: #666; margin: 0;">
                This reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>© 2025  Vanar Chain. All rights reserved.</p>
        <p>The Chain That Thinks</p>
    </div>
</body>
</html>
`;

const createAdminPromotionEmail = (email: string, name: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Congratulations! You're Now an Admin - Vanar Chain</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">👑 Vanar Chain</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Admin Promotion</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #28a745;">
        <h2 style="color: #333; margin-top: 0;">🎉 Congratulations, ${name}!</h2>
        <p>You have been promoted to <strong>Administrator</strong> on Vanar Chain! This is a significant achievement and recognition of your contributions to our community.</p>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #28a745; margin-top: 0;">🚀 New Admin Privileges:</h3>
            <ul style="color: #333; margin: 10px 0; padding-left: 20px;">
                <li>Full system access and user management</li>
                <li>Admin dashboard with analytics</li>
                <li>User role management capabilities</li>
                <li>System configuration access</li>
                <li>Advanced monitoring and reporting</li>
            </ul>
        </div>
        
        <p>As an administrator, you now have access to powerful tools to help manage and grow the Vanar Chain ecosystem. Your expertise will be invaluable in shaping the future of AI-native blockchain technology.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/admin" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">Access Admin Dashboard</a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="font-size: 14px; color: #666; margin: 0;">
                If you have any questions about your new role or need assistance, please don't hesitate to reach out to the development team.
            </p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>© 2025  Vanar Chain. All rights reserved.</p>
        <p>The Chain That Thinks</p>
    </div>
</body>
</html>
`;

const createAdminDemotionEmail = (email: string, name: string, adminName: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Role Update - Vanar Chain</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📋 Vanar Chain</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Role Update Notification</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #6c757d;">
        <h2 style="color: #333; margin-top: 0;">Hello, ${name}</h2>
        <p>This is to inform you that your role on Vanar Chain has been updated from <strong>Administrator</strong> to <strong>User</strong>.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #dee2e6;">
            <h3 style="color: #6c757d; margin-top: 0;">📝 Role Change Details:</h3>
            <ul style="color: #333; margin: 10px 0; padding-left: 20px;">
                <li><strong>Previous Role:</strong> Administrator</li>
                <li><strong>New Role:</strong> User</li>
                <li><strong>Changed By:</strong> ${adminName}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
        </div>
        
        <p>As a user, you still have access to all the core features of Vanar Chain, including:</p>
        <ul style="color: #333; margin: 10px 0; padding-left: 20px;">
            <li>AI Chat functionality</li>
            <li>Profile management</li>
            <li>Dashboard access</li>
            <li>Community features</li>
        </ul>
        
        <p>If you have any questions about this change or believe it was made in error, please contact the development team or reach out to the administrator who made this change.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="font-size: 14px; color: #666; margin: 0;">
                Thank you for your understanding and continued participation in the Vanar Chain community.
            </p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>© 2025  Vanar Chain. All rights reserved.</p>
        <p>The Chain That Thinks</p>
    </div>
</body>
</html>
`;

// Helper function to send emails
export const sendEmail = async (to: string, subject: string, html: string) => {
	const transporter = createTransporter();
	if (!transporter) {
		console.warn('Email transporter not available. Cannot send email.');
		return false;
	}

	try {
		await transporter.sendMail({
			from: `"Vanar Chain" <${GMAIL_USER}>`,
			to,
			subject,
			html
		});
		console.log(`Email sent successfully to ${to}`);
		return true;
	} catch (error) {
		console.error('Failed to send email:', error);
		return false;
	}
};

// Specific email functions
export const sendVerificationEmail = async (
	email: string,
	tokenOrUrl: string,
	baseUrl?: string
) => {
	// Handle both token (string) and full URL from Auth.js
	let url: string;
	if (tokenOrUrl.startsWith('http')) {
		// Auth.js passed a full URL
		url = tokenOrUrl;
	} else {
		// Custom token, construct URL with domain
		const domain = baseUrl || 'http://localhost:5173';
		url = `${domain}${tokenOrUrl}`;
	}

	console.log('Sending verification email to:', email, 'with URL:', url);

	const html = createVerificationEmail(email, url);
	const result = await sendEmail(email, 'Verify Your Email - Vanar Chain', html);

	console.log('Verification email send result:', result);
	return result;
};

export const sendPasswordResetEmail = async (email: string, token: string, baseUrl?: string) => {
	const domain = baseUrl || 'http://localhost:5173';
	const url = `${domain}/reset-password?token=${token}`;
	const html = createPasswordResetEmail(email, url);
	return await sendEmail(email, 'Reset Your Password - Vanar Chain', html);
};

export const sendAdminPromotionEmail = async (email: string, name: string) => {
	const html = createAdminPromotionEmail(email, name);
	return await sendEmail(email, "🎉 Congratulations! You're Now an Admin - Vanar Chain", html);
};

export const sendAdminDemotionEmail = async (email: string, name: string, adminName: string) => {
	const html = createAdminDemotionEmail(email, name, adminName);
	return await sendEmail(email, 'Role Update - Vanar Chain', html);
};

const createAccountDeletionEmail = (email: string, name: string, adminName: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Deletion Notice - Vanar Chain</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Vanar Chain</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Account Deletion Notice</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #dc3545;">
        <h2 style="color: #333; margin-top: 0;">Hello, ${name}</h2>
        <p>This is to inform you that your account on Vanar Chain has been permanently deleted by an administrator.</p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
            <h3 style="color: #856404; margin-top: 0;">📝 Deletion Details:</h3>
            <ul style="color: #333; margin: 10px 0; padding-left: 20px;">
                <li><strong>Account Email:</strong> ${email}</li>
                <li><strong>Deleted By:</strong> ${adminName}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
                <li><strong>Action:</strong> Permanent Account Deletion</li>
            </ul>
        </div>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #f5c6cb;">
            <h3 style="color: #721c24; margin-top: 0;">⚠️ Important Information:</h3>
            <ul style="color: #333; margin: 10px 0; padding-left: 20px;">
                <li>Your account has been permanently removed from the system</li>
                <li>All associated data has been deleted</li>
                <li>You will no longer have access to Vanar Chain services</li>
                <li>This action cannot be undone</li>
            </ul>
        </div>
        
        <p>If you believe this deletion was made in error or have any questions, please contact the development team immediately. You may also reach out to the administrator who performed this action.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="font-size: 14px; color: #666; margin: 0;">
                Thank you for being part of the Vanar Chain community. We hope to see you again in the future.
            </p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
        <p>© 2025  Vanar Chain. All rights reserved.</p>
        <p>The Chain That Thinks</p>
    </div>
</body>
</html>
`;

export const sendAccountDeletionEmail = async (email: string, name: string, adminName: string) => {
	const html = createAccountDeletionEmail(email, name, adminName);
	return await sendEmail(email, 'Account Deletion Notice - Vanar Chain', html);
};
