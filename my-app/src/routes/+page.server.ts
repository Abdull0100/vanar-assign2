import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
  // Check for logout success
  const logoutSuccess = url.searchParams.get('logout') === 'success';
  
  // If logout success and no user, redirect to login
  if (logoutSuccess && !locals.user) {
    throw redirect(302, '/login');
  }
  
  // Check for admin access error
  const adminAccessError = url.searchParams.get('error') === 'admin_access_denied';
  
  return {
    user: locals.user,
    adminAccessError,
    logoutSuccess
  };
};
