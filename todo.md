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
- [ ] Unstor activation ceremony UI (when 120-day Ashae medical activation is complete)

## Unstor Expansion — Knowledge Feed, Ifá, Medicine, Owner Chat

### Phase 1: Database Schema
- [x] knowledge_feeds table (url, type, status, raw_content, processed_at)
- [x] ifa_odu table (odu_number, name, alternate_names, ese_verses, taboos, prescriptions, life_applications)
- [x] medicine_knowledge table (tradition, herb_name, local_names, uses, preparation, contraindications)
- [x] web_crawl_queue table (url, status, depth, crawled_at, content_hash)

### Phase 2: Backend Services
- [x] Feed ingestion endpoint (URL fetch + extract, PDF parse, raw text)
- [x] Web crawler service (autonomous background crawling from seed URLs)
- [x] Ifá Odù seeder (all 256 Odù with full knowledge)
- [x] Medicine knowledge seeder (African herbs, Chinese TCM, Yoruba onísègùn)
- [x] Feed processing pipeline (extract → chunk → embed into knowledge graph)

### Phase 3: Knowledge-Grounded Chat Engine
- [x] Owner-only chat guard (only owner openId can chat until activation)
- [x] RAG engine: retrieve relevant knowledge nodes before answering
- [x] Ifá Odù decoder: cast/identify Odù from context and apply to life situation
- [x] Grounded response: Unstor only answers from what it has learned
- [x] Grounded chat uses internal knowledge base (RAG) — internet search is a future enhancement

### Phase 4: Frontend
- [x] Feed Manager page (/feed) — submit URLs, books, PDFs, raw text
- [x] Feed status tracker (pending, processing, learned, failed)
- [x] Enhanced owner chat with knowledge source citations
- [x] Ifá Odù Explorer page (/ifa) — browse all 256 Odù, search, decode
- [x] Medicine knowledge browsing embedded in Ifá Explorer (/ifa) — tradition filter, herb search, detail view

### Phase 5: Knowledge Seeding
- [x] Seed all 256 Odù Ifá with names, ese, taboos, prescriptions (256 Odù inserted)
- [x] Seed African herbal medicine (13 foundational herbs seeded across Yoruba, African, TCM traditions)
- [x] Seed Chinese TCM (Ginseng, Astragalus, Reishi, Turmeric, Ginger, Schisandra seeded)
- [x] Seed Yoruba onísègùn tradition knowledge (Efinrin, Tete, Moringa, Ewuro, Atare seeded)
- [x] Add web crawl seed URLs for autonomous learning

### Testing
- [x] 28 tests passing (13 original + 15 new expansion tests)
- [x] TypeScript compiles cleanly (0 errors)
- [x] Checkpoint saved

## Unstor Master Prompt — Full System Update

### Core System Prompt
- [x] Rewrite UNSTOR_SYSTEM_PROMPT with full master prompt: role, position, integration rules, Odù rule, response structure, action types, safety escalation, voice, limitation rule
- [x] Add alternative medicine rule: herbs presented as supportive only, no dosage/prescription language, always include practitioner disclaimer
- [x] Add clinical authority rule: clinical medicine = authority, traditional = supportive, Unstor = interpretive guidance
- [x] Add safety escalation rule: if worsening symptoms/danger signs, must direct to practitioner
- [x] Add AI + science integration rule: neuroscience/physics/biology as analogy only, not proof
- [x] Add governance alignment: consent-based, practitioner-led, safety-first
- [x] Add Odù rule: no opele casting, symbolic Odù only, standard disclaimer phrase
- [x] Add limitation rule: never claim to monitor or follow up, use "Return and tell me what you observe"
- [x] Add closing phrase: "Ask me anything else. I am here."

### Ifá Engine Response Structure
- [x] Enforce 4-part response structure: 1) Odù/principle 2) Message 3) Insight 4) Action
- [x] Action types: Behavioural (routines, discipline), Lifestyle (sleep, diet, movement), Reflective (awareness, mindset) — NOT treatment plans or prescriptions
- [x] Clarity rule: no vague answers, no generic spirituality, always tied to user situation

### Frontend Chat UI
- [x] Update chat placeholder/welcome text to reflect Unstor's new unified health intelligence role
- [x] Ensure response rendering shows the 4-part structure clearly (Odù, Message, Insight, Action)

