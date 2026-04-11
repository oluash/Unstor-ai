# Unstor AI — Project TODO

## Identity & Branding
- [x] Unstor branded identity: name, avatar, persona, and character distinct from Kimi/Manus
- [x] Unstor persona system prompt and character definition (UNSTOR_SYSTEM_PROMPT in kimi.ts)

## Database Schema
- [x] `unstor_sessions` table — user sessions with metadata
- [x] `unstor_prompts` table — all incoming prompts stored with timestamps, user, topic
- [x] `unstor_knowledge_nodes` table — extracted knowledge units with topic, confidence, frequency
- [x] `unstor_knowledge_edges` table — relationships between knowledge nodes (knowledge graph)
- [x] `unstor_topic_clusters` table — clustered topics with frequency and pattern data
- [x] `unstor_learning_metrics` table — daily learning snapshots (volume, growth, readiness score)
- [x] `unstor_activation_config` table — learning start date, activation date, phase config
- [x] `unstor_owner_queries` table — owner inspection queries and Unstor's responses

## Backend — Silent Learning Pipeline
- [x] Prompt ingestion endpoint — stores every user prompt into `unstor_prompts`
- [x] Topic extraction service — uses Kimi LLM to extract topics from each prompt
- [x] Pattern recognition service — identifies recurring patterns across prompts
- [x] Knowledge node builder — creates/updates knowledge nodes from extracted topics
- [x] Knowledge graph edge builder — links related knowledge nodes
- [x] Topic clustering service — groups similar topics into clusters
- [x] Readiness score calculator — computes Unstor's learning readiness (0–100%)
- [x] Learning metrics recorder — daily snapshot of learning health

## Backend — Kimi Parallel Support Engine
- [x] Kimi API integration (via Moonshot API) for live user responses
- [x] Kimi response router — during silent phase, all user responses served by Kimi
- [x] Kimi responses also ingested into Unstor's learning pipeline
- [x] Kimi response stored alongside user prompt for full interaction capture

## Backend — Owner Inspection Interface
- [x] Owner-only tRPC procedure: `owner.query`
- [x] Unstor responds to owner queries using its own knowledge base
- [x] Owner query history stored in `unstor_owner_queries`
- [x] Knowledge state summary endpoint for owner inspection

## Backend — Activation & Countdown
- [x] Activation config seeded with start date and 1-year activation date
- [x] Days remaining calculator (calculateDaysRemaining)
- [x] Phase detection: LEARNING | ACTIVATING | ACTIVE
- [x] Readiness score endpoint (status.getActivation)

## Frontend — Public Chat Interface
- [x] Unstor chat page with Unstor branding (avatar, name, persona)
- [x] During silent phase: Kimi answers but all responses branded as Unstor
- [x] No mention of Kimi or Manus in any user-facing interface
- [x] Message history per session stored and displayed
- [x] Typing indicator and streaming response support

## Frontend — Owner Inspection Interface
- [x] Owner-only inspection panel (accessible only when logged in as admin)
- [x] Direct query interface to probe Unstor's knowledge
- [x] Response shows: knowledge nodes matched, confidence, processing time
- [x] Owner query history log

## Frontend — Knowledge Base Explorer
- [x] Topic clusters view with frequency data
- [x] Knowledge nodes list with confidence scores and expandable detail
- [x] Search/filter by topic, category
- [x] Tabs: Nodes / Clusters

## Frontend — 1-Year Countdown & Activation Tracker
- [x] Visual countdown: days remaining until activation
- [x] Readiness score display (0–100%)
- [x] Learning phase indicator (LEARNING / ACTIVATING / ACTIVE)
- [x] Total prompts ingested counter
- [x] Knowledge nodes created counter
- [x] Progress bar on homepage

## Frontend — Admin Dashboard
- [x] Learning health metrics panel (5 stat cards)
- [x] Knowledge growth over time chart (AreaChart)
- [x] Topic distribution bar chart (BarChart)
- [x] User session list
- [x] Snapshot trigger button

## Testing
- [x] Vitest: auth.logout procedure
- [x] Vitest: Unstor identity (UNSTOR_SYSTEM_PROMPT validation)
- [x] Vitest: admin guard (non-admin rejection)
- [x] Vitest: learning pipeline utilities (calculateDaysRemaining, calculateLearningProgress)
- [x] All 13 tests passing

## Final
- [x] All routes registered in App.tsx
- [x] TypeScript compiles cleanly (0 errors)
- [x] Checkpoint saved

## Future Enhancements
- [ ] Voice input support in Chat
- [ ] Knowledge graph force-directed visualization (D3)
- [ ] Email notifications to owner on learning milestones
- [ ] Export knowledge base as JSON/CSV
- [ ] Unstor activation ceremony UI (when 365 days complete)
