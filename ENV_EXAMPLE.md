# Environment Variables Reference

Copy this as `.env` and fill in the values before running Unstor AI.

```env
# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL=mysql://user:password@host:4000/unstor_ai

# ─── Authentication ────────────────────────────────────────────────────────────
JWT_SECRET=your-very-long-random-secret-here

# ─── Manus Forge API (LLM + Image Generation) ─────────────────────────────────
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your-server-side-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key

# ─── Manus OAuth (optional — for "Sign in with Manus") ────────────────────────
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im

# ─── Owner Identity ────────────────────────────────────────────────────────────
OWNER_OPEN_ID=your-manus-open-id
OWNER_NAME=Your Name

# ─── Optional: Kimi (Moonshot AI) ─────────────────────────────────────────────
# Falls back to Forge API if absent or invalid
KIMI_API_KEY=

# ─── Analytics (optional) ─────────────────────────────────────────────────────
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```
