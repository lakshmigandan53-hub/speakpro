import { LanguageCode, LanguageProgress, LanguageProgressMap, ProficiencyLevel, SavedPhraseItem } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';

const STORAGE_KEY = 'talkie_languages_progress_v1';

// Native vocabulary vault phrases tailored per language
export const LANGUAGE_DEFAULT_PHRASES: Record<string, SavedPhraseItem[]> = {
  es: [
    {
      id: 'es-1',
      original: '¿Podría hablar un poco más despacio, por favor?',
      phonetic: 'poh-DREE-ah ah-BLAHR oon POH-koh mahs des-PAH-syoh',
      translation: 'Could you please speak a little slower?',
      category: 'Essential',
      mastered: true,
    },
    {
      id: 'es-2',
      original: 'Una mesa para dos cerca de la ventana',
      phonetic: 'OO-nah MEH-sah PAH-rah dohs SEHR-kah deh lah ven-TAH-nah',
      translation: 'A table for two near the window',
      category: 'Dining',
      mastered: true,
    },
    {
      id: 'es-3',
      original: '¿Cuánto cuesta este artículo artesanal?',
      phonetic: 'KWAHN-toh KWEHS-tah EHS-teh ahr-teh-sah-NAHL',
      translation: 'How much does this handmade item cost?',
      category: 'Shopping',
      mastered: false,
    },
    {
      id: 'es-4',
      original: 'Tengo experiencia liderando proyectos de tecnología',
      phonetic: 'TEN-goh eks-peh-RYEN-syah lee-deh-RAHN-doh proh-YEK-tohs',
      translation: 'I have experience leading engineering projects',
      category: 'Career',
      mastered: false,
    },
  ],
  hi: [
    {
      id: 'hi-1',
      original: 'कृपया क्या आप थोड़ा धीरे बोल सकते हैं?',
      phonetic: 'Kripya kya aap thoda dheere bol sakte hain?',
      translation: 'Could you please speak a little slower?',
      category: 'Essential',
      mastered: false,
    },
    {
      id: 'hi-2',
      original: 'दो लोगों के लिए खिड़की के पास एक टेबल चाहिए',
      phonetic: 'Do logon ke liye khidki ke paas ek table chahiye',
      translation: 'A table for two near the window, please',
      category: 'Dining',
      mastered: false,
    },
    {
      id: 'hi-3',
      original: 'यह कितने का है? क्या कुछ छूट मिलेगी?',
      phonetic: 'Yeh kitne ka hai? Kya kuch chhoot milegi?',
      translation: 'How much is this? Is there any discount?',
      category: 'Shopping',
      mastered: false,
    },
    {
      id: 'hi-4',
      original: 'आपसे मिलकर बहुत खुशी हुई',
      phonetic: 'Aapse milkar bahut khushi hui',
      translation: 'Pleased to meet you / Nice to meet you',
      category: 'Social',
      mastered: false,
    },
  ],
  fr: [
    {
      id: 'fr-1',
      original: 'Pourriez-vous parler un peu plus lentement, s\'il vous plaît ?',
      phonetic: 'poo-ryay voo par-lay uhn poo ploo lahn-tuh-mahn, seel voo play',
      translation: 'Could you please speak a little slower?',
      category: 'Essential',
      mastered: false,
    },
    {
      id: 'fr-2',
      original: 'Une table pour deux près de la fenêtre, s\'il vous plaît',
      phonetic: 'ewn tah-bluh poor duh pray duh lah fuh-neh-truh, seel voo play',
      translation: 'A table for two near the window, please',
      category: 'Dining',
      mastered: false,
    },
    {
      id: 'fr-3',
      original: 'Combien coûte cet article d\'artisanat ?',
      phonetic: 'kohm-byen koot set ar-tee-kluh dar-tee-zah-nah',
      translation: 'How much does this handcrafted item cost?',
      category: 'Shopping',
      mastered: false,
    },
    {
      id: 'fr-4',
      original: 'Enchanté de faire votre connaissance',
      phonetic: 'ahn-shahn-tay duh fair vo-truh koh-neh-sahnss',
      translation: 'Delighted to meet you',
      category: 'Social',
      mastered: false,
    },
  ],
  ja: [
    {
      id: 'ja-1',
      original: 'すみません、もう少しゆっくり話していただけますか？',
      phonetic: 'Sumimasen, mou sukoshi yukkuri hanashite itadakemasu ka?',
      translation: 'Excuse me, could you speak a little slower?',
      category: 'Essential',
      mastered: false,
    },
    {
      id: 'ja-2',
      original: '窓際の2人席をお願いします',
      phonetic: 'Madogiwa no futari-seki wo onegaishimasu',
      translation: 'A window seat for two please',
      category: 'Dining',
      mastered: false,
    },
    {
      id: 'ja-3',
      original: 'これはいくらですか？',
      phonetic: 'Kore wa ikura desu ka?',
      translation: 'How much does this cost?',
      category: 'Shopping',
      mastered: false,
    },
    {
      id: 'ja-4',
      original: 'はじめまして、どうぞよろしくお願いします',
      phonetic: 'Hajimemashite, douzo yoroshiku onegaishimasu',
      translation: 'Nice to meet you, looking forward to working together',
      category: 'Social',
      mastered: false,
    },
  ],
  de: [
    {
      id: 'de-1',
      original: 'Könnten Sie bitte etwas langsamer sprechen?',
      phonetic: 'Kurn-ten zee bit-teh et-vas lang-zah-mer sprech-en?',
      translation: 'Could you please speak a little slower?',
      category: 'Essential',
      mastered: false,
    },
    {
      id: 'de-2',
      original: 'Einen Tisch für zwei am Fenster, bitte',
      phonetic: 'Eye-nen tish foor tsvy ahm fen-ster, bit-teh',
      translation: 'A table for two by the window, please',
      category: 'Dining',
      mastered: false,
    },
    {
      id: 'de-3',
      original: 'Wie viel kostet dieses handgefertigte Souvenir?',
      phonetic: 'Vee feel kos-tet dee-zes hand-ge-fer-tig-teh zoo-ve-neer?',
      translation: 'How much is this handmade souvenir?',
      category: 'Shopping',
      mastered: false,
    },
    {
      id: 'de-4',
      original: 'Sehr erfreut, Sie kennenzulernen',
      phonetic: 'Zayr er-froit, zee ken-nen-tsoo-lehr-nen',
      translation: 'Very pleased to meet you',
      category: 'Social',
      mastered: false,
    },
  ],
  ta: [
    {
      id: 'ta-1',
      original: 'தயவுசெய்து கொஞ்சம் மெதுவாக பேசுங்கள்',
      phonetic: 'Thayavuseithu konjam medhuvaaga pesungal',
      translation: 'Please speak a little slower',
      category: 'Essential',
      mastered: false,
    },
    {
      id: 'ta-2',
      original: 'ஜன்னல் அருகே இரண்டு பேருக்கு மேஜை வேண்டும்',
      phonetic: 'Jannal aruge irandu perukku meijai vendum',
      translation: 'A table for two near the window, please',
      category: 'Dining',
      mastered: false,
    },
    {
      id: 'ta-3',
      original: 'இதன் விலை என்ன?',
      phonetic: 'Idhan vilai enna?',
      translation: 'What is the price of this?',
      category: 'Shopping',
      mastered: false,
    },
    {
      id: 'ta-4',
      original: 'உங்களை சந்தித்ததில் மகிழ்ச்சி',
      phonetic: 'Ungalai sandhithadhil magizhchi',
      translation: 'Happy to meet you',
      category: 'Social',
      mastered: false,
    },
  ],
  it: [
    {
      id: 'it-1',
      original: 'Potrebbe parlare un po\' più lentamente, per favore?',
      phonetic: 'Poh-treb-beh par-LAH-reh oon poh pyoo len-tah-MEN-teh, per fah-VOH-reh?',
      translation: 'Could you please speak a little slower?',
      category: 'Essential',
      mastered: false,
    },
    {
      id: 'it-2',
      original: 'Un tavolo per due vicino alla finestra, per favore',
      phonetic: 'Oon TAH-voh-loh per DOO-eh vee-CHEE-noh AHL-lah fee-NEHS-trah',
      translation: 'A table for two near the window, please',
      category: 'Dining',
      mastered: false,
    },
    {
      id: 'it-3',
      original: 'Quanto costa questo souvenir?',
      phonetic: 'KWAHN-toh KOHS-tah KWEHS-toh soo-veh-NEER?',
      translation: 'How much does this souvenir cost?',
      category: 'Shopping',
      mastered: false,
    },
    {
      id: 'it-4',
      original: 'Molto piacere di conoscerti',
      phonetic: 'MOHL-toh pyah-CHEH-reh dee koh-NOH-sher-tee',
      translation: 'Pleasure to meet you',
      category: 'Social',
      mastered: false,
    },
  ],
  zh: [
    {
      id: 'zh-1',
      original: '请问您可以说得慢一点吗？',
      phonetic: 'Qǐngwèn nín kěyǐ shuō de màn yīdiǎn ma?',
      translation: 'Could you please speak a little slower?',
      category: 'Essential',
      mastered: false,
    },
    {
      id: 'zh-2',
      original: '请给我们一张靠窗的两人桌',
      phonetic: 'Qǐng gěi wǒmen yī zhāng kào chuāng de liǎngrén zhuō',
      translation: 'Please give us a window table for two',
      category: 'Dining',
      mastered: false,
    },
    {
      id: 'zh-3',
      original: '这个手工艺品多少钱？',
      phonetic: 'Zhège shǒugōngyìpǐn duōshao qián?',
      translation: 'How much does this handicraft cost?',
      category: 'Shopping',
      mastered: false,
    },
    {
      id: 'zh-4',
      original: '很高兴认识你',
      phonetic: 'Hěn gāoxìng rènshí nǐ',
      translation: 'Very glad to meet you',
      category: 'Social',
      mastered: false,
    },
  ],
};

