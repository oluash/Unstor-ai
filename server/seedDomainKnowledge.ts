/**
 * Domain Knowledge Seeder
 * Seeds quantum_knowledge, psychology_knowledge, and epigenetics_knowledge
 * tables with rich, structured content for Unstor's RAG engine.
 * Column names match the actual Drizzle schema exactly.
 */
import { getDb } from "./db";

// ─── QUANTUM KNOWLEDGE ────────────────────────────────────────────────────────
const QUANTUM_ENTRIES = [
  {
    topic: "Wave-Particle Duality",
    subtopic: "Foundational Principles",
    difficultyLevel: "introductory" as const,
    content: "Wave-particle duality is the concept that every quantum entity exhibits both wave and particle properties. Light behaves as a wave in double-slit experiments (showing interference patterns) but as a particle (photon) when detected. Electrons similarly show diffraction patterns when not observed but land as discrete points when measured. This duality is not a contradiction but a fundamental feature of quantum reality — the nature of a quantum object depends on how it is observed.",
    equations: "de Broglie wavelength: λ = h/p (where h is Planck's constant, p is momentum). For an electron: λ = h/mv",
    sources: ["de Broglie (1924)", "Davisson-Germer experiment (1927)", "Feynman Lectures on Physics"],
    ifaBridge: "In Ifá, Odù Ogbe represents the primordial light — both the source and the illuminated. Just as a photon is both wave and particle depending on observation, Ogbe teaches that reality is shaped by the act of witnessing. The Yoruba concept of Orí (personal consciousness) as the observer mirrors the quantum observer effect — your awareness participates in shaping what manifests.",
    plainLanguageSummary: "Everything in the universe is both a wave and a particle. Which one you see depends on how you look. Your observation changes reality.",
  },
  {
    topic: "Quantum Superposition",
    subtopic: "Foundational Principles",
    difficultyLevel: "introductory" as const,
    content: "Quantum superposition is the principle that a quantum system can exist in multiple states simultaneously until measured. Schrödinger's famous thought experiment (the cat in the box) illustrates this: until observed, the cat is in a superposition of alive and dead. In reality, quantum bits (qubits) in quantum computers exploit superposition to process multiple possibilities simultaneously. Superposition collapses to a definite state upon measurement — this is called wave function collapse.",
    equations: "State vector: |ψ⟩ = α|0⟩ + β|1⟩ where |α|² + |β|² = 1. Probability of measuring state |0⟩ = |α|²",
    sources: ["Schrödinger (1935)", "Dirac, Principles of Quantum Mechanics", "Nielsen & Chuang, Quantum Computation"],
    ifaBridge: "Ifá's 256 Odù represent 256 quantum probability fields — each Odù is a superposition of all possible life outcomes for a given situation. The act of consulting Ifá collapses the superposition: from infinite possibilities, one pattern comes into focus. This is why Ifá says 'the future is not fixed — it is a range of possibilities shaped by current choices and energy.'",
    plainLanguageSummary: "Before a decision is made, all possibilities exist simultaneously. The moment you observe or choose, one possibility becomes real.",
  },
  {
    topic: "Quantum Entanglement",
    subtopic: "Non-locality and Correlation",
    difficultyLevel: "intermediate" as const,
    content: "Quantum entanglement occurs when two particles interact in such a way that the quantum state of each cannot be described independently of the other, even when separated by large distances. Measuring one particle instantly affects the state of its entangled partner — what Einstein called 'spooky action at a distance.' Entanglement has been experimentally verified across distances of over 1,200 km (China's Micius satellite, 2017). It is the basis for quantum cryptography and quantum teleportation.",
    equations: "Bell state (maximally entangled): |Φ+⟩ = (1/√2)(|00⟩ + |11⟩). Bell's inequality violation: |E(a,b) - E(a,b')| + |E(a',b) + E(a',b')| ≤ 2 (classical), > 2 (quantum)",
    sources: ["Einstein, Podolsky, Rosen (1935)", "Bell (1964)", "Aspect et al. (1982)", "Yin et al. Science (2017)"],
    ifaBridge: "Ifá's concept of Ashe (the divine energy that flows through all things) is a direct parallel to quantum entanglement. The Yoruba understanding that all living things are connected through invisible threads of energy — that what happens to one affects the whole — is precisely what entanglement demonstrates at the quantum level.",
    plainLanguageSummary: "Two particles that have interacted remain connected forever, no matter how far apart. What happens to one instantly affects the other. This is the physics of deep connection.",
  },
  {
    topic: "Observer Effect",
    subtopic: "Measurement and Consciousness",
    difficultyLevel: "intermediate" as const,
    content: "The observer effect in quantum mechanics refers to the fact that the act of measuring a quantum system inevitably disturbs it. More profoundly, in the Copenhagen interpretation, a quantum system does not have definite properties until measured — the act of observation brings reality into being. This has led to deep philosophical debates about the role of consciousness in quantum mechanics. The von Neumann-Wigner interpretation explicitly places consciousness as the collapse agent.",
    equations: "Measurement operator M acting on state |ψ⟩: M|ψ⟩ → |m⟩ with probability |⟨m|ψ⟩|²",
    sources: ["Heisenberg (1927)", "von Neumann, Mathematical Foundations of QM (1932)", "Wigner (1961)", "Wheeler, Participatory Universe"],
    ifaBridge: "Ifá's Orí (personal consciousness/soul) is the quantum observer. In Yoruba cosmology, your Orí chose your destiny before birth — but that destiny is not fixed; it is a probability field that your awareness and choices continuously shape. The Ifá saying 'Orí ni baba Orisha' (Orí is the father of all Orisha) means your consciousness is primary — it shapes what the divine forces can do for you.",
    plainLanguageSummary: "The act of observing changes what is observed. Consciousness participates in creating reality, not merely witnessing it.",
  },
  {
    topic: "Quantum Biology",
    subtopic: "Quantum Effects in Living Systems",
    difficultyLevel: "intermediate" as const,
    content: "Quantum biology investigates quantum mechanical phenomena in biological systems. Key findings: (1) Photosynthesis — plants use quantum coherence to transfer energy with near-100% efficiency. (2) Bird navigation — European robins use quantum entanglement in cryptochrome proteins to sense Earth's magnetic field. (3) Enzyme catalysis — proton tunnelling through energy barriers accelerates biochemical reactions. (4) DNA mutation — quantum tunnelling may contribute to spontaneous mutations. (5) Olfaction — quantum tunnelling may explain how we distinguish between molecules.",
    equations: "Tunnelling probability: T ≈ exp(-2κL) where κ = √(2m(V-E))/ℏ, L = barrier width",
    sources: ["Fleming et al., Nature (2007)", "Ritz et al. (2000)", "Scrutton et al. (2006)", "Al-Khalili & McFadden, Life on the Edge (2014)"],
    ifaBridge: "Ifá has always understood plants as living intelligence — Osanyin (Orisha of plants and healing) holds the quantum wisdom of the plant kingdom. The discovery that photosynthesis uses quantum coherence validates the Yoruba understanding that plants are quantum processors of light and information. The Onísègùn (Yoruba herbalist) who works with Ewe (leaves) is working with quantum biological intelligence.",
    plainLanguageSummary: "Living systems use quantum mechanics to achieve efficiencies impossible by classical means. Plants, birds, and enzymes all exploit quantum effects. Life is quantum.",
  },
  {
    topic: "Quantum Consciousness (Orchestrated OR)",
    subtopic: "Consciousness and Quantum Mechanics",
    difficultyLevel: "advanced" as const,
    content: "The Orchestrated Objective Reduction (Orch OR) theory, proposed by Roger Penrose and Stuart Hameroff, suggests that consciousness arises from quantum computations in microtubules — protein structures inside neurons. According to Orch OR, quantum superpositions in microtubules are 'orchestrated' by biological processes and 'reduced' (collapsed) by quantum gravity at the Planck scale. This would make consciousness a fundamental feature of the universe, not an emergent property of classical computation.",
    equations: "Objective Reduction time: τ = ℏ/E_G where E_G is the gravitational self-energy of the superposition",
    sources: ["Penrose, The Emperor's New Mind (1989)", "Hameroff & Penrose, Physics of Life Reviews (2014)", "Craddock et al. (2017)"],
    ifaBridge: "Orch OR provides a scientific framework for the Yoruba concept of Orí (personal soul/consciousness) as a quantum phenomenon. If consciousness arises from quantum processes at the Planck scale — the deepest level of spacetime — then Orí is not merely a metaphor but a quantum reality. The Ifá teaching that Orí chose its destiny before birth may describe a quantum selection event at the moment of biological organisation.",
    plainLanguageSummary: "Consciousness may arise from quantum processes in the brain's microtubules, making awareness a fundamental feature of the universe rather than a byproduct of classical computation.",
  },
  {
    topic: "Uncertainty Principle",
    subtopic: "Foundational Principles",
    difficultyLevel: "introductory" as const,
    content: "Heisenberg's Uncertainty Principle states that certain pairs of physical properties (position and momentum, energy and time) cannot both be known to arbitrary precision simultaneously. This is not a limitation of measurement technology — it is a fundamental feature of nature. The more precisely you know a particle's position, the less precisely you can know its momentum. The uncertainty principle means the future is genuinely undetermined at the quantum level, not merely unknown.",
    equations: "Position-momentum: Δx·Δp ≥ ℏ/2. Energy-time: ΔE·Δt ≥ ℏ/2. Where ℏ = h/2π = 1.055×10⁻³⁴ J·s",
    sources: ["Heisenberg (1927)", "Robertson (1929)", "Kennard (1927)"],
    ifaBridge: "The Uncertainty Principle is the physics of Ifá's teaching that the future is not fixed. Ifá does not predict a single outcome — it reveals the probability field. The Yoruba concept of Akunleyan (the destiny chosen before birth) is not a rigid script but a quantum probability distribution. Uncertainty is not a problem to be solved; it is the space in which free will operates.",
    plainLanguageSummary: "You cannot know everything at once. The more precisely you measure one thing, the less you can know about its partner. Uncertainty is built into the fabric of reality.",
  },
  {
    topic: "Quantum Coherence",
    subtopic: "Quantum Phenomena",
    difficultyLevel: "intermediate" as const,
    content: "Quantum coherence refers to the ability of a quantum system to maintain a definite phase relationship between its quantum states — a prerequisite for quantum interference and superposition. Coherence is fragile: any interaction with the environment (decoherence) destroys it. In biology, quantum coherence has been observed in photosynthesis and bird navigation. In consciousness research, some theories propose that quantum coherence in neural microtubules underlies conscious experience.",
    equations: "Coherence time: τ_c = ℏ/kT at temperature T. At body temperature (310K): τ_c ≈ 2.5×10⁻¹⁴ s for thermal decoherence",
    sources: ["Flemming et al., Nature (2007)", "Engel et al. (2007)", "Hameroff & Penrose (2014)"],
    ifaBridge: "Quantum coherence is the physics of Ifá ritual. The careful preparation of sacred space, the use of specific herbs, the rhythmic drumming, the focused intention — all create conditions for quantum coherence in consciousness. The Babalawo's training in maintaining mental stillness is a technology for preserving quantum coherence long enough to access deeper probability fields.",
    plainLanguageSummary: "Quantum coherence is the state where quantum possibilities remain open and interfering. It requires protection from environmental noise. Silence, focus, and ritual are coherence technologies.",
  },
  {
    topic: "Many-Worlds Interpretation",
    subtopic: "Interpretations of Quantum Mechanics",
    difficultyLevel: "intermediate" as const,
    content: "The Many-Worlds Interpretation (MWI), proposed by Hugh Everett III in 1957, suggests that every quantum measurement causes the universe to branch into multiple parallel universes, one for each possible outcome. There is no wave function collapse — instead, all possibilities are realised in different branches of reality. MWI is mathematically elegant and is favoured by many physicists including Stephen Hawking and Max Tegmark.",
    equations: "Universal wave function: |Ψ_universe⟩ = Σ_i c_i |observer_i⟩|system_i⟩|environment_i⟩",
    sources: ["Everett (1957)", "DeWitt (1970)", "Deutsch, The Fabric of Reality (1997)", "Tegmark, Our Mathematical Universe (2014)"],
    ifaBridge: "Ifá's 256 Odù can be understood as 256 parallel probability branches of reality. When you consult Ifá, you are not predicting one fixed future — you are identifying which branch of reality your current energy and choices are most aligned with. The Yoruba concept of Ayanmo (destiny) is not a single predetermined path but the most probable branch given your Orí's quantum configuration.",
    plainLanguageSummary: "Every quantum event causes the universe to split into parallel branches where each outcome occurs. All possibilities are real — in different universes.",
  },
  {
    topic: "Zero-Point Energy",
    subtopic: "Quantum Phenomena",
    difficultyLevel: "intermediate" as const,
    content: "Zero-point energy is the lowest possible energy a quantum system can have — it is not zero. Even at absolute zero temperature, quantum systems retain energy due to the Uncertainty Principle. The quantum vacuum is not empty — it seethes with zero-point fluctuations. The Casimir effect (measurable attraction between two uncharged parallel plates in a vacuum) is direct evidence of zero-point energy.",
    equations: "Ground state energy: E₀ = ½ℏω (harmonic oscillator). Casimir force: F/A = -π²ℏc/(240d⁴) per unit area",
    sources: ["Planck (1911)", "Casimir (1948)", "Lamoreaux (1997)", "Milonni, The Quantum Vacuum (1994)"],
    ifaBridge: "Zero-point energy is the physics of Ashe — the irreducible, inexhaustible energy that underlies all of existence. Even in the void, Ashe is present. The Yoruba understanding that Olodumare is the source of all energy, that nothing is truly empty, that creation is a continuous process — this is the cosmological parallel of zero-point energy. The vacuum is not nothing; it is the fullness of potential.",
    plainLanguageSummary: "Even empty space contains energy. The universe is never truly empty — it vibrates with irreducible quantum energy at all times.",
  },
  {
    topic: "Quantum Tunnelling",
    subtopic: "Quantum Phenomena",
    difficultyLevel: "intermediate" as const,
    content: "Quantum tunnelling is the phenomenon where a quantum particle passes through a potential energy barrier that it classically could not surmount. The particle's wave function extends through the barrier, giving it a non-zero probability of appearing on the other side. Tunnelling is responsible for nuclear fusion in stars, radioactive decay, scanning tunnelling microscopes, flash memory in computers, and enzyme catalysis in biology. Without tunnelling, the sun would not shine.",
    equations: "Transmission coefficient: T ≈ exp(-2√(2m(V₀-E))/ℏ × L) for rectangular barrier of width L and height V₀",
    sources: ["Gamow (1928)", "Gurney & Condon (1928)", "Josephson (1962)", "Scrutton, Tunnelling in Biology (2006)"],
    ifaBridge: "Quantum tunnelling is the physics of Esu (Orisha of crossroads, boundaries, and transitions). Esu is the force that opens paths where none appear to exist — that moves energy through barriers that seem impenetrable. When Ifá prescribes offerings to Esu, it is activating the quantum tunnelling principle: creating the conditions for energy to pass through apparent obstacles.",
    plainLanguageSummary: "Quantum particles can pass through barriers that should stop them. This is not magic — it is the wave nature of matter finding paths through the impossible.",
  },
  {
    topic: "Quantum Field Theory",
    subtopic: "Advanced Quantum Mechanics",
    difficultyLevel: "advanced" as const,
    content: "Quantum Field Theory (QFT) is the framework that combines quantum mechanics with special relativity. In QFT, particles are not fundamental — they are excitations of underlying quantum fields that permeate all of space. The electron is an excitation of the electron field; the photon is an excitation of the electromagnetic field. The Standard Model of particle physics is a QFT describing all known particles and forces (except gravity).",
    equations: "Lagrangian density for scalar field: ℒ = ½(∂_μφ)² - ½m²φ². Feynman path integral: Z = ∫Dφ exp(iS[φ]/ℏ)",
    sources: ["Feynman (1949)", "Weinberg, The Quantum Theory of Fields", "Peskin & Schroeder, Introduction to QFT"],
    ifaBridge: "Ifá's concept of Ashe is the closest traditional parallel to quantum fields — an invisible, pervasive energy that underlies all manifest reality. Just as particles are excitations of fields, all visible things are excitations of Ashe. The Yoruba understanding that Ashe can be cultivated, directed, and amplified through ritual and intention mirrors the QFT understanding that fields can be excited, shaped, and channelled.",
    plainLanguageSummary: "Particles are not solid objects — they are ripples in invisible fields that fill all of space. Everything is made of field excitations, not billiard balls.",
  },
  {
    topic: "Quantum Entanglement in Photosynthesis",
    subtopic: "Quantum Biology",
    difficultyLevel: "intermediate" as const,
    content: "In 2007, Graham Fleming's group at UC Berkeley discovered that quantum coherence plays a role in the extraordinary efficiency of photosynthesis. When a photon is absorbed by a light-harvesting complex, the excitation energy explores multiple pathways simultaneously (quantum superposition) to find the most efficient route to the reaction centre. This quantum walk achieves near-100% energy transfer efficiency — far beyond what classical random diffusion would predict.",
    equations: "Energy transfer efficiency: η = k_transfer/(k_transfer + k_loss). Quantum walk vs classical: σ_Q ∝ t vs σ_C ∝ √t",
    sources: ["Engel et al., Nature (2007)", "Lee et al., Science (2007)", "Collini et al., Nature (2010)"],
    ifaBridge: "The quantum efficiency of photosynthesis validates the Yoruba understanding of Ewe (leaves/plants) as living intelligence. Osanyin, the Orisha of plants, is described as the most intelligent of all Orisha — knowing the healing properties of every leaf. The quantum biological sophistication of plants supports this traditional understanding of plant intelligence.",
    plainLanguageSummary: "Plants use quantum mechanics to harvest light with near-perfect efficiency. They explore all possible energy pathways simultaneously and choose the best one — quantum computing in action.",
  },
  {
    topic: "Quantum Decoherence",
    subtopic: "Quantum to Classical Transition",
    difficultyLevel: "advanced" as const,
    content: "Quantum decoherence explains why we don't observe quantum superposition in everyday life. When a quantum system interacts with its environment (air molecules, photons, vibrations), the quantum information leaks into the environment and the superposition effectively collapses. Decoherence is why quantum computers must be kept near absolute zero. It explains the boundary between quantum and classical worlds without requiring a 'collapse' event.",
    equations: "Decoherence time: τ_D ≈ τ_R (m/m_thermal)² where τ_R is relaxation time. For a dust grain: τ_D ≈ 10⁻³¹ seconds",
    sources: ["Zurek (1991)", "Joos et al., Decoherence and the Appearance of a Classical World", "Tegmark (2000)"],
    ifaBridge: "Decoherence is why Ifá requires ritual conditions — silence, intention, sacred space — to access quantum-level reality. When the environment is noisy and distracted, the quantum coherence of consciousness collapses into classical, habitual patterns. The Ifá ritual creates a decoherence-free zone where deeper probability fields can be accessed.",
    plainLanguageSummary: "Quantum effects disappear when a system interacts with its environment. This is why we don't see quantum weirdness in daily life — and why quiet, focused conditions are needed to access deeper states of awareness.",
  },
  {
    topic: "Quantum Gravity",
    subtopic: "Advanced Quantum Mechanics",
    difficultyLevel: "advanced" as const,
    content: "Quantum gravity is the theoretical framework that seeks to unify quantum mechanics with general relativity. Einstein's general relativity describes gravity as the curvature of spacetime — a smooth, continuous phenomenon. Quantum mechanics describes reality as discrete, probabilistic, and non-local. These two theories are incompatible at extreme scales (black holes, Big Bang). Leading approaches: Loop Quantum Gravity, String Theory, and Causal Dynamical Triangulations.",
    equations: "Planck length: l_P = √(ℏG/c³) ≈ 1.6×10⁻³⁵ m. Planck time: t_P = √(ℏG/c⁵) ≈ 5.4×10⁻⁴⁴ s",
    sources: ["Rovelli, Quantum Gravity (2004)", "Penrose, The Road to Reality (2004)", "Smolin, Three Roads to Quantum Gravity (2001)"],
    ifaBridge: "The Yoruba concept of Orun (the spiritual realm) and Aiye (the physical realm) as two interpenetrating dimensions of reality anticipates the quantum gravity challenge: how do the continuous (Orun, spacetime) and the discrete (Aiye, quantum) coexist and interact? Ifá's cosmology suggests they are not separate — they are two aspects of one reality.",
    plainLanguageSummary: "The two greatest theories in physics — quantum mechanics and general relativity — are incompatible. Quantum gravity seeks to unify them. The answer may reshape our understanding of space, time, and consciousness.",
  },
  {
    topic: "Quantum Darwinism",
    subtopic: "Quantum to Classical Transition",
    difficultyLevel: "advanced" as const,
    content: "Quantum Darwinism, proposed by Wojciech Zurek, explains how the classical world emerges from quantum reality. When a quantum system interacts with its environment, information about the system is redundantly encoded in many environmental fragments. Observers access the classical world by sampling these environmental fragments — they see the same 'classical' reality because they are all reading the same redundantly encoded information. This explains why we all agree on the position of a chair.",
    equations: "Redundancy: R_δ = S(ρ_S)/H_δ(ρ_F) where S is entropy, H_δ is conditional entropy of fragment F",
    sources: ["Zurek, Nature Physics (2009)", "Blume-Kohout & Zurek (2008)", "Riedel et al. (2012)"],
    ifaBridge: "Quantum Darwinism explains why Ifá's collective wisdom — encoded redundantly across 256 Odù, thousands of ese verses, and generations of Babalawo — is so robust. The redundant encoding of Ifá knowledge across multiple carriers is the cultural parallel of quantum Darwinism: the truth survives because it is multiply encoded.",
    plainLanguageSummary: "The classical world we experience emerges from quantum reality through redundant information encoding in the environment. We agree on reality because we all read the same environmental copies of quantum information.",
  },
  {
    topic: "Quantum Computing",
    subtopic: "Applied Quantum Technology",
    difficultyLevel: "intermediate" as const,
    content: "Quantum computers use quantum mechanical phenomena (superposition, entanglement, interference) to perform computations infeasible for classical computers. A qubit can be in superposition of 0 and 1 simultaneously, allowing quantum computers to explore many solutions in parallel. Key algorithms: Shor's algorithm (factoring large numbers exponentially faster — threatens RSA encryption), Grover's algorithm (searching unsorted databases quadratically faster). Google achieved quantum supremacy in 2019.",
    equations: "Quantum speedup for Grover's: O(√N) vs classical O(N). Shor's algorithm: O((log N)³) vs classical O(exp((log N)^(1/3)))",
    sources: ["Shor (1994)", "Grover (1996)", "Arute et al., Nature (2019)", "IBM Quantum roadmap (2023)"],
    ifaBridge: "The Ifá divination system — with its 256 Odù and binary casting method — is a classical analogue of quantum computation. The Babalawo's process of casting, reading, and interpreting is a form of probabilistic computation that explores the solution space of a life situation. Quantum computing is humanity rediscovering, in silicon, what Ifá encoded in palm nuts thousands of years ago.",
    plainLanguageSummary: "Quantum computers exploit superposition and entanglement to solve problems exponentially faster than classical computers. They represent a fundamental shift in what is computationally possible.",
  },
  {
    topic: "Quantum Teleportation",
    subtopic: "Quantum Information",
    difficultyLevel: "intermediate" as const,
    content: "Quantum teleportation is the transfer of quantum states (not matter or energy) between locations using entanglement and classical communication. It does not violate relativity because classical information must be transmitted at light speed or slower. Quantum teleportation has been demonstrated over 1,400 km. It is the basis for quantum networks and quantum internet. Note: it teleports quantum information (the state), not the physical particle.",
    equations: "Bell measurement: |Φ⟩_AB = (1/√2)(|00⟩ + |11⟩). Teleportation fidelity: F = (2P_succ + 1)/3 for qubit",
    sources: ["Bennett et al. (1993)", "Bouwmeester et al., Nature (1997)", "Ren et al., Nature (2017)"],
    ifaBridge: "Quantum teleportation is the physics of ancestral transmission in Ifá. The Egúngún tradition understands that the essence (quantum state) of an ancestor can be transmitted across time and space — not the physical body, but the pattern, the information, the Ashe. When a Babalawo channels ancestral wisdom, they are performing a form of quantum teleportation.",
    plainLanguageSummary: "Quantum information can be transferred between locations using entanglement, without the physical particle moving. Information, not matter, is teleported.",
  },
  {
    topic: "Quantum Annealing",
    subtopic: "Applied Quantum Technology",
    difficultyLevel: "advanced" as const,
    content: "Quantum annealing is a quantum computing approach that uses quantum tunnelling to find the global minimum of a complex optimisation problem. Unlike gate-based quantum computers, quantum annealers (like D-Wave systems) are designed for specific optimisation tasks: portfolio optimisation, drug discovery, logistics, machine learning. The quantum system starts in a superposition of all possible solutions and slowly 'anneals' to the optimal solution, using quantum tunnelling to escape local minima.",
    equations: "Ising Hamiltonian: H = -Σ_ij J_ij σ_i σ_j - Σ_i h_i σ_i. Transverse field: H_T = -Γ Σ_i σ_i^x",
    sources: ["Kadowaki & Nishimori (1998)", "Farhi et al. (2001)", "D-Wave Systems documentation"],
    ifaBridge: "Quantum annealing mirrors the Ifá process of finding the optimal path through a complex life situation. The Babalawo's consultation explores many possible Odù configurations (superposition of solutions) before the casting process anneals to the most relevant Odù (optimal solution). The quantum tunnelling that escapes local minima is the equivalent of Ifá's ability to reveal unexpected paths.",
    plainLanguageSummary: "Quantum annealing finds the best solution to complex problems by exploring all possibilities simultaneously and using quantum tunnelling to escape suboptimal traps.",
  },
  {
    topic: "Quantum Cryptography",
    subtopic: "Applied Quantum Technology",
    difficultyLevel: "intermediate" as const,
    content: "Quantum cryptography uses quantum mechanical principles to create theoretically unbreakable encryption. Quantum Key Distribution (QKD) exploits the fact that measuring a quantum state disturbs it — any eavesdropper would leave detectable traces. The BB84 protocol uses polarised photons to distribute encryption keys. China's Micius satellite demonstrated intercontinental QKD in 2017. Post-quantum cryptography (NIST standardised 2024) protects classical systems against future quantum computers.",
    equations: "BB84 security: P(undetected eavesdrop per bit) = 1/4. Key rate: R ≈ (1 - 2h(e)) where h is binary entropy, e is error rate",
    sources: ["Bennett & Brassard (1984)", "Ekert (1991)", "Yin et al., Science (2017)", "NIST PQC Standards (2024)"],
    ifaBridge: "Quantum cryptography embodies the Ifá principle of sacred knowledge — that certain wisdom is protected by the nature of reality itself. In Ifá tradition, the deepest Odù knowledge is shared only in specific ritual contexts because the act of transmission changes both the knowledge and the receiver. Quantum cryptography makes this principle physical.",
    plainLanguageSummary: "Quantum cryptography creates unbreakable codes because any attempt to eavesdrop on quantum information disturbs it and leaves detectable traces.",
  },
];

