# Deploying Unstor AI — Self-Hosted on Railway

This guide walks you through deploying Unstor AI on [Railway](https://railway.app) — a free-tier cloud platform that requires no credit card for basic usage. The entire process takes about 15–20 minutes.

---

## What You Need Before Starting

| Requirement | Where to Get It |
|---|---|
| GitHub account | [github.com](https://github.com) — free |
| Railway account | [railway.app](https://railway.app) — sign in with GitHub |
| MySQL database | Railway provides one free (or use [PlanetScale](https://planetscale.com) free tier) |
| Manus Forge API key | Already in your Manus project secrets (for LLM calls) |
| JWT secret | Any random 32-character string |

---

## Step 1 — Push the Code to GitHub

1. Go to [github.com/new](https://github.com/new) and create a new **public** repository named `unstor-ai`
2. Download the Unstor AI source code as a ZIP from the Manus Management UI (⋯ → Download as ZIP)
3. Unzip the file on your computer
4. Open a terminal in the unzipped folder and run:

```bash
git init
git add .
git commit -m "Initial Unstor AI release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/unstor-ai.git
git push -u origin main
```

---

## Step 2 — Create a Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your `unstor-ai` repository
4. Railway will detect the `railway.toml` and start building automatically

---

## Step 3 — Add a MySQL Database

1. In your Railway project, click **New Service → Database → MySQL**
2. Once created, click the MySQL service and go to **Variables**
3. Copy the `DATABASE_URL` value (it looks like `mysql://user:pass@host:port/railway`)
4. You will add this to your app's environment variables in Step 4

---

## Step 4 — Set Environment Variables

In your Railway app service, go to **Variables** and add the following:

### Required Variables

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `mysql://...` | From Step 3 |
| `JWT_SECRET` | Any 32+ char random string | e.g. `openssl rand -hex 32` |
| `NODE_ENV` | `production` | Required |
| `BUILT_IN_FORGE_API_KEY` | Your Manus Forge API key | For LLM calls |
| `BUILT_IN_FORGE_API_URL` | `https://api.manus.im` | Manus API base URL |
| `VITE_FRONTEND_FORGE_API_KEY` | Same as BUILT_IN_FORGE_API_KEY | For frontend LLM calls |
| `VITE_FRONTEND_FORGE_API_URL` | Same as BUILT_IN_FORGE_API_URL | For frontend |

### Optional Variables (for full features)

| Variable | Value | Notes |
|---|---|---|
| `KIMI_API_KEY` | Your Moonshot/Kimi API key | Optional — falls back to built-in LLM |
| `VITE_APP_TITLE` | `Unstor AI` | Browser tab title |
| `OWNER_OPEN_ID` | Your user ID | For owner-only features |
| `OWNER_NAME` | Your name | Displayed in owner chat |

---

## Step 5 — Run Database Migrations

After the first deploy, open a Railway shell for your app service and run:

```bash
pnpm drizzle-kit migrate
```

Or connect to your MySQL database directly and run the SQL files in the `drizzle/` folder in order (0001, 0002, etc.).

---

## Step 6 — Add a Custom Domain (Optional)

1. In Railway, go to your app service → **Settings → Domains**
2. Click **Add Custom Domain** and enter your domain (e.g. `unstorai.com`)
3. Add the CNAME record shown to your DNS provider
4. Railway provisions an SSL certificate automatically

---

## Alternative: Deploy on Render (also free)

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click **New → Web Service** and select your `unstor-ai` repository
3. Set:
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `node dist/index.js`
   - **Environment:** Node
4. Add the same environment variables from Step 4
5. For the database, use Render's free PostgreSQL or connect to PlanetScale MySQL

---

## Troubleshooting

**Build fails:** Make sure `pnpm-lock.yaml` is committed to your repository.

**Database connection error:** Check that `DATABASE_URL` is set correctly and the MySQL service is running.

**LLM calls fail:** Verify `BUILT_IN_FORGE_API_KEY` is set. If using Kimi, verify `KIMI_API_KEY` is valid.

**Images not loading:** AI-generated images use the Manus Forge image API. If `BUILT_IN_FORGE_API_KEY` is valid, images will generate correctly.

---

## Architecture Overview

```
Browser → Railway CDN → Express Server (Node.js)
                              ↓
                    tRPC API (/api/trpc)
                              ↓
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
         IFA Engine      Research Agent   Autonomous Engine
         (LLM + RAG)     (arXiv/PubMed)   (hourly/daily/weekly)
              ↓               ↓               ↓
                    MySQL Database (TiDB/PlanetScale)
                              ↓
                    S3 Storage (file uploads)
```

---

## Support

For questions about Unstor AI, open an issue on GitHub or contact the maintainer.
For Railway platform issues, see [docs.railway.app](https://docs.railway.app).
