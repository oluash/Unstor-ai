/**
 * Seed script: Quantum Physics, Psychology, Epigenetics, Ayurveda knowledge bases
 * Run: npx tsx server/seedExpandedKnowledge.ts
 * NOTE: Data already seeded via seed_expanded.mjs (raw MySQL). This file is kept
 * as a typed reference and for future re-seeding via Drizzle.
 */
import { getDb } from "./db";
import {
  quantumKnowledge,
  psychologyKnowledge,
  epigeneticsKnowledge,
  medicineKnowledge,
} from "../drizzle/schema";

async function seedQuantumKnowledge() {
  const db = await getDb();
  if (!db) { console.warn("No DB — skipping quantum seed"); return; }

  const entries = [
    {
      topic: "Wave-Particle Duality",
      subtopic: "Double-Slit Experiment",
      difficultyLevel: "introductory" as const,
      content:
        "Every quantum object — an electron, a photon, even a molecule — behaves as both a wave and a particle depending on how it is observed. In the famous double-slit experiment, a single electron fired at a barrier with two slits creates an interference pattern on the detector screen, as if it passed through both slits simultaneously as a wave. But the moment a detector is placed to observe which slit it passes through, the interference pattern vanishes and the electron behaves like a particle. The act of observation collapses the wave into a definite state.",
      plainLanguageSummary:
        "Quantum objects are both wave and particle at once. Observation decides which one you see. This is not a metaphor — it is measured in laboratories every day.",
      ifaBridge:
        "In Ifá, the Odù exists as pure potential — all 256 patterns are present simultaneously until the moment of divination. The casting of Ifá is the observer collapsing the quantum field into one specific Odù.",
      sources: [
        "Feynman, R. (1965). The Feynman Lectures on Physics, Vol. III",
        "Young, T. (1801). Experiments and Calculations Relative to Physical Optics",
      ],
      keywords: ["wave-particle duality", "double-slit", "observer effect", "quantum measurement", "superposition"],
      relatedTopics: ["Superposition", "Observer Effect", "Quantum Measurement"],
    },
    {
      topic: "Quantum Superposition",
      subtopic: "Schrodinger Cat",
      difficultyLevel: "introductory" as const,
      content:
        "Superposition is the principle that a quantum system can exist in multiple states simultaneously until it is measured. Schrodinger's famous thought experiment illustrates this: a cat in a sealed box is simultaneously alive and dead until the box is opened and the cat is observed. While this seems absurd at the human scale, it is precisely what happens at the quantum level. An electron can spin both up and down at the same time. Superposition is not ignorance about the state — the system genuinely occupies multiple states simultaneously.",
      plainLanguageSummary:
        "Before you look, a quantum thing can be in all possible states at once. Looking at it forces it to choose one state. This is superposition.",
      ifaBridge:
        "Before divination, a person's situation contains all possible Odù — all 256 paths of Ifá are superposed in their life. The moment the Babaláwo casts and reads, one Odù is selected from the superposition.",
      sources: [
        "Schrodinger, E. (1935). Die gegenwärtige Situation in der Quantenmechanik",
        "Dirac, P.A.M. (1930). The Principles of Quantum Mechanics",
      ],
      keywords: ["superposition", "Schrodinger", "quantum states", "measurement", "collapse"],
      relatedTopics: ["Wave-Particle Duality", "Quantum Measurement", "Decoherence"],
    },
    {
      topic: "Quantum Entanglement",
      subtopic: "Non-local Correlations",
      difficultyLevel: "intermediate" as const,
      content:
        "Quantum entanglement occurs when two particles interact in such a way that the quantum state of each particle cannot be described independently of the other, even when separated by vast distances. When one entangled particle is measured and its state collapses, the other particle's state is instantly determined — regardless of the distance between them. Bell's theorem (1964) and subsequent experiments by Aspect et al. (1982) confirmed that entanglement is real and non-local.",
      plainLanguageSummary:
        "Two particles can be linked so deeply that measuring one instantly affects the other, no matter how far apart they are. Distance means nothing to entangled particles.",
      ifaBridge:
        "Ifá teaches that all things are connected through Àṣà. The Egúngún (ancestors) are entangled with the living — their states affect ours. Separation is an illusion.",
      sources: [
        "Bell, J.S. (1964). On the Einstein Podolsky Rosen Paradox",
        "Aspect, A. et al. (1982). Experimental Tests of Bell's Inequalities Using Time-Varying Analyzers",
      ],
      keywords: ["entanglement", "non-locality", "Bell theorem", "spooky action", "quantum correlation"],
      relatedTopics: ["Quantum Non-locality", "Bell Theorem", "EPR Paradox"],
    },
    {
      topic: "Quantum Consciousness",
      subtopic: "Orchestrated Objective Reduction Orch-OR",
      difficultyLevel: "advanced" as const,
      content:
        "The Orchestrated Objective Reduction (Orch-OR) theory, proposed by physicist Roger Penrose and anaesthesiologist Stuart Hameroff, suggests that consciousness arises from quantum computations in microtubules within neurons. When these quantum superpositions collapse (objective reduction), orchestrated by biological processes, the result is a moment of conscious experience. This theory bridges quantum mechanics and neuroscience.",
      plainLanguageSummary:
        "Some scientists believe consciousness itself is a quantum process happening inside the tiny structures of brain cells. Your awareness may be literally a quantum event — the universe becoming aware of itself through you.",
      ifaBridge:
        "Ifá places Orí (the personal soul/consciousness) at the centre of existence. Orch-OR suggests consciousness collapses quantum possibilities into experience. Orí is the mechanism by which Odù (quantum potential) becomes lived reality.",
      sources: [
        "Penrose, R. (1994). Shadows of the Mind",
        "Hameroff, S. & Penrose, R. (2014). Consciousness in the Universe: A Review of the Orch OR Theory",
      ],
      keywords: ["quantum consciousness", "Orch-OR", "microtubules", "Penrose", "Hameroff", "neural quantum"],
      relatedTopics: ["Quantum Biology", "Consciousness Studies", "Observer Effect"],
    },
    {
      topic: "Quantum Biology",
      subtopic: "Quantum Effects in Living Systems",
      difficultyLevel: "intermediate" as const,
      content:
        "Quantum biology studies quantum mechanical phenomena in biological systems. Key discoveries: (1) Photosynthesis — plants use quantum coherence to transfer energy with near-perfect efficiency; (2) Bird navigation — European robins use quantum entanglement in cryptochrome proteins to sense Earth's magnetic field; (3) Enzyme catalysis — enzymes use quantum tunnelling for chemical reactions; (4) DNA mutation — quantum tunnelling of protons in DNA base pairs may contribute to spontaneous mutations. Life has been exploiting quantum mechanics for billions of years.",
      plainLanguageSummary:
        "Living things use quantum tricks to work. Photosynthesis uses quantum superposition. Birds navigate using quantum entanglement. Your enzymes use quantum tunnelling. Life is a quantum phenomenon.",
      ifaBridge:
        "When Ifá prescribes herbs, movement, or ritual, it is working with the quantum substrate of the body. The body is not a mechanical machine but a quantum field.",
      sources: [
        "Al-Khalili, J. & McFadden, J. (2014). Life on the Edge: The Coming of Age of Quantum Biology",
        "Fleming, G.R. et al. (2007). Evidence for wavelike energy transfer through quantum coherence in photosynthetic systems",
      ],
      keywords: ["quantum biology", "photosynthesis", "quantum coherence", "enzyme tunnelling", "bird navigation"],
      relatedTopics: ["Quantum Consciousness", "Epigenetics", "Quantum Chemistry"],
    },
    {
      topic: "Observer Effect",
      subtopic: "Measurement Problem",
      difficultyLevel: "introductory" as const,
      content:
        "The observer effect in quantum mechanics states that the act of measuring a quantum system inevitably disturbs it. At the quantum level, you cannot observe something without changing it. This is not due to technological limitations — it is a fundamental feature of reality. The measurement problem asks: what constitutes a measurement? Different interpretations of quantum mechanics (Copenhagen, Many-Worlds, Relational QM) give different answers.",
      plainLanguageSummary:
        "In the quantum world, looking at something changes it. You cannot be a passive observer — your attention is part of the experiment. This is not philosophy; it is physics.",
      ifaBridge:
        "When you consult Ifá, you are not passively receiving information about a fixed future. You are participating in the collapse of quantum possibility. Your intention, your question, your presence — all of these are part of the measurement.",
      sources: [
        "Heisenberg, W. (1927). Über den anschaulichen Inhalt der quantentheoretischen Kinematik und Mechanik",
        "von Neumann, J. (1932). Mathematische Grundlagen der Quantenmechanik",
      ],
      keywords: ["observer effect", "measurement problem", "Copenhagen interpretation", "quantum observation"],
      relatedTopics: ["Wave-Particle Duality", "Quantum Superposition", "Quantum Consciousness"],
    },
  ];

  let count = 0;
  for (const entry of entries) {
    await db.insert(quantumKnowledge).values(entry).onDuplicateKeyUpdate({ set: { content: entry.content } });
    count++;
  }
  console.log(`Seeded ${count} quantum knowledge entries`);
}

