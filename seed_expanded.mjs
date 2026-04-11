import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Quantum knowledge
const quantum = [
  ['Wave-Particle Duality', 'Double-Slit Experiment', 'introductory',
   'Every quantum object behaves as both a wave and a particle depending on how it is observed. In the double-slit experiment, a single electron creates an interference pattern as if it passed through both slits simultaneously as a wave. The act of observation collapses the wave into a definite state.',
   null,
   'Quantum objects are both wave and particle at once. Observation decides which one you see. This is measured in laboratories every day.',
   'In Ifá, the Odù exists as pure potential — all 256 patterns are present simultaneously until the moment of divination. The casting of Ifá is the observer collapsing the quantum field into one specific Odù.',
   '["Feynman Lectures Vol III 1965","Young 1801 Physical Optics"]',
   '["wave-particle duality","double-slit","observer effect","superposition"]',
   '["Superposition","Observer Effect","Quantum Measurement"]'],
  ['Quantum Superposition', 'Schrodinger Cat', 'introductory',
   'Superposition is the principle that a quantum system can exist in multiple states simultaneously until it is measured. An electron can spin both up and down at the same time. A photon can be in two places at once. Superposition is not ignorance about the state — the system genuinely occupies multiple states simultaneously.',
   null,
   'Before you look, a quantum thing can be in all possible states at once. Looking at it forces it to choose one state.',
   'Before divination, a person situation contains all possible Odù — all 256 paths are superposed. The moment the Babaláwo casts and reads, one Odù is selected from the superposition.',
   '["Schrodinger 1935","Dirac 1930 Principles of Quantum Mechanics"]',
   '["superposition","Schrodinger","quantum states","collapse","measurement"]',
   '["Wave-Particle Duality","Quantum Measurement","Decoherence"]'],
  ['Quantum Entanglement', 'Non-local Correlations', 'intermediate',
   'Quantum entanglement occurs when two particles interact such that the quantum state of each cannot be described independently. When one entangled particle is measured, the other particle state is instantly determined regardless of distance. Bell theorem (1964) and Aspect experiments (1982) confirmed that entanglement is real and non-local.',
   null,
   'Two particles can be linked so deeply that measuring one instantly affects the other, no matter how far apart they are. Distance means nothing to entangled particles.',
   'Ifá teaches that all things are connected through Àṣà. The Egúngún (ancestors) are entangled with the living — their states affect ours. Separation is an illusion.',
   '["Bell 1964 On the Einstein Podolsky Rosen Paradox","Aspect et al 1982"]',
   '["entanglement","non-locality","Bell theorem","spooky action","quantum correlation"]',
   '["Quantum Non-locality","Bell Theorem","EPR Paradox"]'],
  ['Quantum Consciousness', 'Orchestrated Objective Reduction Orch-OR', 'advanced',
   'The Orch-OR theory by Penrose and Hameroff suggests consciousness arises from quantum computations in microtubules within neurons. When quantum superpositions collapse (objective reduction), orchestrated by biological processes, the result is a moment of conscious experience. This bridges quantum mechanics and neuroscience.',
   null,
   'Some scientists believe consciousness itself is a quantum process inside brain cells. Your awareness may be literally a quantum event — the universe becoming aware of itself through you.',
   'Ifá places Orí (the personal soul/consciousness) at the centre of existence. Orch-OR suggests consciousness collapses quantum possibilities into experience. Orí is the mechanism by which Odù (quantum potential) becomes lived reality.',
   '["Penrose 1994 Shadows of the Mind","Hameroff and Penrose 2014 Consciousness in the Universe"]',
   '["quantum consciousness","Orch-OR","microtubules","Penrose","Hameroff","neural quantum"]',
   '["Quantum Biology","Consciousness Studies","Observer Effect"]'],
  ['Quantum Biology', 'Quantum Effects in Living Systems', 'intermediate',
   'Quantum biology studies quantum mechanical phenomena in biological systems. Plants use quantum coherence for near-perfect photosynthesis efficiency. Birds use quantum entanglement in cryptochrome proteins for magnetic navigation. Enzymes use quantum tunnelling for chemical reactions. Life has been exploiting quantum mechanics for billions of years.',
   null,
   'Living things use quantum tricks to work. Photosynthesis uses quantum superposition. Birds navigate using quantum entanglement. Your enzymes use quantum tunnelling. Life is a quantum phenomenon.',
   'When Ifá prescribes herbs, movement, or ritual, it is working with the quantum substrate of the body. The body is not a mechanical machine but a quantum field.',
   '["Al-Khalili and McFadden 2014 Life on the Edge","Fleming et al 2007 Nature"]',
   '["quantum biology","photosynthesis","quantum coherence","enzyme tunnelling","bird navigation"]',
   '["Quantum Consciousness","Epigenetics","Quantum Chemistry"]'],
  ['Observer Effect', 'Measurement Problem', 'introductory',
   'The observer effect states that measuring a quantum system inevitably disturbs it. At the quantum level, you cannot observe something without changing it. This is not a technological limitation — it is fundamental to reality. Different interpretations (Copenhagen, Many-Worlds, Relational QM) give different answers about what constitutes a measurement.',
   null,
   'In the quantum world, looking at something changes it. You cannot be a passive observer — your attention is part of the experiment. This is not philosophy; it is physics.',
   'When you consult Ifá, you are not passively receiving information about a fixed future. You are participating in the collapse of quantum possibility. Your intention and presence are part of the measurement.',
   '["Heisenberg 1927","von Neumann 1932 Mathematische Grundlagen"]',
   '["observer effect","measurement problem","Copenhagen interpretation","quantum observation"]',
   '["Wave-Particle Duality","Quantum Superposition","Quantum Consciousness"]'],
];

