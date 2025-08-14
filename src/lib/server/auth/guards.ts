import { redirect } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

export async function requireAuth(event: RequestEvent) {
  try {
    const session = await event.locals.auth();
    if (!session?.user) {
      throw redirect(302, "/auth/signin");
    }
    return session;
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirects
    }
    console.error("Error in requireAuth:", error);
    throw redirect(302, "/auth/signin");
  }
}

export async function requireAdmin(event: RequestEvent) {
  try {
    const session = await requireAuth(event);
    if (session.user.role !== "admin") {
      throw redirect(302, "/dashboard");
    }
    return session;
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirects
    }
    console.error("Error in requireAdmin:", error);
    throw redirect(302, "/dashboard");
  }
}

export async function requireVerifiedEmail(event: RequestEvent) {
  try {
    const session = await requireAuth(event);
    if (!session.user.isEmailVerified) {
      throw redirect(302, "/auth/verify-otp?email=" + encodeURIComponent(session.user.email || ""));
    }
    return session;
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirects
    }
    console.error("Error in requireVerifiedEmail:", error);
    throw redirect(302, "/auth/signin");
  }
}

export async function requireUserRole(event: RequestEvent) {
  try {
    const session = await requireVerifiedEmail(event);
    if (session.user.role !== "user") {
      throw redirect(302, "/admin");
    }
    return session;
  } catch (error) {
    if (error instanceof Response) {
      throw error; // Re-throw redirects
    }
    console.error("Error in requireUserRole:", error);
    throw redirect(302, "/auth/signin");
  }
} 