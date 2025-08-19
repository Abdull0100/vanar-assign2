import { json } from '@sveltejs/kit';
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, GITHUB_CLIENT_ID, GITHUB_REDIRECT_URI } from '$env/static/private';

export async function GET() {
	return json({
		google: {
			clientId: GOOGLE_CLIENT_ID,
			redirectUri: GOOGLE_REDIRECT_URI
		},
		github: {
			clientId: GITHUB_CLIENT_ID,
			redirectUri: GITHUB_REDIRECT_URI
		}
	});
}