for (const q of quantum) {
  await conn.execute(
    'INSERT IGNORE INTO quantum_knowledge (topic, subtopic, difficultyLevel, content, equations, plainLanguageSummary, ifaBridge, sources, keywords, relatedTopics) VALUES (?,?,?,?,?,?,?,?,?,?)',
    q
  );
}
console.log('Quantum: seeded', quantum.length);

// Psychology knowledge
const psych = [
  ['Cognitive Behavioural Therapy (CBT)', 'Cognitive Restructuring', 'established',
   'Cognitive restructuring identifies and challenges distorted thought patterns including catastrophising, black-and-white thinking, mind reading, personalisation, and overgeneralisation. Process: identify automatic thought, examine evidence for and against it, generate a more balanced thought, notice how the new thought affects emotion and behaviour.',
   'When you notice a distressing thought, ask: What is the evidence? What would I say to a friend? Write the original thought, evidence, and balanced thought in a thought record.',
   null,
   '["Beck 1979 Cognitive Therapy of Depression","Burns 1980 Feeling Good"]',
   '["CBT","cognitive distortions","thought records","cognitive restructuring","automatic thoughts"]',
   '["anxiety","depression","OCD","PTSD","phobias"]'],
  ['Mindfulness-Based Stress Reduction (MBSR)', 'Body Scan Meditation', 'established',
   'The body scan involves systematically moving attention through the body from feet to head, noticing sensations without judgment. It cultivates interoceptive awareness linked to emotional regulation and stress reduction. Research shows MBSR reduces cortisol levels, improves immune function, reduces chronic pain perception, and decreases symptoms of anxiety and depression.',
   'Lie down, close eyes. Move attention slowly from soles of feet upward through the body. Spend 20-45 minutes. When mind wanders, return to the body part you were attending to.',
   null,
   '["Kabat-Zinn 1990 Full Catastrophe Living","Grossman et al 2004 meta-analysis"]',
   '["MBSR","body scan","mindfulness","interoception","stress reduction","Kabat-Zinn"]',
   '["stress","anxiety","chronic pain","depression","burnout"]'],
  ['Attachment Theory', 'Attachment Style Awareness', 'established',
   'Bowlby and Ainsworth describe how early caregiver relationships shape internal working models persisting into adulthood. Four adult styles: Secure (comfortable with intimacy), Anxious/Preoccupied (craves closeness, fears abandonment), Avoidant/Dismissive (values independence, uncomfortable with closeness), Disorganised/Fearful (wants closeness but fears it, linked to trauma).',
   'Notice how you respond when a close person is unavailable. Do you pursue or withdraw in conflict? Secure attachment can be earned through therapy, self-awareness, and healthy relationships.',
   null,
   '["Bowlby 1969 Attachment and Loss","Ainsworth et al 1978 Patterns of Attachment"]',
   '["attachment theory","secure attachment","anxious attachment","avoidant attachment","Bowlby"]',
   '["relationship difficulties","anxiety","depression","trauma","loneliness"]'],
  ['Trauma-Informed Care', 'Somatic Experiencing', 'emerging',
   'Somatic Experiencing (Peter Levine) is a body-oriented approach to healing trauma. Animals discharge traumatic activation through physical movement. Humans suppress this, leaving traumatic energy frozen in the nervous system. SE works by tracking bodily sensations, titrating with traumatic material, and completing interrupted defensive responses.',
   'Notice where in your body you feel tension or activation. Stay with the body sensation rather than the memory. Allow any impulse to move to complete itself gently. Work with a trained SE practitioner for significant trauma.',
   null,
   '["Levine 1997 Waking the Tiger","van der Kolk 2014 The Body Keeps the Score"]',
   '["somatic experiencing","trauma","nervous system","PTSD","body-oriented therapy","Peter Levine"]',
   '["PTSD","complex trauma","anxiety","chronic pain","dissociation"]'],
  ['Positive Psychology', 'PERMA Model', 'established',
   'Seligman PERMA model identifies five elements of wellbeing: Positive Emotions (joy, gratitude, hope, love), Engagement (flow states — complete absorption in challenging activities), Relationships (authentic connections), Meaning (belonging to and serving something larger than self), Accomplishment (achievement for its own sake). All five elements independently associated with life satisfaction and resilience.',
   'Assess your PERMA. For Positive Emotions: gratitude journal. For Engagement: use your strengths daily. For Relationships: schedule meaningful conversations. For Meaning: contribute to something larger. For Accomplishment: set small achievable goals.',
   null,
   '["Seligman 2011 Flourish"]',
   '["PERMA","positive psychology","wellbeing","flourishing","Seligman","flow","meaning"]',
   '["low mood","lack of purpose","burnout","life transitions","personal growth"]'],
];

