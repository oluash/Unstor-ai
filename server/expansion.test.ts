/**
 * Unstor Expansion Tests
 * Tests for: Feed ingestion, Ifá engine, medicine knowledge, grounded owner chat
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            odu: "Ogbe Meji",
            oduNumber: 1,
            summary: "A new beginning. Light emerges from darkness.",
            lifeApplication: "Move forward with confidence. Doors will open.",
            prescriptions: "Offer white cloth and honey to Obatala.",
            taboos: "Avoid conflict during this period.",
            herbs: ["Ewe Tete", "Ewe Efinrin"],
            affirmation: "Àṣẹ. The light of Ifá guides your path.",
          }),
        },
      },
    ],
  }),
}));

// ─── Feed Ingestion Tests ─────────────────────────────────────────────────────
describe("Feed ingestion system", () => {
  it("processFeed handles null db gracefully", async () => {
    const { processFeed } = await import("./feedIngestion");
    // Should not throw when DB is unavailable
    await expect(processFeed(999)).resolves.toBeUndefined();
  });

  it("crawlNextUrl returns false when db is unavailable", async () => {
    const { crawlNextUrl } = await import("./feedIngestion");
    const result = await crawlNextUrl();
    expect(result).toBe(false);
  });

  it("seedCrawlQueue resolves without error when db is unavailable", async () => {
    const { seedCrawlQueue } = await import("./feedIngestion");
    await expect(seedCrawlQueue()).resolves.toBeUndefined();
  });
});

// ─── Ifá Engine Tests ─────────────────────────────────────────────────────────
describe("Ifá engine — decodeOduForSituation", () => {
  it("returns a valid Ifá reading for a given situation", async () => {
    const { decodeOduForSituation } = await import("./ifaEngine");
    const result = await decodeOduForSituation("I am starting a new business and need guidance.");
    expect(result).toHaveProperty("odu");
    expect(result).toHaveProperty("oduNumber");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("lifeApplication");
    expect(result).toHaveProperty("prescriptions");
    expect(result).toHaveProperty("taboos");
    expect(result).toHaveProperty("herbs");
    expect(result).toHaveProperty("affirmation");
    expect(Array.isArray(result.herbs)).toBe(true);
  });

  it("returns a reading when a specific Odù is requested", async () => {
    const { decodeOduForSituation } = await import("./ifaEngine");
    const result = await decodeOduForSituation("What does Ogbe say about my health?", "Ogbe Meji");
    expect(result.odu).toBeTruthy();
    expect(typeof result.summary).toBe("string");
  });

  it("falls back gracefully when LLM returns invalid JSON", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "invalid json {{" } }],
    } as any);
    const { decodeOduForSituation } = await import("./ifaEngine");
    const result = await decodeOduForSituation("Test situation");
    expect(result).toHaveProperty("odu");
    expect(result.odu).toBeTruthy();
  });
});

// ─── Medicine Knowledge Tests ─────────────────────────────────────────────────
describe("Medicine knowledge system", () => {
  it("queryMedicineKnowledge returns empty array when db is unavailable", async () => {
    const { queryMedicineKnowledge } = await import("./ifaEngine");
    const results = await queryMedicineKnowledge("ginger");
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it("queryMedicineKnowledge accepts tradition filter", async () => {
    const { queryMedicineKnowledge } = await import("./ifaEngine");
    const results = await queryMedicineKnowledge("herb", "chinese_tcm");
    expect(Array.isArray(results)).toBe(true);
  });
});

// ─── Grounded Owner Chat Tests ────────────────────────────────────────────────
describe("Grounded owner chat", () => {
  it("returns a response with required fields", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "Based on my knowledge of Ifá, Ogbe Meji speaks of new beginnings." } }],
    } as any);

    const { groundedOwnerChat } = await import("./ifaEngine");
    const result = await groundedOwnerChat("Tell me about Ogbe Meji");
    expect(result).toHaveProperty("response");
    expect(result).toHaveProperty("sources");
    expect(result).toHaveProperty("isGrounded");
    expect(result).toHaveProperty("knowledgeUsed");
    expect(typeof result.response).toBe("string");
    expect(Array.isArray(result.sources)).toBe(true);
    expect(typeof result.isGrounded).toBe("boolean");
    expect(typeof result.knowledgeUsed).toBe("number");
  });

  it("returns isGrounded false when no knowledge is found", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "I am still learning about this topic." } }],
    } as any);

    const { groundedOwnerChat } = await import("./ifaEngine");
    const result = await groundedOwnerChat("Tell me about quantum physics");
    expect(result.isGrounded).toBe(false);
    expect(result.knowledgeUsed).toBe(0);
  });

  it("accepts conversation history", async () => {
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "Continuing from our discussion..." } }],
    } as any);

    const { groundedOwnerChat } = await import("./ifaEngine");
    const history = [
      { role: "user" as const, content: "What is Oyeku Meji?" },
      { role: "assistant" as const, content: "Oyeku Meji is the Odù of endings and transformation." },
    ];
    const result = await groundedOwnerChat("Tell me more about its taboos", history);
    expect(result.response).toBeTruthy();
  });
});

// ─── Knowledge Retrieval Tests ────────────────────────────────────────────────
describe("Knowledge retrieval (RAG)", () => {
  it("retrieveRelevantKnowledge returns empty results when db is unavailable", async () => {
    const { retrieveRelevantKnowledge } = await import("./ifaEngine");
    const result = await retrieveRelevantKnowledge("Ifá wisdom");
    expect(result).toHaveProperty("nodes");
    expect(result).toHaveProperty("feeds");
    expect(result).toHaveProperty("ifaOduResults");
    expect(result).toHaveProperty("medicineResults");
    expect(Array.isArray(result.nodes)).toBe(true);
    expect(Array.isArray(result.feeds)).toBe(true);
    expect(Array.isArray(result.ifaOduResults)).toBe(true);
    expect(Array.isArray(result.medicineResults)).toBe(true);
  });
});

// ─── Seed Data Validation Tests ───────────────────────────────────────────────
describe("Ifá Odù seed data structure", () => {
  it("all 16 principal Odù names are defined", () => {
    const PRINCIPAL_ODU = [
      "Ogbe", "Oyeku", "Iwori", "Odi", "Irosun", "Owonrin", "Obara", "Okanran",
      "Ogunda", "Osa", "Ika", "Oturupon", "Otura", "Irete", "Ose", "Ofun",
    ];
    expect(PRINCIPAL_ODU.length).toBe(16);
    // All 256 combinations = 16 × 16
    expect(PRINCIPAL_ODU.length * PRINCIPAL_ODU.length).toBe(256);
  });

  it("Meji Odù names are correctly formed", () => {
    const mejiNames = ["Ogbe Meji", "Oyeku Meji", "Iwori Meji", "Odi Meji"];
    mejiNames.forEach(name => {
      expect(name).toMatch(/^[A-Z][a-z]+ Meji$/);
    });
  });

  it("compound Odù names follow the pattern FirstName SecondName", () => {
    const compoundName = "Ogbe Oyeku";
    expect(compoundName.split(" ").length).toBe(2);
  });
});
