/**
 * Unstor Knowledge Seed Script
 * Seeds the ifa_odu and medicine_knowledge tables with foundational data.
 * Run once via: npx tsx server/seedKnowledge.ts
 */
import { getDb } from "./db";
import { ifaOdu, medicineKnowledge } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── All 256 Odù Ifá (16 principal × 16 combinations) ────────────────────────

const PRINCIPAL_ODU = [
  "Ogbe", "Oyeku", "Iwori", "Odi", "Irosun", "Owonrin", "Obara", "Okanran",
  "Ogunda", "Osa", "Ika", "Oturupon", "Otura", "Irete", "Ose", "Ofun",
];

// Detailed data for the 16 principal (Meji) Odù
const PRINCIPAL_ODU_DATA: Record<string, {
  summary: string;
  themes: string[];
  eseVerses: string;
  taboos: string;
  prescriptions: string;
  lifeApplications: string;
  herbs: string[];
  offerings: string[];
  colors: string[];
  numbers: number[];
  deities: string[];
}> = {
  Ogbe: {
    summary: "Ogbe Meji is the first and most senior Odù. It speaks of light, new beginnings, divine favour, and the power of creation. Ogbe is the Odù of Orunmila himself — the oracle of wisdom.",
    themes: ["new beginnings", "light", "divine favour", "creation", "wisdom", "prosperity"],
    eseVerses: "Ogbe ni ebo — Ogbe is the sacrifice. The sun rises and all darkness flees. What was hidden becomes visible. The child of Ogbe walks in light and all doors open before them. Orunmila cast Ifá for the day when creation was born, and Ogbe was the first word spoken.",
    taboos: "Avoid palm oil on the day of Ogbe worship. Do not eat snail. Avoid conflict and harsh speech. Do not begin new ventures during a period of personal conflict.",
    prescriptions: "Offer white cloth and white kola nut to Obatala. Light a white candle at dawn and pray facing east. Offer honey and cool water to Orunmila. Wear white or light colours during the period of this Odù.",
    lifeApplications: "Ogbe governs new beginnings, business launches, births, and fresh starts. When Ogbe appears, it signals divine support for your endeavour. Move forward with confidence. Clear obstacles through prayer rather than force.",
    herbs: ["Ewe Tete (Amaranth)", "Ewe Efinrin (Basil)", "Ewe Laali (Henna)", "Ewe Iyeye (White flowers)"],
    offerings: ["White kola nut", "White cloth", "Honey", "Cool water", "White candle"],
    colors: ["white", "silver", "gold"],
    numbers: [1, 8, 16],
    deities: ["Orunmila", "Obatala", "Esu"],
  },
  Oyeku: {
    summary: "Oyeku Meji is the Odù of death, endings, and transformation. It governs the night, the ancestors, and the transition between worlds. Oyeku is not feared but respected — it brings completion and opens the way for rebirth.",
    themes: ["death", "endings", "transformation", "ancestors", "night", "completion", "rebirth"],
    eseVerses: "Oyeku is the night that swallows the day. The ancestors speak through Oyeku. What must end, ends. What must be reborn, is reborn. Orunmila cast Ifá for the night, and the night said: I am not your enemy — I am the womb of tomorrow.",
    taboos: "Do not wear black unnecessarily during Oyeku period. Avoid cemeteries without spiritual protection. Do not speak ill of the dead. Avoid beginning new projects during Oyeku without first honouring the ancestors.",
    prescriptions: "Honour your ancestors with black-eyed peas, palm wine, and kola nut. Light a black candle and speak the names of your departed loved ones. Offer a white cloth to the Egungun (ancestor masquerade). Perform spiritual cleansing.",
    lifeApplications: "Oyeku governs endings, funerals, estate matters, and ancestral healing. When Oyeku appears, it may signal the end of a chapter — but also the beginning of a new one. Release what no longer serves you. Honour your lineage.",
    herbs: ["Ewe Iku (Death plant)", "Ewe Ogbo (Longevity herb)", "Ewe Iyeye", "Bitter leaf (Ewe Ewuro)"],
    offerings: ["Black-eyed peas", "Palm wine", "Kola nut", "Black cloth", "Cowries"],
    colors: ["black", "dark purple", "white"],
    numbers: [2, 9, 11],
    deities: ["Oya", "Egungun", "Ogun"],
  },
  Iwori: {
    summary: "Iwori Meji is the Odù of the heart and inner vision. It governs intuition, self-knowledge, spiritual sight, and the mysteries of the inner world. Iwori teaches that true knowledge comes from within.",
    themes: ["inner vision", "intuition", "self-knowledge", "heart", "spiritual sight", "mystery"],
    eseVerses: "Iwori sees what the eyes cannot see. The heart knows before the mind understands. Orunmila cast Ifá for the one who sought truth within themselves, and Iwori said: Look inward — the universe lives inside you.",
    taboos: "Avoid deception and self-deception. Do not ignore your intuition. Avoid excessive external stimulation during periods of spiritual work.",
    prescriptions: "Meditate daily. Offer indigo cloth and blue beads to Yemoja. Keep a dream journal. Pray at midnight for inner clarity.",
    lifeApplications: "Iwori governs spiritual development, psychic gifts, inner healing, and self-discovery. When Iwori appears, trust your instincts. Go within for answers. Spiritual practices will be especially powerful now.",
    herbs: ["Ewe Omi (Water plant)", "Blue lotus", "Lavender", "Ewe Iyeye"],
    offerings: ["Blue cloth", "Indigo beads", "Cool water", "Fish", "Coconut"],
    colors: ["blue", "indigo", "deep purple"],
    numbers: [3, 7, 13],
    deities: ["Yemoja", "Olokun", "Orunmila"],
  },
  Odi: {
    summary: "Odi Meji is the Odù of the womb, secrets, and hidden things. It governs fertility, pregnancy, hidden enemies, and the power of what is concealed. Odi teaches that what is hidden holds great power.",
    themes: ["womb", "fertility", "secrets", "hidden things", "pregnancy", "concealment", "power"],
    eseVerses: "Odi holds the secrets of the womb. What is hidden grows in darkness. The seed knows nothing of the sun until it breaks through the earth. Orunmila cast Ifá for the pregnant woman, and Odi said: What grows inside you is sacred.",
    taboos: "Do not reveal secrets prematurely. Avoid gossip. Pregnant women should be especially careful during Odi periods. Do not expose hidden plans before they are ready.",
    prescriptions: "Offer cowries and white cloth to Yemoja for fertility blessings. Perform a ritual bath with herbs for protection of secrets. Pray for protection of what you are nurturing.",
    lifeApplications: "Odi governs pregnancy, fertility treatments, hidden enemies, secret plans, and underground work. When Odi appears, protect what you are building. Not everything needs to be shared. Trust the process of gestation.",
    herbs: ["Ewe Ato (Castor plant)", "Ewe Iyeye", "Aloe vera", "Moringa (Ewe Igbale)"],
    offerings: ["Cowries", "White cloth", "Fish", "Yam", "Coconut water"],
    colors: ["white", "light blue", "cream"],
    numbers: [4, 8, 12],
    deities: ["Yemoja", "Oshun", "Obatala"],
  },
  Irosun: {
    summary: "Irosun Meji is the Odù of blood, iron, and the power of sacrifice. It governs healing through sacrifice, the power of the blood covenant, and the mysteries of iron and war.",
    themes: ["blood", "sacrifice", "healing", "iron", "war", "covenant", "power"],
    eseVerses: "Irosun is the blood that speaks. The iron knows the hand that holds it. Sacrifice is not loss — it is transformation. Orunmila cast Ifá for the warrior who sought healing, and Irosun said: Your blood carries the memory of your ancestors.",
    taboos: "Avoid unnecessary bloodshed. Do not break sacred covenants. Avoid iron tools during menstruation without spiritual protection.",
    prescriptions: "Offer red palm oil and red kola nut to Ogun. Perform a blood covenant renewal ceremony. Wear red beads for protection.",
    lifeApplications: "Irosun governs surgery, healing through sacrifice, legal battles, and matters requiring courage. When Irosun appears, be prepared to sacrifice something for what you truly want. The blood remembers.",
    herbs: ["Ewe Efinrin (Basil)", "Ewe Tete (Amaranth)", "Cayenne pepper", "Camwood (Osun)"],
    offerings: ["Red palm oil", "Red kola nut", "Iron implements", "Red cloth", "Camwood"],
    colors: ["red", "crimson", "dark red"],
    numbers: [5, 10, 15],
    deities: ["Ogun", "Shango", "Orunmila"],
  },
  Owonrin: {
    summary: "Owonrin Meji is the Odù of chaos, unpredictability, and sudden change. It governs the trickster energy, unexpected events, and the power of disruption to create new order.",
    themes: ["chaos", "unpredictability", "change", "trickster", "disruption", "lightning"],
    eseVerses: "Owonrin dances where others fear to step. The unexpected is Owonrin's gift. Lightning strikes not where it is expected. Orunmila cast Ifá for the one who feared change, and Owonrin said: I am the chaos that creates order.",
    taboos: "Do not resist necessary change. Avoid stubbornness during Owonrin periods. Do not ignore warning signs of instability.",
    prescriptions: "Offer pepper and palm wine to Esu. Perform a crossroads ritual for clarity. Embrace flexibility and adaptability.",
    lifeApplications: "Owonrin governs sudden changes, unexpected opportunities, creative disruption, and trickster energy. When Owonrin appears, expect the unexpected. Be flexible. What seems like chaos may be divine reorganisation.",
    herbs: ["Pepper (Ata)", "Ewe Efinrin", "Ginger (Atale)", "Cloves"],
    offerings: ["Pepper", "Palm wine", "Rum", "Crossroads offerings", "Red and black beads"],
    colors: ["red", "black", "yellow"],
    numbers: [6, 11, 16],
    deities: ["Esu", "Shango", "Ogun"],
  },
  Obara: {
    summary: "Obara Meji is the Odù of royalty, leadership, and divine authority. It governs kings, chiefs, and those born to lead. Obara teaches the responsibilities and privileges of power.",
    themes: ["royalty", "leadership", "authority", "power", "dignity", "responsibility"],
    eseVerses: "Obara walks with the dignity of kings. The crown is not worn — it is lived. Leadership is service dressed in authority. Orunmila cast Ifá for the king who doubted his throne, and Obara said: Your authority comes from the divine.",
    taboos: "Do not abuse authority. Avoid arrogance and pride. Do not demean those under your care.",
    prescriptions: "Offer yellow cloth and honey to Oshun. Wear gold and yellow for empowerment. Pray for wisdom in leadership.",
    lifeApplications: "Obara governs leadership positions, promotions, royal lineage, and matters of authority. When Obara appears, step into your power with grace and responsibility. Leadership is calling you.",
    herbs: ["Ewe Iyeye", "Turmeric", "Saffron", "Calendula"],
    offerings: ["Yellow cloth", "Honey", "Gold beads", "Pumpkin", "Yellow flowers"],
    colors: ["yellow", "gold", "orange"],
    numbers: [6, 12, 18],
    deities: ["Oshun", "Obatala", "Orunmila"],
  },
  Okanran: {
    summary: "Okanran Meji is the Odù of conflict, confrontation, and the power of direct action. It governs battles, arguments, and the energy needed to overcome obstacles through force.",
    themes: ["conflict", "confrontation", "battle", "direct action", "obstacles", "force"],
    eseVerses: "Okanran does not retreat. The warrior who knows their cause fights without fear. Conflict is not always destruction — sometimes it is the clearing of the path. Orunmila cast Ifá for the one facing enemies, and Okanran said: Stand your ground with righteousness.",
    taboos: "Avoid unnecessary conflicts. Do not pick battles you cannot win. Avoid violence without just cause.",
    prescriptions: "Offer iron implements and palm wine to Ogun. Perform a protection ritual. Carry iron for protection.",
    lifeApplications: "Okanran governs legal battles, conflicts, confrontations, and situations requiring direct action. When Okanran appears, be prepared to fight for what is right. Choose your battles wisely but do not back down from just causes.",
    herbs: ["Ewe Ogbo", "Ewe Efinrin", "Bitter leaf", "Alligator pepper (Atare)"],
    offerings: ["Iron implements", "Palm wine", "Kola nut", "Rum", "Red cloth"],
    colors: ["red", "black", "dark green"],
    numbers: [7, 13, 19],
    deities: ["Ogun", "Shango", "Esu"],
  },
  Ogunda: {
    summary: "Ogunda Meji is the Odù of Ogun — the deity of iron, roads, and clearing the way. It governs new paths, surgery, technology, and the power to cut through obstacles.",
    themes: ["iron", "roads", "clearing", "surgery", "technology", "new paths", "Ogun"],
    eseVerses: "Ogunda opens the road that was closed. The machete of Ogun clears the bush. Where there was no path, Ogunda makes one. Orunmila cast Ifá for the traveller lost in the forest, and Ogunda said: I will clear the way.",
    taboos: "Do not abandon tools carelessly. Avoid leaving iron implements uncleaned. Do not block the roads of others.",
    prescriptions: "Offer palm wine and kola nut to Ogun at a crossroads. Feed iron implements with palm oil. Pray at the roadside for clear paths.",
    lifeApplications: "Ogunda governs surgery, new ventures, road clearing, technology, and overcoming obstacles. When Ogunda appears, the path will be cleared. Move forward. Obstacles will fall before you.",
    herbs: ["Ewe Efinrin", "Ewe Tete", "Moringa", "Bitter leaf"],
    offerings: ["Palm wine", "Kola nut", "Dog meat (traditional)", "Iron implements", "Palm oil"],
    colors: ["green", "black", "dark green"],
    numbers: [3, 7, 9],
    deities: ["Ogun", "Esu", "Orunmila"],
  },
  Osa: {
    summary: "Osa Meji is the Odù of Oya — the deity of storms, change, and the marketplace of the dead. It governs sudden reversals, female power, and the transformative force of the wind.",
    themes: ["storms", "change", "female power", "reversals", "wind", "marketplace", "Oya"],
    eseVerses: "Osa is the storm that rearranges the world. Oya dances in the whirlwind. What was standing falls; what was fallen rises. Orunmila cast Ifá for the woman who commanded the wind, and Osa said: Your power is in your transformation.",
    taboos: "Do not resist the winds of change. Avoid clinging to what must go. Do not underestimate the power of women.",
    prescriptions: "Offer purple cloth and plums to Oya. Perform a wind ritual for transformation. Embrace necessary endings.",
    lifeApplications: "Osa governs sudden changes, female empowerment, business reversals, and transformative storms. When Osa appears, a major shift is coming. Align yourself with the change rather than fighting it.",
    herbs: ["Ewe Iyeye", "Purple basil", "Eggplant leaves", "Bitter leaf"],
    offerings: ["Purple cloth", "Plums", "Eggplant", "Nine different fruits", "Wind offerings"],
    colors: ["purple", "brown", "dark red"],
    numbers: [9, 11, 13],
    deities: ["Oya", "Egungun", "Shango"],
  },
  Ika: {
    summary: "Ika Meji is the Odù of stubbornness, persistence, and the power of the individual will. It governs those who refuse to be broken and teaches the balance between determination and flexibility.",
    themes: ["stubbornness", "persistence", "individual will", "determination", "resilience"],
    eseVerses: "Ika bends but does not break. The stubborn tree survives the storm. Persistence is not pride — it is faith in one's purpose. Orunmila cast Ifá for the one who refused to give up, and Ika said: Your stubbornness is your strength.",
    taboos: "Do not be stubborn about the wrong things. Avoid pride that prevents learning. Do not mistake stubbornness for wisdom.",
    prescriptions: "Offer white kola nut and cool water to Obatala. Perform a ritual for clarity of purpose. Pray for wisdom to know when to persist and when to yield.",
    lifeApplications: "Ika governs long-term projects, persistence in the face of opposition, and matters requiring sustained will. When Ika appears, do not give up. Your persistence will be rewarded.",
    herbs: ["Ewe Tete", "Aloe vera", "Moringa", "Ewe Efinrin"],
    offerings: ["White kola nut", "Cool water", "White cloth", "Shea butter", "White flowers"],
    colors: ["white", "grey", "silver"],
    numbers: [4, 8, 14],
    deities: ["Obatala", "Orunmila", "Esu"],
  },
  Oturupon: {
    summary: "Oturupon Meji is the Odù of reversal, unexpected help, and the power of the underdog. It governs situations where the least expected source brings salvation.",
    themes: ["reversal", "unexpected help", "underdog", "salvation", "surprise", "humility"],
    eseVerses: "Oturupon comes from where you least expect. The help that saves you will surprise you. Humility opens doors that pride cannot. Orunmila cast Ifá for the one who had been overlooked, and Oturupon said: Your time of reversal has come.",
    taboos: "Do not overlook those who seem insignificant. Avoid pride and arrogance. Do not dismiss unexpected sources of help.",
    prescriptions: "Offer food to the poor and forgotten. Perform acts of unexpected kindness. Pray for divine reversals in your favour.",
    lifeApplications: "Oturupon governs unexpected reversals of fortune, help from unlikely sources, and the power of humility. When Oturupon appears, look for help in unexpected places. A reversal is coming in your favour.",
    herbs: ["Ewe Efinrin", "Bitter leaf", "Ewe Ogbo", "Aloe vera"],
    offerings: ["Food for the poor", "Kola nut", "Palm wine", "Humble offerings"],
    colors: ["green", "brown", "earth tones"],
    numbers: [10, 12, 16],
    deities: ["Esu", "Orunmila", "Obatala"],
  },
  Otura: {
    summary: "Otura Meji is the Odù of Obatala — the deity of creation, purity, and divine wisdom. It governs matters of the head, mental clarity, and the highest spiritual principles.",
    themes: ["purity", "creation", "mental clarity", "divine wisdom", "head", "Obatala"],
    eseVerses: "Otura is the white cloth of creation. Obatala moulded the first human from clay. The head that is clear sees the path of destiny. Orunmila cast Ifá for the sculptor of souls, and Otura said: Create with purity of intention.",
    taboos: "Avoid impure thoughts and actions. Do not consume alcohol excessively. Avoid conflict and violence. Keep the head clean and protected.",
    prescriptions: "Offer white cloth and shea butter to Obatala. Wear white for spiritual protection. Perform head cleansing ceremonies (ori cleansing).",
    lifeApplications: "Otura governs mental health, spiritual development, creative work, and matters of the head and destiny. When Otura appears, purify your intentions. Your ori (personal destiny) is being aligned.",
    herbs: ["Ewe Iyeye", "White flowers", "Shea butter plant", "Ewe Tete"],
    offerings: ["White cloth", "Shea butter", "White kola nut", "Coconut", "White chalk (efun)"],
    colors: ["white", "silver", "pale blue"],
    numbers: [8, 16, 24],
    deities: ["Obatala", "Orunmila", "Ori"],
  },
  Irete: {
    summary: "Irete Meji is the Odù of Orunmila himself — the embodiment of wisdom, divination, and the complete knowledge of Ifá. It governs the highest mysteries of the tradition.",
    themes: ["wisdom", "divination", "Orunmila", "knowledge", "Ifá mysteries", "completeness"],
    eseVerses: "Irete is the word of Orunmila. All wisdom flows from this Odù. The diviner who casts Irete stands at the source of all knowledge. Orunmila cast Ifá for himself, and Irete said: I am the beginning and the end of all knowing.",
    taboos: "Do not misuse divination knowledge. Avoid sharing sacred mysteries with the uninitiated. Do not use Ifá for harmful purposes.",
    prescriptions: "Offer kola nut and palm wine to Orunmila. Study the Ifá corpus deeply. Seek initiation if called. Honour your Ifá priest.",
    lifeApplications: "Irete governs divination practice, spiritual initiation, deep wisdom, and the mastery of Ifá. When Irete appears, you are being called to deeper spiritual knowledge. Seek a qualified Babaláwo.",
    herbs: ["Ewe Efinrin", "Ewe Tete", "Obi kola", "Ewe Iyeye"],
    offerings: ["Kola nut", "Palm wine", "Obi kola", "Orogbo (bitter kola)", "Obi abata"],
    colors: ["green", "yellow", "gold"],
    numbers: [4, 8, 16],
    deities: ["Orunmila", "Esu", "Obatala"],
  },
  Ose: {
    summary: "Ose Meji is the Odù of Oshun — the deity of love, beauty, fertility, and sweet waters. It governs romance, attraction, abundance, and the power of feminine beauty.",
    themes: ["love", "beauty", "fertility", "Oshun", "romance", "abundance", "sweetness"],
    eseVerses: "Ose is the sweetness of Oshun's river. Love flows where beauty leads. Abundance is the natural state of those who love freely. Orunmila cast Ifá for the one who sought love, and Ose said: Open your heart — love is already flowing toward you.",
    taboos: "Do not be bitter or withhold love. Avoid jealousy in matters of the heart. Do not pollute rivers or water sources.",
    prescriptions: "Offer honey and yellow cloth to Oshun. Perform a love bath with sweet herbs. Pray at a river for love and abundance.",
    lifeApplications: "Ose governs love relationships, fertility, financial abundance, beauty, and matters of the heart. When Ose appears, love and abundance are flowing. Open yourself to receive.",
    herbs: ["Ewe Iyeye", "Rose", "Jasmine", "Cinnamon", "Honey plant"],
    offerings: ["Honey", "Yellow cloth", "Gold beads", "Pumpkin", "Sweet fruits"],
    colors: ["yellow", "gold", "amber", "orange"],
    numbers: [5, 10, 15],
    deities: ["Oshun", "Yemoja", "Obatala"],
  },
  Ofun: {
    summary: "Ofun Meji is the sixteenth and final principal Odù — the Odù of completion, the end of cycles, and the return to the source. It governs death, rebirth, and the ultimate mysteries of existence.",
    themes: ["completion", "cycles", "death", "rebirth", "source", "ultimate mystery", "endings"],
    eseVerses: "Ofun is the last word and the first silence. All cycles return to their source. The end is not destruction — it is the doorway to the next beginning. Orunmila cast Ifá for the one who had completed their journey, and Ofun said: You have come full circle.",
    taboos: "Do not fear endings. Avoid clinging to what has completed its cycle. Do not ignore the signs of completion.",
    prescriptions: "Honour all your ancestors. Perform completion rituals for endings in your life. Offer to both the living and the dead.",
    lifeApplications: "Ofun governs the completion of major life cycles, ancestral healing, final resolutions, and preparation for new beginnings. When Ofun appears, a major cycle is completing. Honour it with gratitude.",
    herbs: ["Ewe Ogbo", "Bitter leaf", "Ewe Iku", "Moringa"],
    offerings: ["Offerings to all Orishas", "Ancestral food", "Kola nut", "Palm wine", "White and black cloth"],
    colors: ["black", "white", "all colours"],
    numbers: [16, 32, 256],
    deities: ["All Orishas", "Egungun", "Orunmila"],
  },
};

