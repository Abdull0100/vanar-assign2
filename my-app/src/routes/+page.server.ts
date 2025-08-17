export const load = async ({ locals }) => {
  // Just return user info if present, but do not redirect
  return {
    user: locals.user
  };
};
