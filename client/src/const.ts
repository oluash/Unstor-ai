export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Points to the Unstor login page (email/password). Manus OAuth remains available as a secondary option.
export const getLoginUrl = (returnPath?: string) => {
  const base = "/login";
  if (returnPath) return `${base}?return=${encodeURIComponent(returnPath)}`;
  return base;
};

// Manus OAuth URL (kept for the secondary "Sign in with Manus" link)
export const getManusLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  return url.toString();
};
