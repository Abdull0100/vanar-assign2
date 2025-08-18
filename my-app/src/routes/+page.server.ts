export const load = async ({ locals, url }) => {
  // Check for admin access error
  const adminAccessError = url.searchParams.get('error') === 'admin_access_denied';
  
  return {
    user: locals.user,
    adminAccessError
  };
};
