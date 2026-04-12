export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Points to the Unstor login page (email/password only — standalone, no external OAuth)
export const getLoginUrl = (returnPath?: string) => {
  const base = "/login";
  if (returnPath) return `${base}?return=${encodeURIComponent(returnPath)}`;
  return base;
};
