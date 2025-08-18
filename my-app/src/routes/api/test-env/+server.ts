import { json } from '@sveltejs/kit';

export async function GET() {
	return json({
		SMTP_USER: process.env.SMTP_USER,
		SMTP_HOST: process.env.SMTP_HOST,
		SMTP_PORT: process.env.SMTP_PORT,
		SMTP_FROM: process.env.SMTP_FROM,
		SMTP_SECURE: process.env.SMTP_SECURE,
		message: 'Environment variables test'
	});
}
