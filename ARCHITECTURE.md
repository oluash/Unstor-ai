# Unstor AI — Architecture

This document describes the system design, knowledge graph, Ifá engine, and autonomous learning pipeline.

---

## System Overview

Unstor AI is a full-stack TypeScript application built on React + Express + tRPC. It operates as a structured intelligence system rather than a general-purpose chatbot — every response is grounded in three specific knowledge domains and follows a deterministic three-pillar structure.

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                     Ifá Engine (ifaEngine.ts)               │
│                                                             │
│  1. Identify relevant Odù from query context                │
│  2. Retrieve Ese verse (DB → LLM fallback)                  │
│  3. Retrieve scientific knowledge nodes (vector search)     │
│  4. Generate 3-pillar response (LLM with structured prompt) │
│  5. Generate per-section AI images (parallel)               │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                  Response Structure                         │
│                                                             │
│  PILLAR 1 — Ifá (Odù + Ese verse in Yoruba + English)       │
│  PILLAR 2 — Science (quantum / epigenetics / psychology)    │
│  PILLAR 3 — Reality (environmental / social / practical)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

The database uses MySQL/TiDB with Drizzle ORM. Key tables:

| Table | Purpose |
|---|---|
| `users` | User accounts (email/password + Manus OAuth) |
| `ifa_odu` | 256 Odù with Ese verses, taboos, prescriptions, attributes |
| `unstor_knowledge_nodes` | Knowledge graph nodes (concepts, facts, relationships) |
| `unstor_prompts` | All user queries and Unstor responses (learning input) |
| `unstor_clusters` | Semantic clusters of knowledge nodes |
| `medicine_knowledge` | African herbs, TCM, Yoruba onísègùn tradition |
| `feed_items` | Ingested URLs, PDFs, and raw text |
| `research_papers` | arXiv and PubMed papers |

---

## Ifá Engine

The Ifá engine (`server/ifaEngine.ts`) is the core intelligence layer. It has two entry points:

**`decodeOduForSituation(query, history)`** — used by the public Chat. Takes a user query and conversation history, identifies the most relevant Odù, retrieves its Ese verse, and generates a full 3-pillar response grounded in the knowledge base.

**`groundedOwnerChat(query, history, knowledgeContext)`** — used by the Owner Chat. Same structure but receives pre-retrieved knowledge nodes as additional context, enabling deeper and more precise responses.

Both functions use a structured system prompt that enforces:
- Ese verse in Yoruba original + English translation
- `ODU_QUOTE:` / `ODU_SOURCE:` markers for pull-quote rendering
- `SCI_QUOTE:` / `SCI_SOURCE:` markers for scientific citation rendering
- Consistent PILLAR 1 / PILLAR 2 / PILLAR 3 section headers for image placement

---

## Knowledge Graph

The knowledge graph (`server/learning.ts`) stores structured knowledge as nodes with:

- **Content** — the knowledge text
- **Domain** — one of: `ifa`, `quantum`, `psychology`, `epigenetics`, `medicine`, `environment`
- **Confidence score** — 0.0–1.0, updated by the autonomous engine
- **Access count** — how many times this node has been retrieved
- **Cluster ID** — semantic cluster membership

Nodes are retrieved by semantic similarity using the LLM's embedding capability, then ranked by confidence score and recency.

---

## Autonomous Engine

The autonomous engine (`server/autonomousEngine.ts`) runs four independent cycles:

**Hourly consolidation** — refreshes confidence scores for high-access nodes, ensuring frequently-used knowledge stays sharp.

**Daily readiness snapshot** — calculates a readiness score (0–100%) based on node count and prompt volume. Notifies the owner via the built-in notification system at each 10% milestone.

**Weekly Odù enrichment** — identifies Odù with missing Ese verses, taboos, or prescriptions and generates them using the LLM. Processes up to 4 Odù per cycle to stay within API budget.

**Boot health check** — runs 15 seconds after server startup. If the knowledge base is stale (fewer than 10 nodes), triggers immediate enrichment.

All cycles use an exponential-backoff retry wrapper with up to 3 attempts before logging failure.

---

## Research Agent

The research agent (`server/researchAgent.ts`) runs two daily jobs:

- **arXiv** — fetches recent papers in quantum physics, consciousness, epigenetics, and related fields
- **PubMed** — fetches recent papers in neuroscience, psychology, and traditional medicine

Papers are processed through the feed ingestion pipeline, chunked, and stored as knowledge nodes with source attribution.

---

## Authentication

Two authentication paths share the same JWT session cookie mechanism:

**Email/password** — passwords are hashed with bcrypt (12 rounds). On login, a JWT is signed with `JWT_SECRET` and set as an HTTP-only cookie. The `auth.me` tRPC procedure validates the cookie on every request.

**Manus OAuth** — the `/api/oauth/callback` endpoint handles the Manus OAuth flow, upserts the user, and issues the same JWT cookie. Available as a secondary login option.

---

## Frontend Architecture

The frontend is a single-page React 19 application using Wouter for routing. Key design decisions:

- **tRPC** for all API calls — no REST endpoints, no Axios, typed end-to-end
- **Optimistic updates** for list operations and toggles
- **Streaming-aware** response rendering using `Streamdown` for markdown
- **QuoteBlock** component parses `ODU_QUOTE:` and `SCI_QUOTE:` markers from response text and renders styled pull-quote blocks
- **Per-section images** — response text is split on `PILLAR` headings; one image is generated per section in parallel and injected after the section text
- **Expand/collapse** — responses over 200px collapse with a fade gradient and "Read more" toggle

---

## Deployment

Unstor AI is designed to run as a single Node.js process serving both the API and the compiled frontend static files. The server auto-discovers an available port starting from `PORT` (default 3000).

For production, set `NODE_ENV=production` and run `pnpm build && pnpm start`. The autonomous engine and research agent start automatically on server boot.