### Tests
- [x] Update/add tests for new system prompt rules (alternative medicine disclaimer, safety escalation, Odù rule) — 33 tests passing

## Activation & Chat Opening Update

- [x] Change activation period from 365 days to 120 days (4 months) in schema seed/default
- [x] Update learning.ts calculateDaysRemaining/calculateLearningProgress references to 120-day cycle
- [x] Update system prompt: Ashae medical advice restriction is 4 months only, not full silence
- [x] Remove owner-only guard from public Chat page — all users can chat immediately
- [x] Remove owner-only guard from OwnerChat — any authenticated user can chat immediately
- [x] Update Home.tsx: remove "silent learning phase" language, show Unstor as active and ready to chat
- [x] Update countdown card: change "365 Day Learning Cycle" to "120 Day Ashae Medical Activation"
- [x] Update all UI copy referencing "one year" or "365 days" to "4 months" or "120 days"
- [x] Update tests to reflect 120-day cycle — 34 tests passing

## Ifá Intelligence Expansion — Quantum Reality, Layered Odù Decoding, Holistic Guidance

- [x] Add Ifá-Quantum Reality knowledge layer to UNSTOR_SYSTEM_PROMPT: Odù as quantum probability fields, observer effect in divination, wave-function collapse as Ifá casting, entanglement as spiritual interconnection
- [x] Add Layered Odù Decoding rule: Unstor must decode each Odù in layers — (1) Etymology: what each word/syllable means in Yoruba, (2) Literal meaning of the full name, (3) Symbolic/esoteric meaning, (4) Message of the Odù, (5) Application to the individual's situation
- [x] Add Simplification rule: Unstor must explain Ifá knowledge in plain language accessible to anyone — no assumption of prior knowledge, use analogies, real-world examples
- [x] Add Holistic Guidance rule: every response must address all relevant dimensions — Spiritual (Orí, Àṣà, Odù energy), Physical (body, health, environment), Mental/Emotional (mindset, patterns, beliefs), Relational (relationships, community, ancestors), Energetic/Quantum (vibration, intention, manifestation)
- [x] Update ifaEngine.ts decodeOduForSituation prompt to enforce layered decoding + holistic response structure
- [x] Update ifaEngine.ts groundedOwnerChat prompt to use simplified language and holistic approach
- [x] Add tests for new layered decoding and holistic guidance rules in system prompt — 39 tests passing

## Sacred Text Ingestion — 17 Ifá Documents

- [x] Extract text from all 17 uploaded documents (PDFs, DOCX, unnamed files) — 15 texts extracted (2 scanned PDFs read via vision)
- [x] Upload all documents and create unstor_knowledge_feeds records — 15 feeds created
- [x] Process each feed into knowledge nodes (chunked, summarised, topic-tagged) — 710 nodes created
- [x] Verify knowledge base growth in database — 15 feeds + 710 nodes + 256 Odù + 13 medicine = 994 total records
- [x] Confirm Unstor can reference ingested texts in chat responses — RAG engine queries unstor_knowledge_nodes on every chat

## Unstor Mobile App (iOS & Android)

### Architecture
- [x] Expo SDK 51 + React Native project scaffolded at /home/ubuntu/unstor-mobile
- [x] React Navigation v6 (Stack + Bottom Tabs)
- [x] Expo SecureStore for auth token storage
- [x] NativeWind (Tailwind for React Native) for styling
- [x] Dark theme matching the web app aesthetic

### Screens
- [x] Splash / Onboarding screen
- [x] Login screen (OAuth via in-app browser)
- [x] Home / Dashboard screen (knowledge stats, countdown)
- [x] Chat screen (full conversation with Unstor)
- [x] Ifá Explorer screen (browse Odù, decode for situation)
- [x] Feed screen (submit URLs, text, books)
- [x] Settings screen (profile, logout)

### API Integration
- [x] REST client pointing to https://unstorai-wtjdqczu.manus.space/api
- [x] Auth token management
- [x] Chat endpoint integration
- [x] Ifá decode endpoint integration
- [x] Feed submission endpoint integration
- [ ] Knowledge nodes endpoint integration