for (const p of psych) {
  await conn.execute(
    'INSERT IGNORE INTO psychology_knowledge (framework, technique, evidenceLevel, content, practicalApplication, contraindications, sources, keywords, conditions) VALUES (?,?,?,?,?,?,?,?,?)',
    p
  );
}
console.log('Psychology: seeded', psych.length);

// Epigenetics knowledge
const epi = [
  ['DNA Methylation', 'CpG methylation gene silencing',
   'DNA methylation is the addition of a methyl group to cytosine bases in DNA at CpG sites. When methylation occurs at gene promoter regions, it silences gene expression. Methylation patterns can be altered by diet, stress, toxins, and social experiences. Some patterns can be inherited across generations — transgenerational epigenetic inheritance.',
   'Your DNA has an on/off switch system. Methyl groups act like sticky notes that say do not read this gene. Your experiences, diet, and stress levels can add or remove these sticky notes without changing the DNA itself.',
   '["diet (folate, B12, methionine)","chronic stress","exercise","sleep quality","toxin exposure","social connection"]',
   'Ifá teaches we carry our ancestors within us. Epigenetics confirms this: the experiences of your grandparents can alter methylation patterns passed to you. The Egúngún (ancestors) are not metaphor — they are biology.',
   '["Jaenisch and Bird 2003 Nature Genetics","Meaney 2001 Annual Review of Neuroscience"]',
   '["DNA methylation","epigenetics","gene silencing","CpG","transgenerational","gene expression"]'],
  ['Stress-Induced Epigenetic Changes', 'HPA axis glucocorticoid receptor methylation',
   'Chronic stress alters the epigenome through the HPA axis. Elevated cortisol leads to methylation of the glucocorticoid receptor gene (NR3C1), reducing the brain ability to regulate stress — creating a vicious cycle. Meaney research showed rat pups with low-licking mothers had higher NR3C1 methylation and lifelong heightened stress responses. This could be reversed by cross-fostering.',
   'Chronic stress literally changes how your stress genes are read. The more stress you experience, the more your brain loses its ability to calm down. But this is reversible through healing relationships, mindfulness, and lifestyle change.',
   '["chronic stress reduction","mindfulness meditation","secure attachment relationships","exercise","sleep","therapy"]',
   'Intergenerational trauma has an epigenetic basis. When Ifá speaks of carrying the burdens of ancestors, it is describing a biological reality. Healing ancestral trauma through Egúngún ceremonies, therapy, and lifestyle change is epigenetic medicine.',
   '["Meaney and Szyf 2005 Dialogues in Clinical Neuroscience","Yehuda et al 2016 Biological Psychiatry"]',
   '["stress epigenetics","HPA axis","cortisol","glucocorticoid receptor","intergenerational trauma","NR3C1"]'],
  ['Nutritional Epigenetics', 'One-carbon metabolism methyl donor pathways',
   'Diet directly influences the epigenome through methyl donors and cofactors. Key nutrients: Folate (B9) — essential for DNA methylation; Vitamin B12 — cofactor for methionine synthase; Methionine — direct methyl donor; Polyphenols (resveratrol, EGCG from green tea, curcumin from turmeric) — modulate DNA methyltransferases. Deficiency during critical developmental periods can alter epigenetic programming with lifelong consequences.',
   'What you eat changes which genes are switched on or off. Folate, B12, turmeric, green tea — these foods directly influence your gene expression. Food is not just fuel; it is information for your genome.',
   '["folate-rich foods (leafy greens, legumes)","B12","turmeric/curcumin","green tea (EGCG)","resveratrol","choline (eggs, liver)"]',
   'Yoruba onísègùn have always prescribed specific foods and herbs for healing. Moringa, Turmeric, Bitter leaf (Ewuro) are epigenetic medicines that alter gene expression. Traditional food wisdom is nutritional epigenetics.',
   '["Waterland and Jirtle 2003 Molecular and Cellular Biology","Milagro et al 2013 Progress in Molecular Biology"]',
   '["nutritional epigenetics","folate","B12","methyl donors","curcumin","polyphenols","gene expression"]'],
  ['Exercise-Induced Epigenetic Remodelling', 'BDNF methylation mitochondrial biogenesis',
   'Physical exercise induces widespread epigenetic changes. Exercise demethylates the BDNF gene promoter, increasing BDNF expression and neurogenesis (growth of new brain cells). Exercise activates PGC-1α through histone acetylation for mitochondrial biogenesis. Regular aerobic exercise is associated with longer telomeres. Exercise alters methylation of inflammatory genes, reducing chronic inflammation.',
   'Exercise rewrites your epigenome. It grows new brain cells, makes your mitochondria stronger, slows aging at the cellular level, and reduces inflammation — all through epigenetic changes. Movement is medicine at the genetic level.',
   '["aerobic exercise 150+ min/week","resistance training","HIIT","yoga","walking in nature"]',
   'Ifá prescribes movement, dance, and ritual physical activity as part of healing. Egúngún masquerade, Gèlèdé dance, and Orisha ceremonies involve vigorous movement. These are epigenetic interventions that alter gene expression and grow new neurons.',
   '["Gomez-Pinilla and Hillman 2013 Comprehensive Physiology","Denham et al 2014 European Journal of Applied Physiology"]',
   '["exercise epigenetics","BDNF","neurogenesis","telomeres","mitochondria","PGC-1alpha"]'],
];

