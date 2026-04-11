import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';

const conn = await createConnection(process.env.DATABASE_URL);

const content = readFileSync('/home/ubuntu/ifa_texts/Obatala.pdf.txt', 'utf8');
const now = new Date().toISOString().slice(0,19).replace('T',' ');

const [feedResult] = await conn.execute(
  'INSERT INTO unstor_knowledge_feeds (feedType, title, sourceUrl, rawContent, processedContent, status, chunkCount, nodesCreated, wordCount, tags, processedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ['text', 'Obatala — Ifá and the Spirit of the Chief of the White Cloth (Fatunmbi)', 'local://obatala-pdf-full', content.substring(0,10000), content, 'learned', 0, 0, content.split(' ').length, JSON.stringify(['Obatala','Orisha','Ifá','White Cloth','Yoruba','consciousness','awo','creation']), now, now, now]
);
const feedId = feedResult.insertId;

const chunks = [];
for (let i = 0; i < content.length; i += 3000) chunks.push(content.slice(i, i+3000));

for (let idx = 0; idx < chunks.length; idx++) {
  const nodeKey = 'ifa_f' + feedId + '_n' + idx + '_' + randomBytes(4).toString('hex');
  await conn.execute(
    'INSERT INTO unstor_knowledge_nodes (nodeKey, topic, category, summary, keywords, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [nodeKey, 'Obatala — Chief of White Cloth', 'ifa-orisha', chunks[idx], 'Obatala,White Cloth,Orisha,Ifá,Yoruba,awo,consciousness,creation,Olodumare,Esu,Oshun', now]
  );
}

await conn.execute('UPDATE unstor_knowledge_feeds SET chunkCount=?, nodesCreated=? WHERE id=?', [chunks.length, chunks.length, feedId]);

const [[{total}]] = await conn.execute('SELECT COUNT(*) as total FROM unstor_knowledge_nodes');
const [[{ftotal}]] = await conn.execute('SELECT COUNT(*) as total FROM unstor_knowledge_feeds');
console.log('Feed', feedId, 'ingested:', chunks.length, 'nodes');
console.log('Total nodes:', total, '| Total feeds:', ftotal);
await conn.end();