// Generic fallback phrases generator for other languages
function getFallbackPhrases(langCode: string, langName: string, greeting: string): SavedPhraseItem[] {
  return [
    {
      id: `${langCode}-1`,
      original: greeting || 'Hello!',
      phonetic: 'Standard greeting',
      translation: `Greetings / Hello in ${langName}`,
      category: 'Essential',
      mastered: false,
    },
    {
      id: `${langCode}-2`,
      original: 'Please speak slowly',
      phonetic: 'Polite request',
      translation: 'Could you please speak a little slower?',
      category: 'Essential',
      mastered: false,
    },
    {
      id: `${langCode}-3`,
      original: 'Table for two, please',
      phonetic: 'Dining order',
      translation: 'A table for two near the window',
      category: 'Dining',
      mastered: false,
    },
    {
      id: `${langCode}-4`,
      original: 'How much is this?',
      phonetic: 'Shopping inquiry',
      translation: 'Asking price at local marketplace',
      category: 'Shopping',
      mastered: false,
    },
  ];
}

export function createDefaultLanguageProgress(code: string): LanguageProgress {
  const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  const langName = langObj?.name || code.toUpperCase();
  const greeting = langObj?.sampleGreeting || '';

  const phrases = LANGUAGE_DEFAULT_PHRASES[code] || getFallbackPhrases(code, langName, greeting);

  // Spanish has pre-populated initial progress as demo showcase
  if (code === 'es') {
    return {
      languageCode: 'es',
      level: 'intermediate',
      xp: 1450,
      streakDays: 7,
      fluencyScore: 88,
      speakingTimeMinutes: 42,
      conversationalTurns: 34,
      grammarAccuracy: 85,
      completedMilestoneIds: ['greeting-intro', 'cafe-restaurant', 'asking-directions'],
      stageProgress: {
        beginner: 100,
        intermediate: 40,
        advanced: 0,
      },
      savedPhrases: phrases,
      hasPracticed: true,
      lastPracticedAt: Date.now(),
    };
  }

  // All other languages start fresh at Beginner level with Stage 1 unlocked and 0 XP
  return {
    languageCode: code as LanguageCode,
    level: 'beginner',
    xp: 0,
    streakDays: 1,
    fluencyScore: 0,
    speakingTimeMinutes: 0,
    conversationalTurns: 0,
    grammarAccuracy: 75,
    completedMilestoneIds: [],
    stageProgress: {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    },
    savedPhrases: phrases,
    hasPracticed: false,
    lastPracticedAt: 0,
  };
}

export function loadAllLanguageProgress(): LanguageProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: LanguageProgressMap = JSON.parse(raw);
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load language progress from localStorage:', err);
  }

  // Initial seed
  const initialMap: LanguageProgressMap = {};
  initialMap['es'] = createDefaultLanguageProgress('es');
  return initialMap;
}

export function saveAllLanguageProgress(map: LanguageProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to persist language progress to localStorage:', err);
  }
}

export function getOrInitLanguageProgress(
  map: LanguageProgressMap,
  languageCode: string
): { progress: LanguageProgress; updatedMap: LanguageProgressMap; isNew: boolean } {
  if (map[languageCode]) {
    return {
      progress: map[languageCode],
      updatedMap: map,
      isNew: false,
    };
  }

  const newProgress = createDefaultLanguageProgress(languageCode);
  const updatedMap: LanguageProgressMap = {
    ...map,
    [languageCode]: newProgress,
  };
  saveAllLanguageProgress(updatedMap);

  return {
    progress: newProgress,
    updatedMap,
    isNew: true,
  };
}