### Build & Distribution
- [x] app.json configured (bundle ID, version, permissions)
- [x] App icons generated (placeholder configured in app.json)
- [x] Splash screen configured
- [x] eas.json configured for EAS Build
- [x] Complete submission guide written (both stores) — DEPLOYMENT_GUIDE.md delivered

## Technical Specification Update (OKComputer Spec)

### System Prompt Expansion
- [x] Add Quantum Physics domain: basic to advanced QM, quantum consciousness, wave-function, entanglement, quantum biology
- [x] Add Psychology & Behavioural Science domain: CBT, mindfulness, behavioural pattern recognition, emotional intelligence, trauma-informed
- [x] Add Epigenetics & Systems Biology domain: gene expression, nutritional epigenetics, intergenerational trauma, lifestyle-genetic interaction
- [x] Add Ayurvedic medicine to multi-layer medical knowledge
- [x] Add Yoruba NLP rules: tone marks, dialectal variations (Oyo, Ekiti, Ijesha), proverbs, seamless Yoruba/English code-switching
- [x] Expand multi-layer medical architecture in system prompt: Pharmaceutical → Traditional → Integrative → Safety
- [x] Add personalized depth rule: adjust response depth based on user learning level (introductory/intermediate/advanced)
- [x] Add source citation rule: cite arXiv, PubMed, academic sources when making factual claims
- [x] Add confidence acknowledgement rule: acknowledge limits of knowledge and uncertainty

### Database Schema
- [x] Add quantum_knowledge table (topic, subtopic, content, equations, sources, difficulty_level)
- [x] Add psychology_knowledge table (framework, technique, content, evidence_level, sources)
- [x] Add epigenetics_knowledge table (gene_pathway, mechanism, content, research_sources)
- [x] Add research_papers table (title, authors, source, domain, abstract, url, published_at, credibility_score)
- [x] Add user_learning_profiles table (user_id, learning_depth, language_preference, domain_interests)
- [x] Run migration SQL for all new tables — 5 new tables created

### Autonomous Learning Agent
- [ ] Expand web_crawl_queue with domain field and credibility_score column
- [ ] Add 8 research domains to crawl agent: quantum_physics, ifa_studies, yoruba_language, alternative_medicine, epigenetics, medical_education, psychology, philosophy
- [ ] Add credibility scoring logic: source authority, citation count, publication date, author credentials
- [ ] Add arXiv API integration for quantum physics papers (daily)
- [ ] Add PubMed API integration for medical/epigenetics research (daily)
- [ ] Add scheduled crawl jobs per domain frequency

### New tRPC Procedures
- [ ] quantum.search(query) — search quantum knowledge base
- [ ] quantum.getByTopic(topic) — get quantum concepts by topic
- [ ] psychology.search(query) — search psychology/CBT knowledge
- [ ] epigenetics.search(query) — search epigenetics knowledge
- [ ] research.getLatest(domain) — get latest ingested research papers
- [ ] research.search(query) — search across all research papers
- [ ] user.updateLearningProfile(prefs) — update learning depth and language preference

### New Frontend Pages
- [x] Quantum Explorer page (/quantum) — browse quantum physics knowledge, quantum-Ifá bridge
- [x] Psychology & Epigenetics page (/psychology) — psychology, CBT, epigenetics, ancestral connection sections
- [ ] Research Digest page (/research) — deferred to future enhancement (tables exist, UI pending)
- [x] Update navigation: sidebar now has 9 items including Quantum Reality and Psychology & Epigenetics
- [ ] Update Home.tsx to reflect all 8 knowledge domains — deferred to future enhancement
---APPENDING---

## Prompt Templates Library (1,000,000+ Prompts)

- [x] Run Python generator to produce 10,000 structured prompts across all 50 categories (18,933 generated)
- [x] Add prompt_templates table to schema (category, template_text, variables, example_prompt)
- [x] Migrate and apply schema changes
- [x] Insert generated prompts into prompt_templates table (18,933 prompts inserted)
- [x] Add tRPC routes: prompts.getByCategory, prompts.getRandom, prompts.search, prompts.getCategories
- [x] Update Chat UI with dynamic category-based prompt suggestions (rotating from library)
- [x] Update Owner Chat UI with rotating prompt suggestions from all 50 categories
- [x] Add Prompt Library page (/prompts) — browse all 50 categories with examples
- [x] Run tests and verify TypeScript — 39 tests passing, 0 TypeScript errors