// Generate all 256 Odù
function generateAllOdu(): Array<{
  oduNumber: number;
  primaryName: string;
  alternateNames: string[];
  category: string;
  majorOdu: boolean;
  parentOdu: string | null;
  summary: string;
  themes: string[];
  eseVerses: string;
  taboos: string;
  prescriptions: string;
  lifeApplications: string;
  herbs: string[];
  offerings: string[];
  colors: string[];
  numbers: number[];
  deities: string[];
}> {
  const odus = [];
  let oduNumber = 1;

  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      const firstName = PRINCIPAL_ODU[i];
      const secondName = PRINCIPAL_ODU[j];
      const isMeji = i === j;
      const primaryName = isMeji ? `${firstName} Meji` : `${firstName} ${secondName}`;
      const parentOdu = isMeji ? null : firstName;

      const baseData = PRINCIPAL_ODU_DATA[firstName];
      const secondData = PRINCIPAL_ODU_DATA[secondName];

      const summary = isMeji
        ? baseData.summary
        : `${primaryName} combines the energies of ${firstName} and ${secondName}. ${baseData.summary.split(".")[0]}. The influence of ${secondName} adds: ${secondData.summary.split(".")[0]}.`;

      odus.push({
        oduNumber,
        primaryName,
        alternateNames: isMeji ? [`${firstName} Meji`, firstName] : [primaryName],
        category: isMeji ? "principal" : "compound",
        majorOdu: isMeji,
        parentOdu,
        summary,
        themes: Array.from(new Set([...baseData.themes, ...(isMeji ? [] : secondData.themes.slice(0, 2))])),

        eseVerses: isMeji ? baseData.eseVerses : `${baseData.eseVerses.split(".")[0]}. The second voice speaks: ${secondData.eseVerses.split(".")[0]}.`,
        taboos: isMeji ? baseData.taboos : baseData.taboos,
        prescriptions: isMeji ? baseData.prescriptions : baseData.prescriptions,
        lifeApplications: isMeji ? baseData.lifeApplications : `${baseData.lifeApplications} The ${secondName} influence adds: ${secondData.lifeApplications.split(".")[0]}.`,
        herbs: Array.from(new Set([...baseData.herbs, ...(isMeji ? [] : secondData.herbs.slice(0, 2))])),

        offerings: isMeji ? baseData.offerings : baseData.offerings,
        colors: Array.from(new Set([...baseData.colors, ...(isMeji ? [] : secondData.colors.slice(0, 1))])),

        numbers: isMeji ? baseData.numbers : [baseData.numbers[0], secondData.numbers[0]],
        deities: Array.from(new Set([...baseData.deities, ...(isMeji ? [] : secondData.deities.slice(0, 1))])),

      });

      oduNumber++;
    }
  }

  return odus;
}

