# Unstor AI

**Ancient wisdom. Modern intelligence.**

Unstor AI is an open-source structured intelligence system that combines Ifá symbolic knowledge, quantum science, behavioural psychology, and research-backed wisdom to help users understand patterns, make decisions, and move with clarity.

Every response follows a three-pillar structure:

| Pillar | Domain | What it provides |
|---|---|---|
| **Pillar 1 — Ifá** | Odù corpus, Ese verses | Spiritual grounding, Yoruba original + English verse |
| **Pillar 2 — Science** | Quantum physics, epigenetics, psychology | Evidence-based explanation |
| **Pillar 3 — Reality** | Environmental, social, real-world examples | Practical application |

---

## Features

- **3-Pillar AI responses** — every answer is grounded in Ifá, science, and real-world context
- **Full Ese verse** — Yoruba original + English translation in every Pillar 1 response
- **Styled quote blocks** — amber Odù pull-quotes and indigo scientific citations
- **Per-section AI images** — contextual images placed after each pillar for visual clarity
- **Expand/collapse** — long responses collapse with a smooth fade, "Read more" toggle
- **Odù reference pages** — `/ifa/[odu-name]` with full Ese, taboos, prescriptions, attributes
- **Copy verse + TTS** — copy Yoruba verse to clipboard or hear it read aloud
- **Autonomous engine** — hourly consolidation, daily readiness snapshots, weekly Odù enrichment
- **Research agent** — daily arXiv and PubMed ingestion keeps knowledge current
- **Email/password auth** — standalone registration, no third-party account required
- **Owner Chat** — private admin chat with full knowledge context and metadata
- **Knowledge Explorer** — browse and manage the knowledge graph
- **Feed Manager** — ingest URLs, PDFs, and raw text into the knowledge base

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Express 4, tRPC 11, Superjson |
| Database | MySQL / TiDB (Drizzle ORM) |
| Auth | JWT session cookies (bcrypt passwords + Manus OAuth) |
| AI | Built-in LLM (Manus Forge API), fallback-safe |
| Storage | S3-compatible object storage |
| Language | TypeScript (end-to-end) |

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- MySQL 8+ or TiDB

### Installation

```bash
git clone https://github.com/your-org/unstor-ai.git
cd unstor-ai
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) below for the full list.

### Database Setup

```bash
# Generate migration SQL from schema
pnpm drizzle-kit generate

# Apply migrations (read the generated .sql file and run against your DB)
pnpm drizzle-kit push
```

### Development

```bash
pnpm dev
```

The app runs on `http://localhost:3000`.

### Production Build

```bash
pnpm build
pnpm start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL/TiDB connection string |
| `JWT_SECRET` | Yes | Secret for signing session cookies (min 32 chars) |
| `BUILT_IN_FORGE_API_URL` | Yes | Manus Forge API base URL (LLM + image generation) |
| `BUILT_IN_FORGE_API_KEY` | Yes | Server-side bearer token for Forge API |
| `VITE_FRONTEND_FORGE_API_URL` | Yes | Forge API URL for frontend |
| `VITE_FRONTEND_FORGE_API_KEY` | Yes | Frontend bearer token for Forge API |
| `VITE_APP_ID` | Yes | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Yes | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Yes | Manus login portal URL |
| `OWNER_OPEN_ID` | Yes | Owner's Manus Open ID (for admin access) |
| `OWNER_NAME` | Yes | Owner's display name |
| `KIMI_API_KEY` | No | Moonshot AI (Kimi) API key — falls back to Forge if absent |

---

## Project Structure

```
client/
  src/
    pages/          ← Page-level components (Chat, OwnerChat, IFAReference, Login, ...)
    components/     ← Reusable UI (QuoteBlock, DashboardLayout, AIChatBox, ...)
    _core/hooks/    ← useAuth and other core hooks
    lib/trpc.ts     ← tRPC client binding
    App.tsx         ← Routes
    index.css       ← Global styles and design tokens
drizzle/
  schema.ts         ← Database tables and types
  migrations/       ← Generated SQL migrations
server/
  _core/            ← Framework plumbing (OAuth, context, LLM, JWT)
  routers.ts        ← tRPC procedures
  db.ts             ← Query helpers
  ifaEngine.ts      ← Ifá 3-pillar response engine
  autonomousEngine.ts ← Self-operating learning and enrichment cycles
  researchAgent.ts  ← Daily arXiv + PubMed ingestion
  learning.ts       ← Knowledge graph processing
  feedIngestion.ts  ← URL/PDF/text ingestion pipeline
shared/             ← Shared constants and types
```

---

## Autonomous Operation

Unstor operates independently once deployed. The autonomous engine runs the following cycles automatically:

| Cycle | Frequency | What it does |
|---|---|---|
| Knowledge consolidation | Every hour | Refreshes confidence scores across the knowledge graph |
| Readiness snapshot | Every day | Calculates readiness score; notifies owner at each 10% milestone |
| Odù corpus enrichment | Every week | Fills missing Ese verses, taboos, and prescriptions for all 256 Odù |
| Research ingestion | Every day | Pulls new papers from arXiv and PubMed into the knowledge base |
| Boot health check | On startup | Detects stale knowledge base and triggers immediate enrichment |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to Unstor AI.

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed overview of the system design, knowledge graph, Ifá engine, and learning pipeline.

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

## Acknowledgements

Unstor AI is built on the foundation of the Ifá corpus — one of humanity's oldest and most sophisticated knowledge systems, recognised by UNESCO as an Intangible Cultural Heritage of Humanity. It is offered with deep respect for the Yoruba tradition and its custodians.
