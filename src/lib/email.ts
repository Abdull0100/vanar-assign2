// Lazy load nodemailer only when needed
let transporter: any = null;
let nodemailer: any = null;

const getTransporter = async () => {
	if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
		console.warn('Gmail configuration missing. Email functionality will be disabled.');
		return null;
	}

	if (!transporter) {
		if (!nodemailer) {
			nodemailer = await import('nodemailer');
		}
		
		transporter = nodemailer.default.createTransport({
			service: 'gmail',
			auth: { 
				user: process.env.GMAIL_USER, 
				pass: process.env.GMAIL_APP_PASSWORD 
			}
		});
	}
	
	return transporter;
};

export async function sendVerificationEmail(email: string, url: string) {
	const transporter = await getTransporter();
	if (!transporter) {
		console.warn('Email transporter not configured. Cannot send verification email.');
		return;
	}

	const mailOptions = {
		from: process.env.GMAIL_USER,
		to: email,
		subject: 'Verify your email address',
		html: `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${url}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `
	};

	try {
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.error('Error sending verification email:', error);
	}
}
export async function sendAdminPromotionEmail(email: string, name: string = "User") {
	const transporter = await getTransporter();
	if (!transporter) {
		console.warn('Email transporter not configured. Cannot send admin promotion email.');
		return;
	}

	const mailOptions = {
		from: process.env.GMAIL_USER,
		to: email,
		subject: 'Congratulations! You have been promoted to Admin',
		html: `
      <h1>Congratulations${name ? ', ' + name : ''}!</h1>
      <p>Your account has been promoted to <strong>Admin</strong> level.</p>
      <p>You now have access to admin features in the application.</p>
      <p>If you have any questions, please contact support.</p>
    `
	};

	try {
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.error('Error sending admin promotion email:', error);
	}
}

export async function sendPasswordResetEmail(email: string, url: string) {
	const transporter = await getTransporter();
	if (!transporter) {
		console.warn('Email transporter not configured. Cannot send password reset email.');
		return;
	}

	const mailOptions = {
		from: process.env.GMAIL_USER,
		to: email,
		subject: 'Reset your password',
		html: `
      <h1>Password Reset</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${url}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
	};

	try {
		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.error('Error sending password reset email:', error);
	}
}