// ─── Medicine Knowledge Seed Data ─────────────────────────────────────────────

const MEDICINE_SEED = [
  // ── Yoruba / African Traditional ──────────────────────────────────────────
  {
    tradition: "ifa_yoruba" as const,
    herbName: "Ewe Efinrin (African Basil)",
    localNames: ["Efinrin", "Nchanwu", "Efirin"],
    scientificName: "Ocimum gratissimum",
    category: "Aromatic herb",
    uses: "Used extensively in Yoruba medicine for fever, malaria, respiratory infections, skin conditions, and spiritual cleansing. A cornerstone herb in Ifá medicine.",
    preparation: "Fresh leaves boiled as tea, or crushed and applied topically. Leaves can be burned as incense for spiritual cleansing.",
    dosage: "1-2 cups of tea daily for medicinal use. Topical application as needed.",
    contraindications: "Avoid in large doses during pregnancy. May interact with blood thinners.",
    interactions: "May enhance the effects of anticoagulant medications.",
    properties: ["antimicrobial", "anti-inflammatory", "antifungal", "aromatic", "spiritual cleansing"],
    conditions: ["fever", "malaria", "respiratory infections", "skin conditions", "spiritual purification"],
    bodyParts: ["respiratory system", "skin", "immune system"],
    relatedOdu: ["Ogbe Meji", "Ogunda Meji"],
    sources: ["Yoruba traditional medicine", "Ifá corpus"],
  },
  {
    tradition: "ifa_yoruba" as const,
    herbName: "Ewe Tete (Amaranth)",
    localNames: ["Tete", "Shoko", "Arowo jeja"],
    scientificName: "Amaranthus hybridus",
    category: "Leafy vegetable / medicinal herb",
    uses: "Used in Yoruba medicine for anaemia, malnutrition, digestive issues, and as a spiritual herb for Ogbe Odù. Rich in iron and vitamins.",
    preparation: "Cooked as vegetable soup, or dried and powdered for medicinal preparations.",
    dosage: "As food: regular consumption. Medicinal: 2-3 cups of leaf tea daily.",
    contraindications: "High oxalate content — caution for kidney stone patients.",
    interactions: "May affect iron absorption medications.",
    properties: ["iron-rich", "nutritive", "blood-building", "digestive"],
    conditions: ["anaemia", "malnutrition", "digestive disorders", "blood deficiency"],
    bodyParts: ["blood", "digestive system", "immune system"],
    relatedOdu: ["Ogbe Meji", "Irosun Meji"],
    sources: ["Yoruba traditional medicine"],
  },
  {
    tradition: "ifa_yoruba" as const,
    herbName: "Moringa (Ewe Igbale / Ewe Ile)",
    localNames: ["Igbale", "Ewe Ile", "Zogale", "Drumstick tree"],
    scientificName: "Moringa oleifera",
    category: "Superfood / medicinal tree",
    uses: "Called the 'miracle tree' in African medicine. Used for malnutrition, diabetes, hypertension, inflammation, and as a general tonic. All parts are medicinal.",
    preparation: "Leaves dried and powdered, added to food or water. Fresh leaves cooked as vegetable. Seeds pressed for oil.",
    dosage: "1-2 teaspoons of powder daily. Fresh leaves as regular food.",
    contraindications: "Root bark may cause uterine contractions — avoid in pregnancy. High doses may lower blood pressure excessively.",
    interactions: "May enhance effects of antidiabetic and antihypertensive medications.",
    properties: ["nutritive", "anti-inflammatory", "antioxidant", "antidiabetic", "antihypertensive"],
    conditions: ["malnutrition", "diabetes", "hypertension", "inflammation", "anaemia"],
    bodyParts: ["blood", "cardiovascular system", "immune system", "liver"],
    relatedOdu: ["Ogunda Meji", "Ika Meji"],
    sources: ["African traditional medicine", "Yoruba medicine"],
  },
  {
    tradition: "ifa_yoruba" as const,
    herbName: "Bitter Leaf (Ewe Ewuro)",
    localNames: ["Ewuro", "Onugbu", "Etidot"],
    scientificName: "Vernonia amygdalina",
    category: "Medicinal shrub",
    uses: "One of the most important herbs in Yoruba and pan-African medicine. Used for malaria, diabetes, liver disease, digestive issues, and as a general detoxifier.",
    preparation: "Fresh leaves squeezed for juice, or boiled as tea. Leaves washed and used in soups.",
    dosage: "Half cup of fresh juice daily for medicinal use. As food: regular consumption in soups.",
    contraindications: "Avoid excessive use in pregnancy. May lower blood sugar significantly.",
    interactions: "Enhances antidiabetic medications. May interact with anticoagulants.",
    properties: ["antimalarial", "antidiabetic", "hepatoprotective", "bitter tonic", "detoxifying"],
    conditions: ["malaria", "diabetes", "liver disease", "digestive disorders", "fever"],
    bodyParts: ["liver", "blood", "digestive system", "immune system"],
    relatedOdu: ["Okanran Meji", "Osa Meji"],
    sources: ["Yoruba traditional medicine", "Pan-African medicine"],
  },
  {
    tradition: "ifa_yoruba" as const,
    herbName: "Alligator Pepper (Atare / Obi Ata)",
    localNames: ["Atare", "Obi Ata", "Grains of Selim"],
    scientificName: "Aframomum melegueta",
    category: "Spice / sacred herb",
    uses: "Sacred in Ifá tradition — used in almost every ritual. Medicinally used for digestive issues, respiratory conditions, and as an aphrodisiac. Spiritually used for protection and blessing.",
    preparation: "Seeds chewed raw, or ground into powder for medicinal preparations. Used whole in rituals.",
    dosage: "3-7 seeds chewed daily for digestive health. Ritual use as prescribed by Babaláwo.",
    contraindications: "Avoid in large doses during pregnancy.",
    interactions: "May interact with blood pressure medications.",
    properties: ["digestive", "aphrodisiac", "antimicrobial", "sacred", "protective"],
    conditions: ["digestive disorders", "respiratory conditions", "sexual dysfunction", "spiritual protection"],
    bodyParts: ["digestive system", "respiratory system", "reproductive system"],
    relatedOdu: ["Owonrin Meji", "Okanran Meji"],
    sources: ["Ifá corpus", "Yoruba traditional medicine"],
  },
  // ── Chinese TCM ──────────────────────────────────────────────────────────
  {
    tradition: "chinese_tcm" as const,
    herbName: "Ginseng (Ren Shen)",
    localNames: ["Ren Shen", "Korean Ginseng", "Asian Ginseng"],
    scientificName: "Panax ginseng",
    category: "Adaptogen / tonic",
    uses: "The most revered herb in Chinese medicine. Used to tonify Qi (vital energy), strengthen the immune system, improve cognitive function, reduce fatigue, and as a general longevity tonic.",
    preparation: "Sliced root boiled in water as tea, or taken as powder or extract. Often combined with other herbs in formulas.",
    dosage: "1-2g of root per day as tea. 200-400mg of standardised extract daily.",
    contraindications: "Avoid with high blood pressure. Not recommended for acute infections. Avoid during pregnancy without guidance.",
    interactions: "May interact with blood thinners, diabetes medications, and stimulants.",
    properties: ["adaptogenic", "immune-tonic", "cognitive-enhancing", "anti-fatigue", "longevity"],
    conditions: ["fatigue", "immune deficiency", "cognitive decline", "stress", "sexual dysfunction"],
    bodyParts: ["immune system", "nervous system", "adrenal glands", "cardiovascular system"],
    relatedOdu: ["Ogbe Meji", "Otura Meji"],
    sources: ["Traditional Chinese Medicine", "Shennong Bencao Jing"],
  },
  {
    tradition: "chinese_tcm" as const,
    herbName: "Astragalus (Huang Qi)",
    localNames: ["Huang Qi", "Milk Vetch Root"],
    scientificName: "Astragalus membranaceus",
    category: "Immune tonic / adaptogen",
    uses: "One of the most important Qi tonics in Chinese medicine. Strengthens the immune system, protects the heart, reduces fatigue, and is used in cancer support protocols.",
    preparation: "Sliced root boiled in soups and teas. Available as powder, capsules, or tincture.",
    dosage: "9-30g of dried root per day in decoction. 500mg-1g of extract twice daily.",
    contraindications: "Avoid during acute infections. Caution with autoimmune conditions.",
    interactions: "May interact with immunosuppressant medications.",
    properties: ["immune-modulating", "adaptogenic", "cardioprotective", "anti-fatigue", "antioxidant"],
    conditions: ["immune deficiency", "chronic fatigue", "heart disease", "cancer support", "diabetes"],
    bodyParts: ["immune system", "cardiovascular system", "adrenal glands"],
    relatedOdu: ["Ika Meji", "Irete Meji"],
    sources: ["Traditional Chinese Medicine", "Shennong Bencao Jing"],
  },
  {
    tradition: "chinese_tcm" as const,
    herbName: "Reishi Mushroom (Ling Zhi)",
    localNames: ["Ling Zhi", "Ganoderma", "Mushroom of Immortality"],
    scientificName: "Ganoderma lucidum",
    category: "Medicinal mushroom / longevity tonic",
    uses: "Called the 'mushroom of immortality' in Chinese medicine. Used for immune support, stress reduction, sleep improvement, liver protection, and longevity.",
    preparation: "Dried mushroom boiled as tea for 30-60 minutes. Available as powder, extract, or capsules.",
    dosage: "1.5-9g of dried mushroom per day. 1-2g of extract daily.",
    contraindications: "May cause digestive upset in some people. Caution with blood thinners.",
    interactions: "May enhance effects of blood pressure and blood sugar medications.",
    properties: ["immune-modulating", "adaptogenic", "hepatoprotective", "anti-stress", "longevity"],
    conditions: ["immune deficiency", "stress", "insomnia", "liver disease", "hypertension"],
    bodyParts: ["immune system", "liver", "nervous system", "cardiovascular system"],
    relatedOdu: ["Ogbe Meji", "Otura Meji"],
    sources: ["Traditional Chinese Medicine", "Bencao Gangmu"],
  },
  {
    tradition: "chinese_tcm" as const,
    herbName: "Turmeric (Jiang Huang)",
    localNames: ["Jiang Huang", "Curcuma", "Golden Root"],
    scientificName: "Curcuma longa",
    category: "Anti-inflammatory / digestive",
    uses: "Used in both Chinese and Ayurvedic medicine for inflammation, joint pain, digestive disorders, liver protection, and as a blood-moving herb.",
    preparation: "Fresh root grated or dried root powdered. Added to food, or taken as tea with black pepper to enhance absorption.",
    dosage: "1-3g of powder daily with black pepper. 400-600mg of curcumin extract three times daily.",
    contraindications: "Avoid high doses during pregnancy. Caution with gallstones. May increase bleeding risk.",
    interactions: "May interact with blood thinners, antacids, and diabetes medications.",
    properties: ["anti-inflammatory", "antioxidant", "hepatoprotective", "blood-moving", "digestive"],
    conditions: ["inflammation", "arthritis", "liver disease", "digestive disorders", "cancer prevention"],
    bodyParts: ["joints", "liver", "digestive system", "cardiovascular system"],
    relatedOdu: ["Obara Meji", "Irosun Meji"],
    sources: ["Traditional Chinese Medicine", "Ayurvedic medicine"],
  },
  {
    tradition: "chinese_tcm" as const,
    herbName: "Ginger (Sheng Jiang / Gan Jiang)",
    localNames: ["Sheng Jiang (fresh)", "Gan Jiang (dried)", "Atale (Yoruba)"],
    scientificName: "Zingiber officinale",
    category: "Warming digestive / anti-nausea",
    uses: "Used in virtually every medical tradition worldwide. In TCM, warms the middle burner, disperses cold, stops nausea and vomiting, and promotes circulation.",
    preparation: "Fresh root sliced and boiled as tea. Dried root powdered for formulas. Crystallised ginger for nausea.",
    dosage: "1-3g of fresh root per day. 250mg of extract for nausea.",
    contraindications: "Avoid high doses with blood thinners. Caution with peptic ulcers.",
    interactions: "May interact with blood thinners and diabetes medications.",
    properties: ["warming", "anti-nausea", "digestive", "anti-inflammatory", "circulation-promoting"],
    conditions: ["nausea", "vomiting", "digestive disorders", "cold conditions", "arthritis"],
    bodyParts: ["digestive system", "cardiovascular system", "joints"],
    relatedOdu: ["Owonrin Meji", "Ogunda Meji"],
    sources: ["Traditional Chinese Medicine", "Yoruba medicine", "Ayurvedic medicine"],
  },
  {
    tradition: "chinese_tcm" as const,
    herbName: "Schisandra (Wu Wei Zi)",
    localNames: ["Wu Wei Zi", "Five Flavour Berry", "Schisandra"],
    scientificName: "Schisandra chinensis",
    category: "Adaptogen / liver tonic",
    uses: "Named for its five flavours (sweet, sour, salty, bitter, pungent). Used as an adaptogen, liver tonic, cognitive enhancer, and for sexual vitality.",
    preparation: "Dried berries boiled as tea. Available as powder, tincture, or capsules.",
    dosage: "1.5-6g of dried berries per day as tea. 500mg of extract twice daily.",
    contraindications: "Avoid during acute infections. Caution during pregnancy.",
    interactions: "May interact with medications metabolised by liver enzymes.",
    properties: ["adaptogenic", "hepatoprotective", "cognitive-enhancing", "astringent", "tonic"],
    conditions: ["liver disease", "fatigue", "cognitive decline", "sexual dysfunction", "stress"],
    bodyParts: ["liver", "nervous system", "reproductive system", "immune system"],
    relatedOdu: ["Irete Meji", "Ose Meji"],
    sources: ["Traditional Chinese Medicine"],
  },
  // ── African Traditional (non-Yoruba) ──────────────────────────────────────
  {
    tradition: "african" as const,
    herbName: "Rooibos (Red Bush Tea)",
    localNames: ["Rooibos", "Rooibosch", "Aspalathus"],
    scientificName: "Aspalathus linearis",
    category: "Antioxidant / relaxant",
    uses: "South African traditional herb used for allergies, digestive issues, skin conditions, and as a general antioxidant tonic. Caffeine-free alternative to tea.",
    preparation: "Dried leaves steeped in boiling water for 5-10 minutes. Can be drunk hot or cold.",
    dosage: "2-3 cups daily.",
    contraindications: "Generally safe. Rare allergic reactions possible.",
    interactions: "May affect iron absorption.",
    properties: ["antioxidant", "anti-allergic", "digestive", "relaxant", "anti-inflammatory"],
    conditions: ["allergies", "digestive disorders", "skin conditions", "insomnia", "hypertension"],
    bodyParts: ["immune system", "digestive system", "skin", "cardiovascular system"],
    relatedOdu: ["Ose Meji", "Oyeku Meji"],
    sources: ["South African traditional medicine"],
  },
  {
    tradition: "african" as const,
    herbName: "Baobab (Ose Igbo / Monkey Bread Tree)",
    localNames: ["Baobab", "Monkey Bread Tree", "Ose Igbo"],
    scientificName: "Adansonia digitata",
    category: "Nutritive / antioxidant",
    uses: "Called the 'tree of life' across Africa. The fruit pulp is exceptionally high in vitamin C and antioxidants. Used for fever, digestive issues, and as a nutritive tonic.",
    preparation: "Fruit pulp dissolved in water as a drink. Leaves dried and powdered for food.",
    dosage: "1-2 tablespoons of fruit powder daily in water or smoothies.",
    contraindications: "Generally safe. High fibre content may cause digestive upset in large doses.",
    interactions: "May affect absorption of some medications.",
    properties: ["nutritive", "antioxidant", "prebiotic", "anti-inflammatory", "fever-reducing"],
    conditions: ["fever", "digestive disorders", "malnutrition", "immune deficiency"],
    bodyParts: ["immune system", "digestive system", "liver"],
    relatedOdu: ["Ogbe Meji", "Otura Meji"],
    sources: ["Pan-African traditional medicine"],
  },
];

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function seedKnowledge() {
  console.log("[Seed] Starting Unstor knowledge base seeding...");
  const db = await getDb();
  if (!db) {
    console.error("[Seed] Database unavailable. Ensure DATABASE_URL is set.");
    process.exit(1);
  }

  // ── Seed Ifá Odù ──────────────────────────────────────────────────────────
  console.log("[Seed] Generating all 256 Odù Ifá...");
  const allOdu = generateAllOdu();
  console.log(`[Seed] Generated ${allOdu.length} Odù entries`);

  let oduInserted = 0;
  let oduSkipped = 0;

  for (const odu of allOdu) {
    try {
      // Check if already exists
      const existing = await db
        .select({ id: ifaOdu.id })
        .from(ifaOdu)
        .where(eq(ifaOdu.oduNumber, odu.oduNumber))
        .limit(1);

      if (existing.length > 0) {
        oduSkipped++;
        continue;
      }

      await db.insert(ifaOdu).values({
        oduNumber: odu.oduNumber,
        primaryName: odu.primaryName,
        alternateNames: odu.alternateNames,
        category: odu.category,
        majorOdu: odu.majorOdu,
        parentOdu: odu.parentOdu,
        summary: odu.summary,
        themes: odu.themes,
        eseVerses: odu.eseVerses,
        taboos: odu.taboos,
        prescriptions: odu.prescriptions,
        lifeApplications: odu.lifeApplications,
        herbs: odu.herbs,
        offerings: odu.offerings,
        colors: odu.colors,
        numbers: odu.numbers,
        deities: odu.deities,
      });
      oduInserted++;
    } catch (err) {
      console.error(`[Seed] Error inserting Odù ${odu.primaryName}:`, err);
    }
  }

  console.log(`[Seed] Ifá Odù: ${oduInserted} inserted, ${oduSkipped} already existed`);

  // ── Seed Medicine Knowledge ───────────────────────────────────────────────
  console.log("[Seed] Seeding medicine knowledge base...");
  let medInserted = 0;
  let medSkipped = 0;

  for (const med of MEDICINE_SEED) {
    try {
      const existing = await db
        .select({ id: medicineKnowledge.id })
        .from(medicineKnowledge)
        .where(eq(medicineKnowledge.herbName, med.herbName))
        .limit(1);

      if (existing.length > 0) {
        medSkipped++;
        continue;
      }

      await db.insert(medicineKnowledge).values(med);
      medInserted++;
    } catch (err) {
      console.error(`[Seed] Error inserting medicine ${med.herbName}:`, err);
    }
  }

  console.log(`[Seed] Medicine: ${medInserted} inserted, ${medSkipped} already existed`);
  console.log("[Seed] Knowledge base seeding complete.");
  process.exit(0);
}

seedKnowledge().catch((err) => {
  console.error("[Seed] Fatal error:", err);
  process.exit(1);
});