async function seedPsychologyKnowledge() {
  const db = await getDb();
  if (!db) { console.warn("No DB — skipping psychology seed"); return; }

  const entries = [
    {
      framework: "Cognitive Behavioural Therapy (CBT)",
      technique: "Cognitive Restructuring",
      evidenceLevel: "established" as const,
      content:
        "Cognitive restructuring is the core CBT technique for identifying and challenging distorted thought patterns (cognitive distortions). Common distortions include: catastrophising, black-and-white thinking, mind reading, personalisation, and overgeneralisation. The process: (1) Identify the automatic thought, (2) Examine the evidence for and against it, (3) Generate a more balanced, realistic thought, (4) Notice how the new thought affects your emotion and behaviour.",
      practicalApplication:
        "When you notice a distressing thought, ask: What is the evidence for this thought? What would I say to a friend who had this thought? Write the original thought, the evidence, and the balanced thought in a thought record.",
      contraindications:
        "CBT requires cognitive engagement and may not be appropriate during acute psychosis or severe dissociation. Always work with a qualified therapist for clinical conditions.",
      sources: [
        "Beck, A.T. (1979). Cognitive Therapy of Depression",
        "Burns, D. (1980). Feeling Good: The New Mood Therapy",
      ],
      keywords: ["CBT", "cognitive distortions", "thought records", "cognitive restructuring", "automatic thoughts"],
      conditions: ["anxiety", "depression", "OCD", "PTSD", "phobias"],
    },
    {
      framework: "Mindfulness-Based Stress Reduction (MBSR)",
      technique: "Body Scan Meditation",
      evidenceLevel: "established" as const,
      content:
        "The body scan is a foundational mindfulness practice developed by Jon Kabat-Zinn as part of MBSR. It involves systematically moving attention through the body from feet to head, noticing sensations without judgment. Research shows MBSR reduces cortisol levels, improves immune function, reduces chronic pain perception, and decreases symptoms of anxiety and depression.",
      practicalApplication:
        "Lie down or sit comfortably. Close your eyes. Slowly move attention from the soles of the feet upward through the body. Spend 20-45 minutes. When the mind wanders, gently return to the body part you were attending to.",
      sources: [
        "Kabat-Zinn, J. (1990). Full Catastrophe Living",
        "Grossman, P. et al. (2004). Mindfulness-based stress reduction and health benefits: A meta-analysis",
      ],
      keywords: ["MBSR", "body scan", "mindfulness", "interoception", "stress reduction", "Kabat-Zinn"],
      conditions: ["stress", "anxiety", "chronic pain", "depression", "burnout"],
    },
    {
      framework: "Attachment Theory",
      technique: "Attachment Style Awareness",
      evidenceLevel: "established" as const,
      content:
        "Attachment theory, developed by John Bowlby and expanded by Mary Ainsworth, describes how early relationships with caregivers shape internal working models that persist into adulthood. The four adult attachment styles are: (1) Secure — comfortable with intimacy; (2) Anxious/Preoccupied — craves closeness but fears abandonment; (3) Avoidant/Dismissive — values independence, uncomfortable with closeness; (4) Disorganised/Fearful — wants closeness but fears it, often linked to early trauma.",
      practicalApplication:
        "Identify your attachment pattern by noticing how you respond when a close person is unavailable. Do you tend to pursue or withdraw in conflict? Understanding your attachment style is the first step to changing it.",
      sources: [
        "Bowlby, J. (1969). Attachment and Loss, Vol. 1",
        "Ainsworth, M.D.S. et al. (1978). Patterns of Attachment",
      ],
      keywords: ["attachment theory", "secure attachment", "anxious attachment", "avoidant attachment", "Bowlby"],
      conditions: ["relationship difficulties", "anxiety", "depression", "trauma", "loneliness"],
    },
    {
      framework: "Trauma-Informed Care",
      technique: "Somatic Experiencing",
      evidenceLevel: "emerging" as const,
      content:
        "Somatic Experiencing (SE), developed by Peter Levine, is a body-oriented approach to healing trauma. Levine observed that animals in the wild rarely develop PTSD because they discharge traumatic activation through physical movement. Humans often suppress this discharge, leaving traumatic energy frozen in the nervous system. SE works by tracking bodily sensations, titrating with traumatic material, and completing the interrupted defensive responses.",
      practicalApplication:
        "Notice where in your body you feel tension, numbness, or activation. Rather than going directly into the traumatic memory, stay with the body sensation. Allow any impulse to move to complete itself gently. Work with a trained SE practitioner for significant trauma.",
      sources: [
        "Levine, P. (1997). Waking the Tiger: Healing Trauma",
        "van der Kolk, B. (2014). The Body Keeps the Score",
      ],
      keywords: ["somatic experiencing", "trauma", "nervous system", "PTSD", "body-oriented therapy", "Peter Levine"],
      conditions: ["PTSD", "complex trauma", "anxiety", "chronic pain", "dissociation"],
    },
    {
      framework: "Positive Psychology",
      technique: "PERMA Model",
      evidenceLevel: "established" as const,
      content:
        "Martin Seligman's PERMA model identifies five elements of wellbeing: Positive Emotions (joy, gratitude, hope, love), Engagement (flow states — complete absorption in challenging activities), Relationships (positive, authentic connections), Meaning (belonging to and serving something larger than the self), and Accomplishment (pursuing achievement for its own sake). Research shows all five elements are independently associated with life satisfaction and resilience.",
      practicalApplication:
        "Assess your PERMA. For Positive Emotions: keep a gratitude journal. For Engagement: use your strengths daily. For Relationships: schedule one meaningful conversation. For Meaning: contribute to something larger. For Accomplishment: set one small, achievable goal.",
      sources: ["Seligman, M.E.P. (2011). Flourish: A Visionary New Understanding of Happiness and Well-being"],
      keywords: ["PERMA", "positive psychology", "wellbeing", "flourishing", "Seligman", "flow", "meaning"],
      conditions: ["low mood", "lack of purpose", "burnout", "life transitions", "personal growth"],
    },
  ];

  let count = 0;
  for (const entry of entries) {
    await db.insert(psychologyKnowledge).values(entry).onDuplicateKeyUpdate({ set: { content: entry.content } });
    count++;
  }
  console.log(`Seeded ${count} psychology knowledge entries`);
}

