import mysql from 'mysql2/promise';
import fs from 'fs';

const CATEGORY_LABELS = {
  ifa_quantum_bridge: 'Ifá & Quantum Physics Bridges',
  yoruba_language: 'Yoruba Language & Linguistics',
  traditional_medicine: 'Traditional Medicine & Herbal Knowledge',
  quantum_physics: 'Quantum Physics Explanations',
  psychology: 'Psychology & Behavioral Science',
  epigenetics: 'Epigenetics & Systems Biology',
  personal_growth: 'Personal Growth & Life Guidance',
  relationships: 'Relationships & Connection',
  health_wellness: 'Health & Wellness Integration',
  spiritual_development: 'Spiritual Development',
  financial_wisdom: 'Financial Wisdom',
  career_purpose: 'Career & Purpose',
  parenting_family: 'Parenting & Family',
  creativity_expression: 'Creativity & Expression',
  dream_interpretation: 'Dream Interpretation',
  ancestral_connection: 'Ancestral Connection',
  energy_work: 'Energy Work',
  astrology_cosmology: 'Astrology & Cosmology',
  philosophy_ethics: 'Philosophy & Ethics',
  science_spirituality: 'Science & Spirituality Bridge',
  trauma_healing: 'Trauma Healing',
  addiction_recovery: 'Addiction Recovery',
  grief_loss: 'Grief & Loss',
  anxiety_management: 'Anxiety Management',
  depression_support: 'Depression Support',
  confidence_building: 'Confidence Building',
  decision_making: 'Decision Making',
  conflict_resolution: 'Conflict Resolution',
  forgiveness_work: 'Forgiveness Work',
  gratitude_practice: 'Gratitude Practice',
  meditation_guidance: 'Meditation Guidance',
  breathwork: 'Breathwork',
  movement_practices: 'Movement Practices',
  nutrition_diet: 'Nutrition & Diet',
  sleep_optimization: 'Sleep Optimization',
  stress_management: 'Stress Management',
  time_management: 'Time Management',
  learning_education: 'Learning & Education',
  communication_skills: 'Communication Skills',
  leadership_development: 'Leadership Development',
  community_building: 'Community Building',
  environmental_awareness: 'Environmental Awareness',
  technology_humanity: 'Technology & Humanity',
  future_visioning: 'Future Visioning',
  ritual_ceremony: 'Ritual & Ceremony',
  sacred_space: 'Sacred Space',
  protection_cleansing: 'Protection & Cleansing',
  manifestation: 'Manifestation',
  shadow_work: 'Shadow Work',
  integration_wholeness: 'Integration & Wholeness',
};

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Check if already populated
  const [rows] = await conn.execute('SELECT COUNT(*) as cnt FROM prompt_templates');
  const existing = rows[0].cnt;
  if (existing > 0) {
    console.log(`Already have ${existing} prompts. Skipping.`);
    await conn.end();
    return;
  }

  const data = JSON.parse(fs.readFileSync('/home/ubuntu/okcomputer2/prompts/unstor_prompts.json', 'utf8'));

  let total = 0;
  for (const [category, prompts] of Object.entries(data)) {
    const label = CATEGORY_LABELS[category] || category.replace(/_/g, ' ');
    const batch = [];
    for (const prompt of prompts) {
      // Extract variable names from prompt text (words in {curly_braces})
      const vars = [...new Set((prompt.match(/\{([^}]+)\}/g) || []).map(v => v.slice(1, -1)))];
      batch.push([category, label, prompt, JSON.stringify(vars)]);
    }
    // Insert in chunks of 500
    for (let i = 0; i < batch.length; i += 500) {
      const chunk = batch.slice(i, i + 500);
      await conn.query(
        'INSERT INTO prompt_templates (category, categoryLabel, promptText, variables) VALUES ?',
        [chunk]
      );
    }
    total += batch.length;
    console.log(`  ✓ ${label}: ${batch.length} prompts`);
  }

  console.log(`\nTotal inserted: ${total} prompts across ${Object.keys(data).length} categories`);
  await conn.end();
}

run().catch(console.error);
