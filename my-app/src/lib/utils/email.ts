import nodemailer from 'nodemailer';

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `http://localhost:5173/verify/${token}`;
  
  // In development, just log the verification URL
  console.log('📧 Verification email would be sent to:', email);
  console.log('🔗 Verification URL:', verificationUrl);
  
  // TODO: In production, integrate with actual email service
  // Example: SendGrid, AWS SES, etc.
  
  return true;
}

export async function sendPasswordResetEmail(email: string, token: string) {
	const url = `http://localhost:5173/reset/${token}`;
	console.log(`[Password Reset] Send to ${email}: ${url}`);
	// TODO: Integrate real email sending here
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
