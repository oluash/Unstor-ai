/**
 * Ingest all 17 Ifá sacred texts into Unstor's knowledge base.
 * Uses the correct unstor_knowledge_feeds and unstor_knowledge_nodes schemas.
 * id columns are AUTO_INCREMENT ints — do NOT insert them manually.
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
dotenv.config({ path: "/home/ubuntu/unstor-ai/.env" });

const mysql = require("mysql2/promise");

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error("DATABASE_URL not set");

const url = new URL(DB_URL);
const db = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port || "3306"),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

console.log("Connected to database.");

const DOCUMENTS = [
  { title: "Egbe: About the Traditional African Spiritual System of Ifa", file: "egbe-about-the-traditional-african-spiritual-system-of-ifa-080715.pdf.txt", tags: ["ifa-system","egbe","african-spirituality","yoruba"], category: "ifa-foundation" },
  { title: "The Oral History of the Irumole", file: "Theoralhistoryoftheirumole.pdf.txt", tags: ["irumole","oral-history","ifa-cosmology","yoruba-deities"], category: "ifa-cosmology" },
  { title: "Odu Ifa Signos", file: "OduIfaSignos.txt", tags: ["odu-ifa","ifa-signs","divination","256-odu"], category: "odu-ifa" },
  { title: "Esu Elegba: Ifa and the Divine Messenger by Awo Falokun Fatunmbi", file: "Awo_Falokun_Esu_Elegba.txt", tags: ["esu","elegba","divine-messenger","ifa-theology","orisa"], category: "orisa-esu" },
  { title: "Oriki Esu", file: "Orikiesu.pdf.txt", tags: ["esu","oriki","praise-poetry","invocation"], category: "orisa-esu" },
  { title: "Ifa of the Year 2022", file: "IFAOFTHEYEAR2022copy.pdf.txt", tags: ["ifa-of-the-year","annual-ifa","prophecy","2022"], category: "ifa-prophecy" },
  { title: "Obatala: The Orisa of Creation", file: "Obatala_doc.txt", tags: ["obatala","orisa","creation","purity","ifa-deities"], category: "orisa-obatala" },
  { title: "Notes on Ifa Deities", file: "NotesonIfaDeities.pdf.txt", tags: ["ifa-deities","orisa","yoruba-religion","theology"], category: "ifa-deities" },
  { title: "The Ifa Concept of Esu in the Universe", file: "The-Ifa-Concept-of-Esu-in-the-Universe.pdf.txt", tags: ["esu","ifa-cosmology","universe","divine-messenger"], category: "orisa-esu" },
  { title: "Orishas: The Ultimate Guide to African Orisha Deities by Mari Silva", file: "Orishas_MariSilva.txt", tags: ["orisa","yoruba-deities","santeria","voodoo","hoodoo","african-diaspora"], category: "orisa-guide" },
  { title: "What is Ifa by Babalawo Obanifa", file: "What-is-Ifa-by-Babalawo-Obanifa.pdf.txt", tags: ["ifa-introduction","babalawo","ifa-system","divination"], category: "ifa-foundation" },
  { title: "Babalawo: Santeria's High Priests by Frank Baba Eyiogbe", file: "Babalawo_SanteriasHighPriestsFathersoftheSecretsinAfro-CubanIfabyEyiogbe_FrankBa.txt", tags: ["babalawo","santeria","afro-cuban-ifa","initiation","priesthood"], category: "ifa-priesthood" },
  { title: "Ifa: A Forest of Mystery by Nicholaj De Mattos Frisvold", file: "Ifa_Forest_of_Mystery.txt", tags: ["ifa-mystery","ifa-philosophy","esoteric-ifa","odu-wisdom"], category: "ifa-philosophy" },
  { title: "Inner Peace: The Ifa Concept of Ori by Awo Falokun Fatunmbi", file: "InnerPeaceTheIfaConceptofOribyAwoFalokunFatunmbi_z-lib.pdf.txt", tags: ["ori","inner-peace","ifa-psychology","destiny","ayanmo"], category: "ifa-ori" },
  { title: "Esu Elegbara: Chance and Uncertainty in Yoruba Mythology by Ayodele Ogundipe", file: "EsuElegbaraChance_UncertainlyinYorubaMythology_AyodeleOgundipe__z-lib.org_.txt", tags: ["esu-elegbara","chance","uncertainty","yoruba-mythology","trickster"], category: "orisa-esu" },
];

const TEXT_DIR = "/home/ubuntu/ifa_texts";
const CHUNK_SIZE = 3000;

function chunkText(text, size = CHUNK_SIZE) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + size, text.length);
    if (end < text.length) {
      const lastNewline = text.lastIndexOf("\n\n", end);
      if (lastNewline > i + size * 0.5) end = lastNewline + 2;
    }
    const chunk = text.slice(i, end).trim();
    if (chunk.length > 100) chunks.push(chunk);
    i = end;
  }
  return chunks;
}

function extractKeywords(text) {
  const terms = ["Ifa","Orunmila","Esu","Elegba","Obatala","Ogun","Osun","Sango","Yemoja","Odu","Babalawo","divination","Orisa","Ori","awo","ebo","iwa-pele","Ogbe","Oyeku","Iwori","Odi","Irosun","Owonrin","Obara","Okanran","Ogunda","Osa","Ika","Oturupon","Otura","Irete","Ose","Ofun","ese","taboo","prescription","offering","destiny","ayanmo","Yoruba","Nigeria","Africa","medicine","herb","healing"];
  return [...new Set(terms.filter(t => text.toLowerCase().includes(t.toLowerCase())))].slice(0, 10);
}

let totalFeeds = 0;
let totalNodes = 0;

for (const doc of DOCUMENTS) {
  const filePath = path.join(TEXT_DIR, doc.file);
  if (!fs.existsSync(filePath)) { console.log(`SKIP (missing): ${doc.title}`); continue; }

  const text = fs.readFileSync(filePath, "utf-8");
  if (text.length < 100) { console.log(`SKIP (too short): ${doc.title}`); continue; }

  const wordCount = text.split(/\s+/).length;
  console.log(`\nIngesting: ${doc.title}`);
  console.log(`  ${text.length.toLocaleString()} chars, ~${wordCount.toLocaleString()} words`);

  // Use MySQL datetime string format for timestamp columns
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

  // Insert feed record — id is AUTO_INCREMENT, do not include it
  // createdAt and updatedAt have DEFAULT CURRENT_TIMESTAMP so we can omit them
  const [feedResult] = await db.execute(
    `INSERT INTO unstor_knowledge_feeds 
     (feedType, title, sourceUrl, rawContent, processedContent, status, 
      chunkCount, nodesCreated, wordCount, tags, submittedBy, processedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "text",
      doc.title,
      `ifa-sacred-text://${doc.file}`,
      text.slice(0, 16000000),
      text.slice(0, 16000000),
      "learned",
      0,
      0,
      wordCount,
      JSON.stringify(doc.tags),
      "system-ingestion",
      nowStr,
    ]
  );

  const feedId = feedResult.insertId;
  totalFeeds++;

  const chunks = chunkText(text);
  console.log(`  Creating ${chunks.length} knowledge nodes...`);

  let nodesCreated = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const nodeKey = `ifa_f${feedId}_n${i}_${Date.now().toString(36)}`;
    const summary = chunk.slice(0, 500).replace(/\n/g, " ").trim();
    const keywords = extractKeywords(chunk);
    const nowStr2 = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
      await db.execute(
        `INSERT INTO unstor_knowledge_nodes
         (nodeKey, topic, category, summary, frequency, confidenceScore, 
          relatedPromptIds, keywords, examples, lastSeenAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nodeKey,
          doc.tags[0] || "ifa-knowledge",
          doc.category,
          summary,
          1,
          0.95,
          JSON.stringify([String(feedId)]),
          JSON.stringify(keywords),
          JSON.stringify([{ source: doc.title, excerpt: chunk.slice(0, 200) }]),
          nowStr2,
        ]
      );
      nodesCreated++;
      totalNodes++;
    } catch (e) {
      if (!e.message.includes("Duplicate")) {
        console.error(`  Node error: ${e.message.slice(0, 100)}`);
      }
    }

    if ((i + 1) % 20 === 0) process.stdout.write(`  [${i + 1}/${chunks.length}]\n`);
  }

  await db.execute(
    `UPDATE unstor_knowledge_feeds SET chunkCount=?, nodesCreated=? WHERE id=?`,
    [chunks.length, nodesCreated, feedId]
  );

  console.log(`  Done: ${nodesCreated} nodes created (feed id=${feedId})`);
}

await db.end();

console.log("\n" + "=".repeat(60));
console.log("INGESTION COMPLETE");
console.log(`  Feeds created: ${totalFeeds}`);
console.log(`  Knowledge nodes created: ${totalNodes}`);
console.log("=".repeat(60));
