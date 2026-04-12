# Contributing to Unstor AI

Thank you for your interest in contributing to Unstor AI. This project combines Ifá wisdom, quantum science, and modern AI — contributions that deepen any of these dimensions are welcome.

---

## Ways to Contribute

There are several meaningful ways to contribute:

**Knowledge contributions** are among the most valuable. If you are an Ifá scholar, Babalawo, or Yoruba language expert, you can contribute accurate Ese verses, correct translations, taboo lists, or prescriptions for any of the 256 Odù. Submit these as JSON files in `server/seeds/odu/` following the existing schema.

**Code contributions** follow the standard fork-and-PR workflow described below. The codebase is TypeScript end-to-end (React + Express + tRPC), so familiarity with these is helpful.

**Research contributions** involve adding new knowledge sources to the feed ingestion pipeline — academic papers, traditional medicine databases, or environmental science datasets that align with Unstor's three-pillar framework.

**Bug reports and feature requests** can be submitted as GitHub Issues using the provided templates.

---

## Development Setup

Follow the [Getting Started](./README.md#getting-started) guide in the README to set up your local environment. The key commands are:

```bash
pnpm install       # Install dependencies
pnpm dev           # Start development server (http://localhost:3000)
pnpm test          # Run the test suite
pnpm drizzle-kit generate  # Generate migration SQL after schema changes
```

---

## Code Style

The project uses TypeScript strictly throughout. Key conventions to follow:

- All backend logic lives in tRPC procedures in `server/routers.ts` (or split into `server/routers/` for larger features). Never add raw Express routes for application logic.
- Database queries belong in `server/db.ts` as named helper functions. Procedures call helpers; they do not write raw SQL inline.
- Frontend data fetching uses `trpc.*.useQuery/useMutation` exclusively. Do not introduce Axios or raw fetch wrappers.
- All timestamps are stored as UTC Unix milliseconds. Display conversion to local time happens only in React components.
- Secrets and API keys never appear in client-side code. All LLM and image generation calls are server-side only.

---

## Pull Request Process

1. Fork the repository and create a branch from `main` named `feature/your-feature` or `fix/your-bug`.
2. Write or update Vitest tests in `server/*.test.ts` for any server-side logic you add or change.
3. Run `pnpm test` and `npx tsc --noEmit` and confirm both pass with zero errors before opening a PR.
4. Open a pull request with a clear description of what changed and why. Reference any related issues.
5. A maintainer will review within 5 business days. Feedback will be given as inline comments on the PR.

---

## Ifá Knowledge Guidelines

Contributions to the Ifá corpus must follow these principles:

- Ese verses must be presented with the Yoruba original first, followed by an accurate English translation. Do not paraphrase the verse — translate it faithfully.
- Taboos (eewo) and prescriptions (ebo) must be sourced from verifiable Ifá tradition. Cite the source (Babalawo name, lineage, or published corpus reference) in the PR description.
- Do not conflate Odù from different lineages without clearly noting the distinction. The Yoruba Ifá corpus and the Cuban Lucumí/Santería corpus differ in important ways.
- Treat the corpus with the same scholarly rigour you would apply to any UNESCO-recognised cultural heritage.

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License that covers this project.