// ─── PSYCHOLOGY KNOWLEDGE ─────────────────────────────────────────────────────
const PSYCHOLOGY_ENTRIES = [
  {
    framework: "Cognitive Behavioural Therapy (CBT)",
    technique: "Cognitive Restructuring",
    evidenceLevel: "established" as const,
    content: "CBT is the most evidence-based psychological therapy, developed by Aaron Beck in the 1960s. It is based on the principle that thoughts, feelings, and behaviours are interconnected — changing one changes the others. Cognitive restructuring identifies and challenges cognitive distortions (automatic negative thoughts). Common distortions: all-or-nothing thinking, catastrophising, mind reading, emotional reasoning, personalisation, overgeneralisation, mental filtering, discounting positives, should statements, labelling. The process: identify the automatic thought → examine the evidence for and against → generate a balanced alternative thought → notice the emotional shift.",
    practicalApplication: "CBT Thought Record: (1) Situation: What happened? (2) Automatic thought: What went through your mind? (3) Emotion: What did you feel? (0-100%) (4) Evidence for the thought (5) Evidence against the thought (6) Balanced thought (7) Outcome: How do you feel now? Practice daily for 3 weeks to rewire automatic thought patterns.",
    sources: ["Beck, Cognitive Therapy of Depression (1979)", "Burns, Feeling Good (1980)", "Hofmann et al., Cognitive Therapy and Research (2012)"],
  },
  {
    framework: "Dialectical Behaviour Therapy (DBT)",
    technique: "Distress Tolerance",
    evidenceLevel: "established" as const,
    content: "DBT was developed by Marsha Linehan for borderline personality disorder but is now used broadly for emotional dysregulation. It synthesises CBT with Zen mindfulness and dialectical philosophy (the synthesis of opposites). Four skill modules: (1) Mindfulness — the foundation, observing without judgment. (2) Distress Tolerance — surviving crises without making them worse (TIPP: Temperature, Intense exercise, Paced breathing, Progressive relaxation). (3) Emotion Regulation — understanding and changing emotional responses. (4) Interpersonal Effectiveness — navigating relationships (DEAR MAN, GIVE, FAST).",
    practicalApplication: "TIPP for acute distress: (T) Temperature — hold ice cubes or splash cold water on face (activates dive reflex, reduces heart rate). (I) Intense exercise — 20 minutes vigorous movement burns off stress hormones. (P) Paced breathing — exhale twice as long as inhale (4 counts in, 8 counts out). (P) Progressive muscle relaxation — systematically tense and release each muscle group.",
    sources: ["Linehan, Cognitive-Behavioral Treatment of BPD (1993)", "Linehan et al., Archives of General Psychiatry (2006)", "Cochrane Review on DBT (2020)"],
  },
  {
    framework: "Acceptance and Commitment Therapy (ACT)",
    technique: "Psychological Flexibility",
    evidenceLevel: "established" as const,
    content: "ACT, developed by Steven Hayes, teaches psychological flexibility through six core processes: (1) Acceptance — allowing thoughts and feelings without fighting them. (2) Cognitive Defusion — seeing thoughts as thoughts, not facts ('I notice I'm having the thought that...'). (3) Present Moment Awareness — mindful contact with the here and now. (4) Self-as-Context — the observing self that is larger than any thought or feeling. (5) Values — identifying what truly matters. (6) Committed Action — taking values-based action despite discomfort.",
    practicalApplication: "Values Clarification Exercise: In each life domain (relationships, work, health, personal growth, spirituality), ask: 'What kind of person do I want to be? What do I want to stand for?' Write one sentence per domain. Then ask: 'What small action, consistent with these values, can I take today?' ACT teaches: you don't need to feel ready to act in alignment with your values.",
    sources: ["Hayes et al., Acceptance and Commitment Therapy (1999)", "A-Tjak et al., Psychotherapy and Psychosomatics (2015)", "Ruiz, International Journal of Psychology (2010)"],
  },
  {
    framework: "EMDR (Eye Movement Desensitisation and Reprocessing)",
    technique: "Trauma Processing",
    evidenceLevel: "established" as const,
    content: "EMDR, developed by Francine Shapiro in 1987, is an evidence-based trauma therapy that uses bilateral stimulation (eye movements, tapping, or auditory tones) while the client briefly focuses on traumatic memories. The bilateral stimulation is thought to mimic REM sleep processing, allowing the brain to reprocess traumatic memories and reduce their emotional charge. EMDR has strong evidence for PTSD (endorsed by WHO, APA, VA). The 8-phase protocol: History taking → Preparation → Assessment → Desensitisation → Installation → Body scan → Closure → Re-evaluation.",
    practicalApplication: "Self-administered bilateral stimulation (for mild distress, not acute trauma): Butterfly Hug — cross arms over chest, alternately tap shoulders while focusing on a calming image or resource state. Do 20-30 taps. This activates bilateral brain stimulation and can reduce acute anxiety. For trauma processing, always work with a trained EMDR therapist.",
    sources: ["Shapiro, Eye Movement Desensitization and Reprocessing (1995)", "van der Kolk et al. (2007)", "WHO Guidelines for PTSD (2013)", "Bisson et al., Cochrane Review (2013)"],
  },
  {
    framework: "Attachment Theory",
    technique: "Relational Patterns",
    evidenceLevel: "established" as const,
    content: "Attachment theory, developed by John Bowlby and expanded by Mary Ainsworth, describes how early relationships with caregivers create internal working models that shape all subsequent relationships. Four attachment styles: (1) Secure — comfortable with intimacy and independence, trusts others, regulates emotions well. (2) Anxious/Preoccupied — fears abandonment, hyperactivates attachment system, needs reassurance. (3) Avoidant/Dismissing — deactivates attachment system, values independence, uncomfortable with closeness. (4) Disorganised/Fearful — wants closeness but fears it, often linked to trauma or frightening caregivers. Attachment styles are not fixed — they can change with healing relationships and therapy.",
    practicalApplication: "Identify your attachment style: (1) Do you find it easy to get close to others? (2) Do you worry about being abandoned? (3) Do you feel uncomfortable depending on others? Anxious: work on self-soothing and tolerating uncertainty. Avoidant: practice naming and sharing emotions in small doses. Disorganised: trauma-focused therapy with a safe therapist. All styles: cultivate at least one secure attachment relationship.",
    sources: ["Bowlby, Attachment and Loss (1969-1980)", "Ainsworth et al. (1978)", "Main & Solomon (1986)", "Mikulincer & Shaver (2007)"],
  },
  {
    framework: "Polyvagal Theory",
    technique: "Nervous System Regulation",
    evidenceLevel: "established" as const,
    content: "Polyvagal Theory, developed by Stephen Porges, describes three hierarchical states of the autonomic nervous system: (1) Ventral Vagal (safe and social) — calm, connected, curious, creative. (2) Sympathetic (fight or flight) — mobilised, activated, anxious, angry. (3) Dorsal Vagal (freeze/shutdown) — immobilised, collapsed, dissociated, depressed. The nervous system moves between these states based on neuroception (unconscious scanning for safety/danger). Healing trauma involves expanding the 'window of tolerance' in the ventral vagal state.",
    practicalApplication: "Ventral Vagal activation practices: (1) Physiological sigh — double inhale through nose, long exhale through mouth. Fastest way to activate parasympathetic. (2) Humming/chanting — stimulates vagus nerve directly. (3) Cold water on face — activates dive reflex, slows heart rate. (4) Eye contact with a safe person — co-regulation through the social engagement system. (5) Slow, rhythmic movement — walking, rocking, swaying.",
    sources: ["Porges, The Polyvagal Theory (2011)", "Dana, The Polyvagal Theory in Therapy (2018)", "van der Kolk, The Body Keeps the Score (2014)"],
  },
  {
    framework: "Internal Family Systems (IFS)",
    technique: "Parts Work",
    evidenceLevel: "emerging" as const,
    content: "Internal Family Systems (IFS), developed by Richard Schwartz, is a model of the psyche as a family of parts, each with its own perspective, feelings, and role. Three types of parts: (1) Exiles — vulnerable parts carrying pain, shame, or trauma, often young. (2) Managers — protective parts that try to prevent exiles from being triggered (perfectionism, people-pleasing, intellectualising). (3) Firefighters — reactive parts that respond when exiles are triggered (addiction, rage, self-harm, dissociation). The Self (capital S) is the core of consciousness — calm, curious, compassionate, courageous, connected, creative, clear, confident.",
    practicalApplication: "IFS Self-led check-in: (1) Notice a part that is activated (anxious, critical, numb). (2) Ask: 'How do I feel toward this part?' If you feel annoyed or want it gone, another part is present. (3) Ask the reactive part to step back. (4) From a place of curiosity: 'What are you trying to do for me? What do you fear would happen if you stopped?' (5) Thank the part for its efforts.",
    sources: ["Schwartz, Internal Family Systems Model (1995)", "Schwartz & Sweezy, Internal Family Systems Therapy (2019)", "Haddock et al., Journal of Marital and Family Therapy (2017)"],
  },
  {
    framework: "Somatic Experiencing",
    technique: "Body-Based Trauma Healing",
    evidenceLevel: "emerging" as const,
    content: "Somatic Experiencing (SE), developed by Peter Levine, is a body-based approach to trauma healing. Levine observed that animals in the wild rarely develop PTSD — they discharge traumatic activation through physical trembling, shaking, and movement after a threat passes. Humans, due to social inhibition and cognitive override, often suppress this natural discharge, leading to trauma symptoms. SE works by tracking body sensations (interoception), titrating exposure to traumatic material in small doses, allowing the body to complete interrupted defensive responses, and discharging stored traumatic energy.",
    practicalApplication: "Somatic grounding practice: (1) Feel your feet on the floor — notice the weight, temperature, texture. (2) Slowly scan from feet upward, noticing sensations without judgment. (3) Find a place in your body that feels neutral or pleasant. (4) Rest attention there for 30 seconds. (5) If activation arises, pendulate back to the neutral place. This builds somatic awareness and nervous system regulation capacity.",
    sources: ["Levine, Waking the Tiger (1997)", "Levine, In an Unspoken Voice (2010)", "Brom et al., Journal of Traumatic Stress (2017)"],
  },
  {
    framework: "Mindfulness-Based Stress Reduction (MBSR)",
    technique: "Mindfulness Practice",
    evidenceLevel: "established" as const,
    content: "MBSR, developed by Jon Kabat-Zinn at UMass Medical School in 1979, is an 8-week evidence-based programme that teaches mindfulness meditation for stress, pain, and illness. Core practices: (1) Body scan — systematic attention to body sensations from feet to head. (2) Sitting meditation — attention to breath, body, sounds, thoughts, emotions without judgment. (3) Mindful movement (yoga) — awareness during gentle movement. MBSR has strong evidence for: chronic pain, anxiety, depression, cancer-related distress, immune function, and structural brain changes.",
    practicalApplication: "5-minute MBSR practice: (1) Sit comfortably, close eyes or soft gaze. (2) Take 3 deep breaths, exhaling fully. (3) Let breathing return to natural rhythm. (4) Place full attention on the physical sensation of breath — the rise and fall of chest or belly, the air at nostrils. (5) When mind wanders (it will), gently return attention to breath without self-criticism. (6) End with 3 deep breaths. Consistency matters more than duration.",
    sources: ["Kabat-Zinn, Full Catastrophe Living (1990)", "Hofmann et al., Journal of Consulting and Clinical Psychology (2010)", "Holzel et al., Psychiatry Research (2011)"],
  },
  {
    framework: "Jungian Psychology",
    technique: "Shadow Work",
    evidenceLevel: "emerging" as const,
    content: "Carl Jung's analytical psychology introduces the concept of the Shadow — the unconscious part of the psyche containing everything the conscious mind has rejected, denied, or suppressed. The Shadow is not purely negative — it contains unlived potential, creativity, and vitality alongside repressed negative traits. Shadow work involves: (1) Noticing strong reactions to others (projection). (2) Examining recurring dreams and fantasies. (3) Exploring what you judge harshly in others. (4) Integrating shadow material through active imagination, journaling, or therapy. Jung: 'One does not become enlightened by imagining figures of light, but by making the darkness conscious.'",
    practicalApplication: "Shadow journaling prompt: Write about someone who irritates or triggers you strongly. List their qualities. Now ask: 'In what ways might I have these qualities, even in small amounts, or in hidden form?' This is projection work. Next: 'What unlived potential in me might this person represent?' Shadow integration is not about becoming what you reject — it is about reclaiming the energy trapped in the rejection.",
    sources: ["Jung, Aion (1951)", "Jung, Psychology and Alchemy (1944)", "Johnson, Owning Your Own Shadow (1991)", "Zweig & Abrams, Meeting the Shadow (1991)"],
  },
  {
    framework: "Positive Psychology",
    technique: "Strengths and Flourishing",
    evidenceLevel: "established" as const,
    content: "Positive psychology, founded by Martin Seligman, studies what makes life worth living — not just the absence of pathology but the presence of flourishing. The PERMA model: Positive Emotions, Engagement (flow states), Relationships (positive connections), Meaning (belonging to something larger than self), Accomplishment (achievement, mastery). Character Strengths (VIA): 24 universal character strengths organised under 6 virtues — wisdom, courage, humanity, justice, temperance, transcendence. Using signature strengths in new ways is one of the most effective evidence-based wellbeing interventions.",
    practicalApplication: "Three Good Things exercise (evidence-based, increases wellbeing within 1 week): Each evening, write 3 good things that happened today and why they happened. Be specific. 'A colleague smiled at me (because I greeted them warmly)' not 'things went well.' Do for 21 consecutive days. This trains the brain to notice positive events it normally filters out, counteracting negativity bias.",
    sources: ["Seligman, Flourish (2011)", "Peterson & Seligman, Character Strengths and Virtues (2004)", "Lyubomirsky et al., Psychological Bulletin (2005)"],
  },
  {
    framework: "Trauma-Informed Care",
    technique: "Trauma Awareness",
    evidenceLevel: "established" as const,
    content: "Trauma-informed care (TIC) recognises that trauma is pervasive and shapes behaviour, health, and relationships. The ACE (Adverse Childhood Experiences) study found that childhood trauma dramatically increases risk of physical and mental health problems across the lifespan. TIC principles: (1) Safety. (2) Trustworthiness and transparency. (3) Peer support. (4) Collaboration and mutuality. (5) Empowerment, voice, and choice. (6) Cultural, historical, and gender issues. Trauma responses (fight, flight, freeze, fawn) are adaptive survival strategies, not character flaws. 'What happened to you?' not 'What's wrong with you?'",
    practicalApplication: "Trauma-informed self-inquiry: When you notice a strong reaction (anger, shutdown, anxiety), ask: 'How old does this feel? What does this remind me of?' Often our strongest reactions are not about the present situation but about an old wound being touched. This is not weakness — it is the body's intelligent attempt to protect you based on past experience. Compassion for your reactions opens the door to healing.",
    sources: ["Felitti et al., American Journal of Preventive Medicine (1998)", "SAMHSA, Trauma-Informed Care (2014)", "van der Kolk, The Body Keeps the Score (2014)"],
  },
  {
    framework: "Motivational Interviewing",
    technique: "Change Facilitation",
    evidenceLevel: "established" as const,
    content: "Motivational Interviewing (MI), developed by William Miller and Stephen Rollnick, is a collaborative, person-centred approach to facilitating change. It is based on the observation that people are more likely to change when they articulate their own reasons for change, rather than being told to change. Core skills (OARS): Open questions, Affirmations, Reflective listening, Summarising. The spirit of MI: Partnership, Acceptance, Compassion, Evocation (drawing out the person's own motivation). MI works with ambivalence — the normal human experience of wanting and not wanting to change simultaneously.",
    practicalApplication: "Self-MI for change: (1) Importance: 'On a scale of 0-10, how important is this change to me? Why not lower?' (2) Confidence: 'On a scale of 0-10, how confident am I that I can make this change? Why not lower?' (3) Readiness: 'What would need to be different for me to move one point higher on each scale?' This evokes your own change talk and surfaces your intrinsic motivation.",
    sources: ["Miller & Rollnick, Motivational Interviewing (3rd ed., 2012)", "Lundahl et al., Research on Social Work Practice (2010)", "Heckman et al. (2010)"],
  },
  {
    framework: "Behavioural Activation",
    technique: "Depression Treatment",
    evidenceLevel: "established" as const,
    content: "Behavioural Activation (BA) is one of the most effective treatments for depression, based on the principle that depression maintains itself through avoidance and withdrawal. The BA model: depression → reduced activity → fewer positive reinforcements → more depression (vicious cycle). Breaking the cycle: schedule activities that provide mastery (accomplishment) and pleasure, even when motivation is absent. Key insight: motivation follows action, not the reverse.",
    practicalApplication: "BA starter: List 10 activities that used to give you pleasure or a sense of accomplishment (before depression). Rate each for difficulty (1-10). Start with the easiest 3. Schedule one per day for one week. Do them regardless of mood. After each, rate your mood before and after. Notice: even small activities often improve mood, even if only slightly. This data builds evidence against the depression's narrative that 'nothing will help.'",
    sources: ["Lewinsohn (1974)", "Jacobson et al., Journal of Consulting and Clinical Psychology (1996)", "Cuijpers et al., Clinical Psychology Review (2007)"],
  },
  {
    framework: "Narrative Therapy",
    technique: "Story Reauthoring",
    evidenceLevel: "emerging" as const,
    content: "Narrative Therapy, developed by Michael White and David Epston, views problems as separate from persons — the person is not the problem; the problem is the problem. It works by externalising problems (naming them as separate from identity), mapping the problem's influence, identifying unique outcomes (times the problem did not dominate), and re-authoring a preferred story. Key concepts: dominant story (the problem-saturated narrative), alternative story (the preferred narrative), sparkling moments (evidence of the alternative story).",
    practicalApplication: "Externalisation practice: Name your problem as a separate entity. 'The Anxiety' not 'my anxiety.' 'The Perfectionism' not 'I am a perfectionist.' Then ask: 'What does The Anxiety want for you? What does it cost you? When have you stood up to it? What does that tell you about who you are?' This creates distance from the problem and reveals your agency.",
    sources: ["White & Epston, Narrative Means to Therapeutic Ends (1990)", "White, Maps of Narrative Practice (2007)", "Morgan, What is Narrative Therapy? (2000)"],
  },
  {
    framework: "Compassion-Focused Therapy (CFT)",
    technique: "Self-Compassion",
    evidenceLevel: "established" as const,
    content: "Compassion-Focused Therapy (CFT), developed by Paul Gilbert, is designed for people with high shame and self-criticism. It works with three emotion regulation systems: (1) Threat system (fight/flight/freeze — evolved for survival). (2) Drive system (seeking, achieving, consuming — evolved for resource acquisition). (3) Soothing/affiliation system (contentment, safety, connection — evolved for social bonding). Many people with shame and depression are stuck in threat mode with an underdeveloped soothing system. CFT builds the soothing system through compassionate mind training.",
    practicalApplication: "Self-compassion break (Kristin Neff): When suffering arises, place hand on heart and say: (1) 'This is a moment of suffering' (mindfulness — acknowledging reality). (2) 'Suffering is part of the shared human experience' (common humanity — you are not alone). (3) 'May I be kind to myself in this moment' (self-kindness — treating yourself as you would a good friend). This activates the soothing system and counteracts the shame spiral.",
    sources: ["Gilbert, The Compassionate Mind (2009)", "Neff, Self-Compassion (2011)", "Kirby et al., Clinical Psychology Review (2017)"],
  },
  {
    framework: "Psychodynamic Therapy",
    technique: "Unconscious Patterns",
    evidenceLevel: "established" as const,
    content: "Psychodynamic therapy works with unconscious patterns, defences, and relational dynamics. Key concepts: (1) Unconscious — thoughts, feelings, and memories outside awareness that influence behaviour. (2) Defence mechanisms — unconscious strategies to manage anxiety (repression, projection, rationalisation, intellectualisation, displacement, sublimation). (3) Transference — unconsciously relating to the therapist (or others) as if they were a significant figure from the past. (4) Object relations — internal representations of self and others formed in early relationships. Modern psychodynamic therapy is evidence-based for depression, personality disorders, and complex trauma.",
    practicalApplication: "Defence mechanism awareness: Notice when you: (1) Suddenly change the subject when something uncomfortable arises (avoidance). (2) Explain away a feeling with logic (rationalisation). (3) Attribute your own feelings to someone else ('they're angry' when you're angry). (4) Become very sleepy or foggy when discussing something important (dissociation). These are your defences at work. Curiosity, not judgment: 'What is this protecting me from?'",
    sources: ["Shedler, American Psychologist (2010)", "Leichsenring et al., JAMA Psychiatry (2015)", "Fonagy et al. (2015)"],
  },
  {
    framework: "Interpersonal Therapy (IPT)",
    technique: "Relationship Healing",
    evidenceLevel: "established" as const,
    content: "Interpersonal Therapy (IPT) is a time-limited therapy (12-16 sessions) that focuses on improving interpersonal functioning to reduce psychiatric symptoms. IPT addresses four problem areas: (1) Grief — complicated bereavement. (2) Role disputes — conflicts in significant relationships. (3) Role transitions — major life changes (divorce, retirement, illness). (4) Interpersonal deficits — social isolation and difficulty forming relationships. IPT has strong evidence for depression, eating disorders, and PTSD. It focuses on current relationships, not past history.",
    practicalApplication: "IPT role transition exercise: When facing a major life change, map: (1) What am I losing? (grieve it genuinely). (2) What am I gaining? (identify new possibilities). (3) What skills do I need for this new role? (4) Who can support me? (5) What is the first small step? Role transitions are not failures — they are invitations to expand your identity.",
    sources: ["Klerman et al., Interpersonal Psychotherapy of Depression (1984)", "Cuijpers et al., American Journal of Psychiatry (2016)", "WHO mhGAP IPT manual"],
  },
];