async function seedEpigeneticsKnowledge() {
  const db = await getDb();
  if (!db) { console.warn("No DB — skipping epigenetics seed"); return; }

  const entries = [
    {
      mechanism: "DNA Methylation",
      genePathway: "CpG methylation gene silencing",
      content:
        "DNA methylation is the addition of a methyl group (CH3) to cytosine bases in DNA at CpG sites. When methylation occurs at gene promoter regions, it generally silences gene expression. Methylation patterns can be altered by diet, stress, toxins, and social experiences. Crucially, some methylation patterns can be inherited across generations — transgenerational epigenetic inheritance.",
      plainLanguageSummary:
        "Your DNA has an on/off switch system. Methyl groups act like sticky notes that say do not read this gene. Your experiences, diet, and stress levels can add or remove these sticky notes without changing the DNA itself.",
      lifestyleFactors: ["diet (folate, B12, methionine)", "chronic stress", "exercise", "sleep quality", "toxin exposure", "social connection"],
      ancestralConnection:
        "Ifá teaches we carry our ancestors within us. Epigenetics confirms this: the experiences of your grandparents can alter methylation patterns passed to you. The Egúngún (ancestors) are not metaphor — they are biology.",
      researchSources: [
        "Jaenisch, R. & Bird, A. (2003). Epigenetic regulation of gene expression. Nature Genetics",
        "Meaney, M.J. (2001). Maternal care, gene expression, and the transmission of individual differences in stress reactivity. Annual Review of Neuroscience",
      ],
      keywords: ["DNA methylation", "epigenetics", "gene silencing", "CpG", "transgenerational", "gene expression"],
    },
    {
      mechanism: "Stress-Induced Epigenetic Changes",
      genePathway: "HPA axis glucocorticoid receptor methylation",
      content:
        "Chronic stress alters the epigenome through the HPA axis. Elevated cortisol leads to methylation of the glucocorticoid receptor gene (NR3C1), reducing the brain's ability to regulate the stress response — creating a vicious cycle. Meaney's landmark research showed that rat pups with low-licking mothers had higher methylation of NR3C1 and lifelong heightened stress responses. This could be reversed by cross-fostering.",
      plainLanguageSummary:
        "Chronic stress literally changes how your stress genes are read. The more stress you experience, the more your brain loses its ability to calm down. But this is reversible through healing relationships, mindfulness, and lifestyle change.",
      lifestyleFactors: ["chronic stress reduction", "mindfulness meditation", "secure attachment relationships", "exercise", "sleep", "therapy"],
      ancestralConnection:
        "Intergenerational trauma has an epigenetic basis. When Ifá speaks of carrying the burdens of ancestors, it is describing a biological reality. Healing ancestral trauma through Egúngún ceremonies, therapy, and lifestyle change is epigenetic medicine.",
      researchSources: [
        "Meaney, M.J. & Szyf, M. (2005). Environmental programming of stress responses through DNA methylation. Dialogues in Clinical Neuroscience",
        "Yehuda, R. et al. (2016). Holocaust Exposure Induced Intergenerational Effects on FKBP5 Methylation. Biological Psychiatry",
      ],
      keywords: ["stress epigenetics", "HPA axis", "cortisol", "glucocorticoid receptor", "intergenerational trauma", "NR3C1"],
    },
    {
      mechanism: "Nutritional Epigenetics",
      genePathway: "One-carbon metabolism methyl donor pathways",
      content:
        "Diet directly influences the epigenome through methyl donors and cofactors. Key nutrients: Folate (B9) — essential for DNA methylation; Vitamin B12 — cofactor for methionine synthase; Methionine — direct methyl donor; Polyphenols (resveratrol, EGCG from green tea, curcumin from turmeric) — modulate DNA methyltransferases. Deficiency during critical developmental periods can alter epigenetic programming with lifelong consequences.",
      plainLanguageSummary:
        "What you eat changes which genes are switched on or off. Folate, B12, turmeric, green tea — these foods directly influence your gene expression. Food is not just fuel; it is information for your genome.",
      lifestyleFactors: ["folate-rich foods (leafy greens, legumes)", "B12", "turmeric/curcumin", "green tea (EGCG)", "resveratrol", "choline (eggs, liver)"],
      ancestralConnection:
        "Yoruba onísègùn have always prescribed specific foods and herbs for healing. Moringa, Turmeric, Bitter leaf (Ewuro) are epigenetic medicines that alter gene expression. Traditional food wisdom is nutritional epigenetics.",
      researchSources: [
        "Waterland, R.A. & Jirtle, R.L. (2003). Transposable Elements: Targets for Early Nutritional Effects on Epigenetic Gene Regulation. Molecular and Cellular Biology",
        "Milagro, F.I. et al. (2013). Dietary factors, epigenetic modifications and obesity outcomes. Progress in Molecular Biology",
      ],
      keywords: ["nutritional epigenetics", "folate", "B12", "methyl donors", "curcumin", "polyphenols", "gene expression"],
    },
    {
      mechanism: "Exercise-Induced Epigenetic Remodelling",
      genePathway: "BDNF methylation mitochondrial biogenesis",
      content:
        "Physical exercise induces widespread epigenetic changes. Exercise demethylates the BDNF gene promoter, increasing BDNF expression and neurogenesis. Exercise activates PGC-1α through histone acetylation for mitochondrial biogenesis. Regular aerobic exercise is associated with longer telomeres. Exercise alters methylation of inflammatory genes, reducing chronic low-grade inflammation.",
      plainLanguageSummary:
        "Exercise rewrites your epigenome. It grows new brain cells, makes your mitochondria stronger, slows aging at the cellular level, and reduces inflammation — all through epigenetic changes. Movement is medicine at the genetic level.",
      lifestyleFactors: ["aerobic exercise (150+ min/week)", "resistance training", "HIIT", "yoga", "walking in nature"],
      ancestralConnection:
        "Ifá prescribes movement, dance, and ritual physical activity as part of healing. Egúngún masquerade, Gèlèdé dance, and Orisha ceremonies involve vigorous movement. These are epigenetic interventions that alter gene expression and grow new neurons.",
      researchSources: [
        "Gomez-Pinilla, F. & Hillman, C. (2013). The influence of exercise on cognitive abilities. Comprehensive Physiology",
        "Denham, J. et al. (2014). Epigenetic changes in leukocytes after 8 weeks of resistance exercise training. European Journal of Applied Physiology",
      ],
      keywords: ["exercise epigenetics", "BDNF", "neurogenesis", "telomeres", "mitochondria", "PGC-1alpha"],
    },
  ];

  let count = 0;
  for (const entry of entries) {
    await db.insert(epigeneticsKnowledge).values(entry).onDuplicateKeyUpdate({ set: { content: entry.content } });
    count++;
  }
  console.log(`Seeded ${count} epigenetics knowledge entries`);
}

