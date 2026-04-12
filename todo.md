# Unstor AI — Clean Rebuild TODO

## Phase 1: Server / Database / AI Engine
- [ ] Clean schema: users table (id, name, email, passwordHash, role, createdAt)
- [ ] Clean schema: chat_sessions table (id, userId, title, createdAt)
- [ ] Clean schema: chat_messages table (id, sessionId, role, content, createdAt)
- [ ] auth.register procedure (email + name + password, bcrypt hash, JWT cookie)
- [ ] auth.login procedure (email + password, verify hash, JWT cookie)
- [ ] auth.me procedure (return current user from JWT)
- [ ] auth.logout procedure (clear cookie)
- [ ] chat.sendMessage procedure (IFA 3-pillar response via built-in LLM)
- [ ] chat.getSessions procedure (list user sessions)
- [ ] chat.getMessages procedure (get messages for a session)
- [x] Wire DeepSeek API as the LLM backend for all Unstor responses via _core/llm.ts override
- [ ] IFA engine system prompt: 3 pillars, Ese verse (Yoruba + English), ODU_QUOTE, SCI_QUOTE
- [ ] generateContextImage procedure (AI image per pillar section)

## Phase 2: Frontend
- [ ] Dark premium design system in index.css (Inter font, deep navy/indigo palette)
- [ ] Login page (/login): register/login toggle, email + password form
- [ ] Chat page (/chat): full-width response bubbles, sidebar session list
- [ ] QuoteBlock component: ODU amber block (Yoruba + English), SCI indigo block
- [ ] ExpandableContent component: collapse at 200px, fade gradient, Read more/Show less
- [ ] Per-section AI image placement with captions
- [ ] Ese verse block: Copy button, TTS button, View Odù reference link
- [ ] Protect /chat route — redirect to /login if not authenticated
- [ ] App.tsx routing: /, /login, /chat

## Phase 3: QA + Delivery
- [ ] TypeScript check: 0 errors
- [ ] Run vitest: all tests pass
- [ ] Save checkpoint