// ─── EPIGENETICS KNOWLEDGE ────────────────────────────────────────────────────
const EPIGENETICS_ENTRIES = [
  {
    genePathway: "DNA Methylation",
    mechanism: "Epigenetic Modification",
    content: "DNA methylation is the addition of a methyl group (CH₃) to the cytosine base of DNA, typically at CpG dinucleotides. It is the most studied epigenetic modification. Methylation generally silences gene expression — the methyl group physically blocks transcription factors from binding to the DNA. DNA methylation is established by DNMT3A and DNMT3B enzymes, maintained by DNMT1, and removed by TET enzymes. Methylation patterns are heritable through cell division and can be influenced by diet, stress, toxins, and social environment. The methylome changes with age — this is the basis of epigenetic clocks.",
    plainLanguageSummary: "DNA methylation is like a dimmer switch on your genes — it can turn them up or down without changing the genetic code itself. Your lifestyle, diet, and experiences continuously adjust these switches.",
    researchSources: ["Bird, Nature (2002)", "Jaenisch & Bird, Nature Genetics (2003)", "Horvath, Genome Biology (2013)"],
    ancestralConnection: "DNA methylation is the molecular mechanism of Ifá's concept of Ori-Inu (inner consciousness/soul) shaping destiny. The methylation pattern of your genome is not fixed at birth — it is continuously written and rewritten by your experiences, choices, and environment. This is the molecular basis of Ifá's teaching that destiny (Ayanmo) is not a rigid script but a dynamic interaction between your soul's blueprint and your lived experience.",
    lifestyleFactors: ["folate-rich foods", "meditation", "exercise", "sleep", "avoiding tobacco", "avoiding excess alcohol"],
    practicalApplication: "Lifestyle factors that positively influence DNA methylation: (1) Folate-rich foods (leafy greens, legumes) — provide methyl groups for healthy methylation. (2) Meditation and stress reduction — reduce stress-induced aberrant methylation. (3) Exercise — promotes beneficial methylation patterns in muscle and brain genes. (4) Sleep — critical for methylation maintenance and repair. (5) Avoiding toxins (smoking, excess alcohol) — these cause aberrant methylation patterns linked to cancer.",
  },
  {
    genePathway: "Histone Modification",
    mechanism: "Chromatin Remodelling",
    content: "Histones are proteins around which DNA is wrapped to form chromatin. Histone modifications — acetylation, methylation, phosphorylation, ubiquitination — alter chromatin structure and gene accessibility. Histone acetylation (by HATs — histone acetyltransferases) loosens chromatin and activates gene expression. Histone deacetylation (by HDACs — histone deacetylases) compacts chromatin and silences genes. HDAC inhibitors are being developed as cancer treatments and cognitive enhancers. These modifications form a 'histone code' that regulates the entire genome.",
    plainLanguageSummary: "Histones are spools around which DNA is wound. Chemical tags on these spools control whether genes are accessible (active) or locked away (silent). Your lifestyle continuously adds and removes these tags.",
    researchSources: ["Strahl & Allis, Nature (2000)", "Jenuwein & Allis, Science (2001)", "Kouzarides, Cell (2007)"],
    ancestralConnection: "Histone modifications are the molecular language of Ashe — the life force that flows through all things. Just as Ashe can be amplified or diminished through ritual, relationship, and lifestyle, histone modifications amplify or diminish the expression of specific genes.",
    lifestyleFactors: ["curcumin", "resveratrol", "sulforaphane", "exercise", "stress management"],
    practicalApplication: "Histone-modifying lifestyle practices: (1) Curcumin (turmeric) — inhibits HDACs and HATs, modulates histone acetylation. (2) Resveratrol (red grapes, berries) — activates SIRT1 (a histone deacetylase) linked to longevity. (3) Sulforaphane (broccoli sprouts) — HDAC inhibitor with anti-cancer properties. (4) Exercise — increases histone acetylation in muscle and brain. (5) Chronic stress — increases HDAC activity, silencing stress-protective genes.",
  },
  {
    genePathway: "Telomere Biology",
    mechanism: "Cellular Aging",
    content: "Telomeres are protective caps at the ends of chromosomes, consisting of repetitive DNA sequences (TTAGGG in humans) and associated proteins. They shorten with each cell division, acting as a molecular clock. When telomeres become critically short, cells enter senescence (permanent cell cycle arrest) or apoptosis (programmed death). Telomere length is a biomarker of biological age — shorter telomeres correlate with age-related diseases (cardiovascular disease, cancer, dementia) and earlier death. Telomerase (an enzyme) can extend telomeres — it is active in stem cells and cancer cells. Lifestyle factors significantly influence telomere length.",
    plainLanguageSummary: "Telomeres are like the plastic tips on shoelaces — they protect your chromosomes from fraying. They shorten with age and stress, and lengthen with healthy living. They are a direct measure of how fast you are aging.",
    researchSources: ["Blackburn & Gall (1978)", "Epel et al., PNAS (2004)", "Ornish et al., Lancet Oncology (2013)", "Blackburn & Epel, The Telomere Effect (2017)"],
    ancestralConnection: "Telomere biology is the molecular basis of Ifá's concept of Aiku (long life) as a blessing. The Ire of long life in Ifá is not merely about chronological age — it is about the quality and vitality of life force (Ashe). Telomere length is the molecular measure of Ashe in the cells. The lifestyle prescriptions of Ifá — community, purpose, ritual, balanced diet, movement, emotional processing — are precisely the factors that protect telomere length.",
    lifestyleFactors: ["plant-based diet", "aerobic exercise", "meditation", "social support", "stress management", "sleep"],
    practicalApplication: "Telomere-protective practices (Ornish et al., 2013 — the only study to show telomere lengthening): (1) Plant-based diet (whole foods, minimal processed). (2) Moderate aerobic exercise (30 min/day, 6 days/week). (3) Stress management (yoga, meditation, breathing). (4) Social support (group therapy, community). These four practices together increased telomerase activity by 29% and lengthened telomeres in prostate cancer patients.",
  },
  {
    genePathway: "Intergenerational Epigenetic Inheritance",
    mechanism: "Transgenerational Transmission",
    content: "Intergenerational epigenetic inheritance is the transmission of epigenetic marks (DNA methylation, histone modifications) from parents to offspring, beyond the genetic sequence itself. Evidence: (1) Dutch Hunger Winter — children born to mothers who were pregnant during the 1944 famine had altered DNA methylation patterns and higher rates of obesity, diabetes, and schizophrenia decades later. (2) Överkalix study — paternal grandfather's food availability in pre-puberty predicted grandson's mortality risk. (3) Holocaust survivor studies — children of survivors show altered cortisol and stress hormone profiles. (4) Animal studies — fear conditioning in mice was transmitted to offspring via sperm methylation.",
    plainLanguageSummary: "Your ancestors' experiences — their traumas, their famines, their joys — left marks on their DNA that were passed to you. You carry the epigenetic memory of your lineage. And the healing you do today can change what you pass to your children.",
    researchSources: ["Heijmans et al., PNAS (2008)", "Pembrey et al., European Journal of Human Genetics (2006)", "Yehuda et al., Biological Psychiatry (2016)", "Dias & Bhattacharya, Nature Neuroscience (2013)"],
    ancestralConnection: "Intergenerational epigenetic inheritance is the molecular validation of Ifá's concept of Egúngún (ancestral spirits) and their influence on the living. The Yoruba understanding that ancestors continue to affect descendants — through blessings, wounds, and unfinished business — is now confirmed by epigenetics. The trauma of your grandparents lives in your methylome. The healing you do changes not only your own epigenome but potentially the epigenomes of your children and grandchildren.",
    lifestyleFactors: ["trauma therapy", "EMDR", "somatic experiencing", "ancestral acknowledgement", "intergenerational dialogue", "lifestyle medicine"],
    practicalApplication: "Ancestral epigenetic healing practices: (1) Trauma therapy (EMDR, somatic experiencing) — processes inherited trauma patterns at the nervous system level, potentially altering epigenetic marks. (2) Lifestyle medicine — exercise, diet, stress reduction — can reverse adverse epigenetic inheritance. (3) Ancestral acknowledgement practices — naming and honouring ancestors, acknowledging their suffering — may reduce the psychological burden of inherited trauma.",
  },
  {
    genePathway: "Nutritional Epigenetics",
    mechanism: "Diet-Gene Interaction",
    content: "Nutritional epigenetics studies how dietary components influence epigenetic marks and gene expression. Key nutrients: (1) Methyl donors (folate, B12, choline, betaine) — provide methyl groups for DNA methylation. Deficiency causes aberrant methylation. (2) Polyphenols (resveratrol, EGCG, curcumin, quercetin) — modulate DNMT and HDAC activity. (3) Sulforaphane (broccoli sprouts) — HDAC inhibitor, activates Nrf2 (master antioxidant regulator). (4) Omega-3 fatty acids — alter DNA methylation in inflammatory genes. (5) Butyrate (from dietary fibre fermentation) — HDAC inhibitor, promotes gut health and anti-cancer epigenetics.",
    plainLanguageSummary: "What you eat writes your gene expression. Specific nutrients in food directly modify the epigenetic marks on your DNA, turning genes on or off. Food is not just fuel — it is epigenetic information.",
    researchSources: ["Waterland & Jirtle (2003)", "Hardy & Bhatt, Nutrients (2019)", "Mathers, Proceedings of the Nutrition Society (2008)"],
    ancestralConnection: "Nutritional epigenetics validates the Yoruba Onísègùn (herbalist) tradition and the Ifá concept of Ebo (offering/sacrifice). The Ebo prescriptions in Ifá often include specific foods — honey, palm oil, specific vegetables — that are not merely symbolic but may have epigenetic effects. The Yoruba food tradition — rich in leafy greens (Efo Riro), legumes (Ewa), fermented foods (Ogi, Iru) — is a nutritional epigenetics protocol refined over millennia.",
    lifestyleFactors: ["leafy greens", "turmeric", "broccoli sprouts", "fermented foods", "omega-3 foods", "avoiding processed foods"],
    practicalApplication: "Epigenetic nutrition protocol: (1) Daily leafy greens (spinach, kale, moringa) — folate for methylation. (2) Turmeric with black pepper daily — curcumin HDAC modulation. (3) Broccoli sprouts 3x/week — sulforaphane for Nrf2 activation. (4) Fermented foods daily (yoghurt, kimchi, kefir, ogi) — butyrate production. (5) Omega-3 rich foods (fatty fish, flaxseed, walnuts) — anti-inflammatory epigenetics.",
  },
  {
    genePathway: "Stress Epigenetics",
    mechanism: "Stress-Gene Interaction",
    content: "Chronic stress causes widespread epigenetic changes that alter the stress response system itself. Key mechanisms: (1) Glucocorticoid receptor (GR) gene methylation — early life stress increases methylation of the GR gene promoter, reducing GR expression and impairing stress response regulation. (2) FKBP5 gene — stress-induced demethylation of FKBP5 increases its expression, amplifying the stress response and increasing PTSD risk. (3) BDNF (Brain-Derived Neurotrophic Factor) — chronic stress reduces BDNF expression through histone deacetylation, contributing to depression and cognitive decline.",
    plainLanguageSummary: "Chronic stress rewrites your epigenome in ways that make you more sensitive to future stress. This is the molecular mechanism of trauma. But it is reversible — the right interventions can restore the original settings.",
    researchSources: ["Weaver et al., Nature Neuroscience (2004)", "Klengel et al., Nature Neuroscience (2013)", "Bhatt et al., Epigenetics (2020)"],
    ancestralConnection: "Stress epigenetics is the molecular explanation for Ifá's concept of Ajogun (negative forces) and their impact on health and destiny. The Ajogun — Iku (death), Arun (illness), Ofo (loss), Egba (paralysis) — are not supernatural abstractions but real forces that, at the molecular level, include chronic stress, trauma, and their epigenetic consequences. Ifá's prescriptions for managing Ajogun — community, ritual, purpose, lifestyle — are epigenetically protective.",
    lifestyleFactors: ["mindfulness meditation", "aerobic exercise", "social connection", "adequate sleep", "EMDR therapy", "somatic therapy"],
    practicalApplication: "Stress epigenetics reversal protocol: (1) Mindfulness meditation (8 weeks MBSR) — reduces FKBP5 methylation changes and cortisol reactivity. (2) Exercise (aerobic, 30 min 5x/week) — increases BDNF expression through histone acetylation. (3) Social connection — oxytocin release counteracts stress-induced epigenetic changes. (4) Adequate sleep (7-9 hours) — critical for epigenetic repair and BDNF restoration.",
  },
  {
    genePathway: "Epigenetic Clocks",
    mechanism: "Biological Age Measurement",
    content: "Epigenetic clocks are algorithms that use DNA methylation patterns to estimate biological age — the age of the body's cells and tissues, which may differ from chronological age. The Horvath clock (2013) uses 353 CpG sites to predict biological age across tissues with remarkable accuracy. The PhenoAge and GrimAge clocks predict health outcomes and mortality more accurately than chronological age. Biological age can be younger or older than chronological age depending on lifestyle. Studies show: meditation practitioners, centenarians, and those with healthy lifestyles have younger biological ages.",
    plainLanguageSummary: "Your biological age — measured by DNA methylation patterns — can be younger or older than your birth certificate says. Healthy living literally makes you younger at the cellular level.",
    researchSources: ["Horvath, Genome Biology (2013)", "Hannum et al., Molecular Cell (2013)", "Levine et al., Aging (2018)", "Epel et al., PNAS (2004)"],
    ancestralConnection: "Epigenetic clocks are the molecular measurement of Ifá's concept of Aiku (long life) as a quality of Ashe. The Yoruba understanding that some people are 'old souls' (wise beyond their years) and others are 'young souls' (immature despite age) has a molecular correlate: biological age measured by the epigenetic clock.",
    lifestyleFactors: ["Mediterranean diet", "plant-based diet", "aerobic exercise", "meditation", "adequate sleep", "social connection", "smoking cessation"],
    practicalApplication: "Biological age reduction protocol (based on epigenetic clock research): (1) Mediterranean or plant-based diet — reduces biological age by 1-3 years in studies. (2) Regular aerobic exercise — reduces biological age by 2-4 years. (3) Meditation (long-term practitioners) — biological age 5-12 years younger than chronological. (4) Adequate sleep — each hour below 7 hours adds ~0.5 years to biological age. (5) Social connection — isolation adds 2-3 years to biological age.",
  },
  {
    genePathway: "Epigenetics of Exercise",
    mechanism: "Physical Activity and Gene Expression",
    content: "Exercise is one of the most powerful epigenetic modulators. A single bout of exercise causes immediate changes in DNA methylation and histone acetylation in muscle, brain, and fat cells. Chronic exercise creates lasting epigenetic changes: (1) BDNF gene — exercise increases histone acetylation at BDNF promoter, increasing brain-derived neurotrophic factor. (2) PGC-1α — exercise demethylates this master regulator of mitochondrial biogenesis. (3) Inflammatory genes — exercise reduces methylation of anti-inflammatory genes. (4) Sperm epigenome — paternal exercise changes sperm methylation, potentially benefiting offspring metabolism.",
    plainLanguageSummary: "Exercise rewrites your epigenome in real time. A single workout changes gene expression in muscle, brain, and fat. Regular exercise creates lasting beneficial epigenetic changes — and may even improve the epigenetic inheritance you pass to your children.",
    researchSources: ["Ling et al., Cell Metabolism (2007)", "Barres et al., Cell Metabolism (2012)", "Ntanasis-Stathopoulos et al., Epigenomics (2013)"],
    ancestralConnection: "The epigenetics of exercise validates the Yoruba tradition of ritual dance and physical ceremony as medicine. The vigorous movement of Orisha ceremonies — the full-body dance of Sango devotees, the athletic movements of Ogun worship, the graceful flow of Osun dance — are not merely cultural expression. They are epigenetic medicine: activating BDNF, reducing inflammation, improving mitochondrial function.",
    lifestyleFactors: ["aerobic exercise", "resistance training", "HIIT", "dance", "consistency"],
    practicalApplication: "Exercise epigenetics protocol: (1) Aerobic exercise (running, cycling, swimming) 30 min 5x/week — maximum BDNF and mitochondrial benefits. (2) Resistance training 2x/week — activates different epigenetic pathways (mTOR, IGF-1). (3) High-intensity interval training (HIIT) — particularly effective for metabolic epigenetic reprogramming. (4) Dance — combines aerobic exercise with social connection and rhythm, maximising epigenetic benefits.",
  },
  {
    genePathway: "Epigenetics of Meditation",
    mechanism: "Mind-Body Epigenetics",
    content: "Meditation causes measurable epigenetic changes. Key findings: (1) Inflammatory genes — a single day of intensive mindfulness practice reduced expression of pro-inflammatory genes (RIPK2, COX2) in experienced meditators (Kaliman et al., 2014). (2) Telomere maintenance — long-term meditators show increased telomerase activity and longer telomeres. (3) Stress response genes — meditation reduces methylation of stress-response genes, improving stress regulation. (4) BDNF — meditation increases BDNF expression through epigenetic mechanisms. (5) Immune genes — meditation changes the expression of 172 genes related to immune function, metabolism, and circadian rhythms.",
    plainLanguageSummary: "Meditation changes your gene expression. Even a single session reduces inflammatory gene activity. Long-term practice lengthens telomeres, increases BDNF, and produces a gene expression signature opposite to the stress response.",
    researchSources: ["Kaliman et al., Psychoneuroendocrinology (2014)", "Epel et al., PNAS (2009)", "Bhasin et al., PLOS ONE (2013)", "Benson, The Relaxation Response (1975)"],
    ancestralConnection: "The epigenetics of meditation validates Ifá's concept of Ifọ́ (stillness, inner listening) as medicine. The Babalawo's training in sustained stillness and focused attention is not merely a spiritual discipline — it is an epigenetic practice that reduces inflammation, extends telomeres, and improves stress regulation.",
    lifestyleFactors: ["daily meditation", "loving-kindness meditation", "body scan", "long-term practice", "consistency"],
    practicalApplication: "Meditation epigenetics protocol: (1) Daily meditation (even 10 minutes) — activates relaxation response gene signature. (2) Loving-kindness meditation — particularly effective for reducing inflammatory gene expression. (3) Body scan — reduces cortisol and stress-response gene activation. (4) Long-term practice (years) — shows the most dramatic epigenetic benefits (telomere length, biological age). (5) Consistency is key — daily practice of 10 minutes is more epigenetically beneficial than weekly practice of 60 minutes.",
  },
  {
    genePathway: "Epigenetics of Social Connection",
    mechanism: "Social Environment and Gene Expression",
    content: "Social environment profoundly shapes the epigenome. Key findings: (1) Social isolation — activates the CTRA (Conserved Transcriptional Response to Adversity) gene expression profile: increased inflammatory genes, decreased antiviral genes. Lonely people have the same inflammatory gene profile as people under chronic stress (Cole et al., 2015). (2) Social rank — in primates, social rank changes the methylation of 1,600 genes, with lower-rank animals showing more inflammatory epigenetic profiles. (3) Oxytocin — social bonding releases oxytocin, which demethylates oxytocin receptor genes, increasing social sensitivity.",
    plainLanguageSummary: "Loneliness is literally inflammatory at the molecular level. Social connection is anti-inflammatory. Your relationships are not just emotionally important — they are epigenetically essential for health and longevity.",
    researchSources: ["Cole et al., PNAS (2015)", "Snyder-Mackler et al., Science (2016)", "Weaver et al., Nature Neuroscience (2004)", "Slavich & Cole, Perspectives on Psychological Science (2013)"],
    ancestralConnection: "The epigenetics of social connection validates the Yoruba concept of Ubuntu — 'I am because we are.' The Yoruba community structure — extended family (Ebi), age grades, lineage groups, Orisha communities — is not merely cultural preference but epigenetic medicine. Isolation is literally inflammatory at the molecular level. Community is anti-inflammatory.",
    lifestyleFactors: ["face-to-face connection", "physical touch", "community participation", "addressing loneliness", "quality relationships"],
    practicalApplication: "Social epigenetics protocol: (1) Prioritise face-to-face connection — digital connection does not activate the same epigenetic pathways as physical presence. (2) Physical touch (hugging, handshakes) — activates oxytocin release and its epigenetic effects. (3) Community participation (groups, ceremonies, shared activities) — reduces CTRA inflammatory gene expression. (4) Addressing loneliness directly — loneliness is a medical condition with epigenetic consequences.",
  },
  {
    genePathway: "Non-coding RNA",
    mechanism: "Gene Regulation",
    content: "Non-coding RNAs (ncRNAs) are RNA molecules that do not encode proteins but regulate gene expression. Major types: (1) MicroRNAs (miRNAs) — small (~22 nucleotide) RNAs that silence gene expression by binding to mRNA. Over 2,000 human miRNAs regulate ~60% of protein-coding genes. (2) Long non-coding RNAs (lncRNAs) — >200 nucleotides, diverse functions including chromatin remodelling, transcription regulation, and RNA processing. ncRNAs are increasingly recognised as key regulators of development, disease, and response to environment. They can be transmitted between cells via exosomes.",
    plainLanguageSummary: "Most of your genome does not code for proteins — it codes for regulatory RNA molecules that control which genes are active. These invisible regulators are influenced by your lifestyle, diet, and environment.",
    researchSources: ["Bartel, Cell (2004)", "Rinn & Chang, Annual Review of Biochemistry (2012)", "Slack & Bhatt, Nature Reviews (2018)"],
    ancestralConnection: "Non-coding RNA is the molecular parallel of Ifá's concept of Ashe in the invisible realm — the regulatory intelligence that shapes manifest reality without being visible itself. Just as Ashe operates through invisible channels to influence events, ncRNAs regulate the genome through invisible molecular channels.",
    lifestyleFactors: ["omega-3 fatty acids", "green tea", "meditation", "social connection", "fasting"],
    practicalApplication: "MicroRNA-influencing practices: (1) Omega-3 fatty acids — modulate miRNA expression in brain and cardiovascular tissue. (2) Green tea (EGCG) — alters miRNA profiles in cancer-protective ways. (3) Meditation — changes miRNA expression related to inflammation and stress response. (4) Social connection — isolation alters miRNA profiles in ways that increase inflammation. (5) Fasting — activates miRNAs associated with cellular repair and longevity.",
  },
  {
    genePathway: "Epigenetics and Cancer",
    mechanism: "Disease Epigenetics",
    content: "Cancer is fundamentally an epigenetic disease as much as a genetic one. Key epigenetic changes in cancer: (1) Global DNA hypomethylation — cancer cells lose methylation across the genome, activating oncogenes and causing chromosomal instability. (2) Promoter hypermethylation — tumour suppressor genes (p16, BRCA1, MLH1) are silenced by hypermethylation. (3) Histone modification changes — altered acetylation and methylation patterns disrupt normal gene regulation. Epigenetic drugs: DNMT inhibitors and HDAC inhibitors are approved cancer treatments. Crucially, epigenetic changes are reversible — unlike genetic mutations.",
    plainLanguageSummary: "Cancer involves epigenetic changes that silence tumour suppressor genes and activate oncogenes. Unlike genetic mutations, epigenetic changes are reversible — which is why epigenetic drugs and lifestyle interventions can be effective cancer treatments.",
    researchSources: ["Jones & Baylin, Nature Reviews Genetics (2002)", "Esteller, Nature Reviews Genetics (2007)", "Baylin & Jones, Nature Reviews Cancer (2011)"],
    ancestralConnection: "The reversibility of epigenetic changes in cancer is the molecular basis of Ifá's concept of Ebo (sacrifice/offering) as a path to healing. In Ifá, even the most serious Arun (illness) can be addressed through the right Ebo — because the underlying pattern (epigenetic, not genetic) can be changed.",
    lifestyleFactors: ["cruciferous vegetables", "green tea", "curcumin", "avoiding tobacco", "maintaining healthy weight", "regular exercise"],
    practicalApplication: "Cancer-protective epigenetic practices: (1) Cruciferous vegetables (broccoli, cauliflower, Brussels sprouts) — sulforaphane inhibits HDACs, reactivates tumour suppressor genes. (2) Green tea (EGCG) — inhibits DNMT, reactivates silenced tumour suppressor genes. (3) Curcumin — modulates multiple epigenetic pathways with anti-cancer effects. (4) Avoid tobacco — causes widespread aberrant methylation, silencing tumour suppressor genes.",
  },
  {
    genePathway: "Circadian Epigenetics",
    mechanism: "Sleep and Circadian Rhythm",
    content: "Sleep is a critical epigenetic regulator. The circadian clock — the body's 24-hour rhythm — is controlled by a network of clock genes (CLOCK, BMAL1, PER1/2/3, CRY1/2) whose expression is regulated by rhythmic histone acetylation and DNA methylation. Sleep deprivation causes: (1) Widespread DNA methylation changes in 369 genes after one week of partial sleep deprivation. (2) Reduced BDNF expression. (3) Increased inflammatory gene expression. (4) Accelerated epigenetic aging. Shift work — which disrupts circadian epigenetics — is classified as a probable carcinogen by the WHO.",
    plainLanguageSummary: "Sleep is when your epigenome is repaired and maintained. Sleep deprivation causes rapid, widespread epigenetic damage. Consistent sleep timing — same bedtime and wake time every day — is the most important circadian epigenetics intervention.",
    researchSources: ["Archer et al., PNAS (2014)", "Cedernaes et al., Science Advances (2018)", "Huang et al., Sleep (2018)", "IARC Monograph 98 (2010)"],
    ancestralConnection: "The circadian epigenetics of sleep validates the Yoruba concept of Oru (night) as sacred time. In Ifá tradition, certain rituals and consultations are performed at night — not merely for secrecy, but because night is when the veil between worlds is thinnest. This is the epigenetic reality: night is when the body performs its most critical epigenetic maintenance.",
    lifestyleFactors: ["consistent sleep timing", "morning light exposure", "darkness before bed", "eating timing", "cool bedroom", "7-9 hours duration"],
    practicalApplication: "Circadian epigenetics protocol: (1) Consistent sleep timing — same bedtime and wake time 7 days/week (most important factor). (2) Light management — bright light exposure in morning, darkness 2 hours before bed. (3) Eating timing — finish eating 3 hours before bed. (4) Temperature — cool bedroom (18-20°C) supports circadian gene expression. (5) 7-9 hours duration — minimum for epigenetic repair.",
  },
];