async function seedAyurvedicMedicine() {
  const db = await getDb();
  if (!db) { console.warn("No DB — skipping Ayurveda seed"); return; }

  const entries = [
    {
      tradition: "ayurvedic" as const,
      herbName: "Ashwagandha",
      localNames: ["Indian Ginseng", "Winter Cherry"],
      scientificName: "Withania somnifera",
      category: "Adaptogen / Rasayana",
      uses: "Ashwagandha is one of Ayurveda's most important Rasayana herbs. Primary uses: stress and anxiety reduction (adaptogenic), improving sleep quality, enhancing cognitive function, supporting thyroid function, increasing strength and endurance, balancing Vata and Kapha doshas. Nourishes Ojas (vital essence) and strengthens the nervous system.",
      preparation: "Root powder 300-600mg daily in warm milk or water. KSM-66 extract is the most researched form. Best taken at night for sleep support.",
      contraindications: "Avoid in pregnancy. Use caution with thyroid medications, immunosuppressants, and sedatives. May lower blood sugar. Avoid in Pitta excess.",
      properties: ["adaptogenic", "anxiolytic", "anti-inflammatory", "neuroprotective", "immunomodulatory"],
      conditions: ["stress", "anxiety", "insomnia", "fatigue", "cognitive decline", "thyroid imbalance"],
      sources: ["Chandrasekhar, K. et al. (2012). A prospective, randomized double-blind, placebo-controlled study of safety and efficacy of ashwagandha root extract. Indian Journal of Psychological Medicine"],
    },
    {
      tradition: "ayurvedic" as const,
      herbName: "Triphala",
      localNames: ["Three Fruits", "Amalaki-Bibhitaki-Haritaki blend"],
      scientificName: "Emblica officinalis + Terminalia bellirica + Terminalia chebula",
      category: "Digestive Tonic / Rasayana",
      uses: "Triphala combines three fruits that balance all three doshas. Primary uses: digestive health, gentle bowel regulation, antioxidant support, eye health, detoxification, immune support.",
      preparation: "Powder 1/2 to 1 teaspoon in warm water before bed. Tablets 500-1000mg daily. For eye health: Triphala eyewash.",
      contraindications: "Avoid in pregnancy and during diarrhoea. May interact with blood thinners. Reduce dose if loose stools occur.",
      properties: ["digestive tonic", "antioxidant", "anti-inflammatory", "immunomodulatory", "detoxifying"],
      conditions: ["constipation", "digestive issues", "oxidative stress", "eye health", "immune support"],
      sources: ["Peterson, C.T. et al. (2017). Therapeutic Uses of Triphala in Ayurvedic Medicine. Journal of Alternative and Complementary Medicine"],
    },
    {
      tradition: "ayurvedic" as const,
      herbName: "Tulsi (Holy Basil)",
      localNames: ["Holy Basil", "Sacred Basil", "Ocimum sanctum"],
      scientificName: "Ocimum tenuiflorum",
      category: "Adaptogen / Sacred Herb",
      uses: "Tulsi is considered the most sacred plant in Ayurveda. Medicinal uses: stress adaptation (adaptogenic), respiratory health (coughs, bronchitis, asthma), antimicrobial (antibacterial, antiviral, antifungal), blood sugar regulation, cognitive enhancement, anti-inflammatory.",
      preparation: "Fresh leaves 5-10 daily chewed or in tea. Dried leaf tea 1-2 teaspoons in hot water for 10 minutes. Growing Tulsi in the home is a sacred Ayurvedic practice.",
      contraindications: "Avoid in pregnancy. May lower blood sugar. May interact with blood thinners. Avoid with fertility treatments in high doses.",
      properties: ["adaptogenic", "antimicrobial", "anti-inflammatory", "neuroprotective", "hypoglycaemic"],
      conditions: ["stress", "respiratory infections", "diabetes", "inflammation", "cognitive support"],
      sources: ["Cohen, M.M. (2014). Tulsi - Ocimum sanctum: A herb for all reasons. Journal of Ayurveda and Integrative Medicine"],
    },
    {
      tradition: "ayurvedic" as const,
      herbName: "Shatavari",
      localNames: ["Hundred Roots", "Wild Asparagus"],
      scientificName: "Asparagus racemosus",
      category: "Female Tonic / Rasayana",
      uses: "Shatavari is the primary Ayurvedic herb for female reproductive health. Uses: hormonal balance (oestrogen modulation), fertility support, menopause symptom relief, lactation enhancement (galactagogue), digestive soothing (demulcent), immune support, adaptogenic stress relief. Balances Vata and Pitta doshas.",
      preparation: "Powder 500-1000mg daily in warm milk or water. Capsules available. Best taken with ghee for absorption.",
      contraindications: "Avoid in oestrogen-sensitive conditions without practitioner guidance. May interact with diuretics.",
      properties: ["female tonic", "adaptogenic", "galactagogue", "demulcent", "immunomodulatory", "anti-inflammatory"],
      conditions: ["hormonal imbalance", "menopause", "fertility", "lactation", "digestive issues", "stress"],
      sources: ["Pandey, A.K. et al. (2018). Shatavari (Asparagus racemosus Wild): A Review on Its Cultivation, Morphology, Phytochemistry and Pharmacological Importance. Journal of Ethnopharmacology"],
    },
  ];

  let count = 0;
  for (const entry of entries) {
    await db.insert(medicineKnowledge).values(entry).onDuplicateKeyUpdate({ set: { uses: entry.uses } });
    count++;
  }
  console.log(`Seeded ${count} Ayurvedic medicine entries`);
}

async function main() {
  console.log("Seeding expanded knowledge base...");
  await seedQuantumKnowledge();
  await seedPsychologyKnowledge();
  await seedEpigeneticsKnowledge();
  await seedAyurvedicMedicine();
  console.log("Done. Expanded knowledge base seeded.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