for (const e of epi) {
  await conn.execute(
    'INSERT IGNORE INTO epigenetics_knowledge (mechanism, genePathway, content, plainLanguageSummary, lifestyleFactors, ancestralConnection, researchSources, keywords) VALUES (?,?,?,?,?,?,?,?)',
    e
  );
}
console.log('Epigenetics: seeded', epi.length);

// Ayurveda
const ayur = [
  ['ayurvedic', 'Ashwagandha', '["Indian Ginseng","Winter Cherry"]', 'Withania somnifera', 'Adaptogen / Rasayana',
   'Stress and anxiety reduction (adaptogenic), improving sleep quality, enhancing cognitive function, supporting thyroid function, increasing strength and endurance, balancing Vata and Kapha doshas. Nourishes Ojas (vital essence) and strengthens the nervous system.',
   'Root powder 300-600mg daily in warm milk or water. KSM-66 extract is the most researched form. Best taken at night for sleep support.',
   'Avoid in pregnancy. Use caution with thyroid medications, immunosuppressants, and sedatives. May lower blood sugar. Avoid in Pitta excess.',
   '["adaptogenic","anxiolytic","anti-inflammatory","neuroprotective","immunomodulatory"]',
   '["stress","anxiety","insomnia","fatigue","cognitive decline","thyroid imbalance"]',
   null, null, '["Chandrasekhar et al 2012 Indian Journal of Psychological Medicine"]', null],
  ['ayurvedic', 'Triphala', '["Three Fruits","Amalaki-Bibhitaki-Haritaki blend"]', 'Emblica officinalis + Terminalia bellirica + Terminalia chebula', 'Digestive Tonic / Rasayana',
   'Digestive health, gentle bowel regulation, antioxidant support, eye health, detoxification, immune support. Combines Amalaki (Pitta-reducing, highest natural Vitamin C), Bibhitaki (Kapha-reducing), and Haritaki (Vata-reducing). Balances all three doshas.',
   'Powder 1/2 to 1 teaspoon in warm water before bed. Tablets 500-1000mg daily. For eye health: Triphala eyewash (diluted solution).',
   'Avoid in pregnancy and during diarrhoea. May interact with blood thinners. Reduce dose if loose stools occur.',
   '["digestive tonic","antioxidant","anti-inflammatory","immunomodulatory","detoxifying"]',
   '["constipation","digestive issues","oxidative stress","eye health","immune support"]',
   null, null, '["Peterson et al 2017 Journal of Alternative and Complementary Medicine"]', null],
  ['ayurvedic', 'Tulsi (Holy Basil)', '["Holy Basil","Sacred Basil","Ocimum sanctum"]', 'Ocimum tenuiflorum', 'Adaptogen / Sacred Herb',
   'Stress adaptation (adaptogenic), respiratory health (coughs, bronchitis, asthma), antimicrobial (antibacterial, antiviral, antifungal), blood sugar regulation, cognitive enhancement, anti-inflammatory. Contains eugenol, rosmarinic acid, and ursolic acid with significant anti-inflammatory and neuroprotective effects.',
   'Fresh leaves 5-10 daily chewed or in tea. Dried leaf tea 1-2 teaspoons in hot water for 10 minutes. Growing Tulsi in the home is a sacred Ayurvedic practice.',
   'Avoid in pregnancy. May lower blood sugar — monitor if diabetic. May interact with blood thinners. Avoid with fertility treatments in high doses.',
   '["adaptogenic","antimicrobial","anti-inflammatory","neuroprotective","hypoglycaemic"]',
   '["stress","respiratory infections","diabetes","inflammation","cognitive support"]',
   null, null, '["Cohen 2014 Journal of Ayurveda and Integrative Medicine"]', null],
  ['ayurvedic', 'Shatavari', '["Hundred Roots","Wild Asparagus"]', 'Asparagus racemosus', 'Female Tonic / Rasayana',
   'Shatavari is the primary Ayurvedic herb for female reproductive health. Uses: hormonal balance (oestrogen modulation), fertility support, menopause symptom relief, lactation enhancement (galactagogue), digestive soothing (demulcent), immune support, adaptogenic stress relief. Balances Vata and Pitta doshas.',
   'Powder 500-1000mg daily in warm milk or water. Capsules available. Best taken with ghee for absorption.',
   'Avoid in oestrogen-sensitive conditions (certain breast cancers, endometriosis) without practitioner guidance. May interact with diuretics.',
   '["female tonic","adaptogenic","galactagogue","demulcent","immunomodulatory","anti-inflammatory"]',
   '["hormonal imbalance","menopause","fertility","lactation","digestive issues","stress"]',
   null, null, '["Pandey et al 2018 Journal of Ethnopharmacology"]', null],
];

for (const a of ayur) {
  await conn.execute(
    'INSERT IGNORE INTO medicine_knowledge (tradition, herbName, localNames, scientificName, category, uses, preparation, contraindications, properties, conditions, bodyParts, relatedOdu, sources, dosage) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    a
  );
}
console.log('Ayurveda: seeded', ayur.length);

await conn.end();
console.log('All expanded knowledge seeded successfully');