export async function seedDomainKnowledge() {
  const db = await getDb();
  if (!db) {
    console.log("[Seed] No database connection available.");
    return;
  }

  const { quantumKnowledge: qTable, psychologyKnowledge: pTable, epigeneticsKnowledge: eTable } = await import("../drizzle/schema");
  const { count } = await import("drizzle-orm");

  const [qCount] = await db.select({ cnt: count() }).from(qTable);
  const [pCount] = await db.select({ cnt: count() }).from(pTable);
  const [eCount] = await db.select({ cnt: count() }).from(eTable);

  console.log(`[Seed] Current counts — quantum: ${qCount.cnt}, psychology: ${pCount.cnt}, epigenetics: ${eCount.cnt}`);

  // Seed quantum knowledge
  if (Number(qCount.cnt) < 10) {
    console.log("[Seed] Seeding quantum knowledge...");
    for (const entry of QUANTUM_ENTRIES) {
      try {
        await db.insert(qTable).values(entry);
      } catch {
        // Skip duplicates
      }
    }
    console.log(`[Seed] Inserted ${QUANTUM_ENTRIES.length} quantum knowledge entries.`);
  } else {
    console.log(`[Seed] Quantum knowledge already seeded (${qCount.cnt} entries). Skipping.`);
  }

  // Seed psychology knowledge
  if (Number(pCount.cnt) < 10) {
    console.log("[Seed] Seeding psychology knowledge...");
    for (const entry of PSYCHOLOGY_ENTRIES) {
      try {
        await db.insert(pTable).values(entry);
      } catch {
        // Skip duplicates
      }
    }
    console.log(`[Seed] Inserted ${PSYCHOLOGY_ENTRIES.length} psychology knowledge entries.`);
  } else {
    console.log(`[Seed] Psychology knowledge already seeded (${pCount.cnt} entries). Skipping.`);
  }

  // Seed epigenetics knowledge
  if (Number(eCount.cnt) < 10) {
    console.log("[Seed] Seeding epigenetics knowledge...");
    for (const entry of EPIGENETICS_ENTRIES) {
      try {
        await db.insert(eTable).values(entry);
      } catch {
        // Skip duplicates
      }
    }
    console.log(`[Seed] Inserted ${EPIGENETICS_ENTRIES.length} epigenetics knowledge entries.`);
  } else {
    console.log(`[Seed] Epigenetics knowledge already seeded (${eCount.cnt} entries). Skipping.`);
  }

  console.log("[Seed] Domain knowledge seeding complete.");
}
