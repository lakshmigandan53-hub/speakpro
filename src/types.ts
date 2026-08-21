export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

export type InteractionMode =
  | 'speech-to-speech'
  | 'speech-to-text'
  | 'text-to-speech'
  | 'text-to-text';

export type LanguageCode =
  | 'hi' // Hindi
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'bn' // Bengali
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'pa' // Punjabi
  | 'ur' // Urdu
  | 'or' // Odia
  | 'as' // Assamese
  | 'sa' // Sanskrit
  | 'es' // Spanish
  | 'fr' // French
  | 'ja' // Japanese
  | 'de' // German
  | 'it' // Italian
  | 'zh' // Mandarin Chinese
  | 'pt' // Portuguese
  | 'ko' // Korean
  | 'ar' // Arabic
  | 'ru' // Russian
  | 'en'; // English

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  region: 'india' | 'global';
  scriptFamily?: string;
  defaultVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  sampleGreeting: string;
}

export interface ScenarioAudioProfile {
  name: string;
  age: string;
  role: string;
  personality: string;
  voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  accentAndTone: string;
}

export interface ScenarioScene {
  setting: string;
  vibe: string;
  atmosphere: string;
}

export interface ScenarioDirectorsNotes {
  pace: string;
  tone: string;
  formality: 'casual' | 'polite' | 'formal' | 'theatrical';
  simplification: string;
  turnLength: string;
}

export interface PhraseHint {
  id: string;
  original: string;
  phonetic?: string;
  translation: string;
  contextUsage?: string;
  category?: string;
}

export interface Scenario {
  id: string;
  title: string;
  category: 'social' | 'travel' | 'dining' | 'daily' | 'career' | 'shopping' | 'custom';
  icon: string;
  tagline: string;
  difficultyLevel?: ProficiencyLevel;
  audioProfile: ScenarioAudioProfile;
  scene: ScenarioScene;
  directorsNotes: ScenarioDirectorsNotes;
  targetKeyPhrases: string[];
  phraseHints: PhraseHint[];
  culturalTips?: string[];
  accentColor: string;
}

export interface VisualTranslateResult {
  detectedLanguage: {
    name: string;
    code: string;
    nativeName: string;
    flag: string;
    confidence?: number;
  };
  originalText: string;
  translatedText: string;
  phoneticReading?: string;
  contextSummary: string;
  keyTerms: Array<{
    original: string;
    translation: string;
    category?: string;
  }>;
  detectedBlocks?: Array<{
    original: string;
    translated: string;
    type?: string;
  }>;
}

export type MainNavTab = 'home' | 'levels' | 'profile';

export interface SilentCorrection {
  id: string;
  timestamp: number;
  userSaid: string;
  issue: string;
  correction: string;
  tip: string;
}

export interface KeyPhraseAchievement {
  phrase: string;
  timestamp: number;
}

export interface LiveTranscriptItem {
  id: string;
  speaker: 'user' | 'model';
  text: string;
  translation?: string;
  isFinal: boolean;
  timestamp: number;
}

export interface SessionEvaluation {
  overallScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  scenarioSuccessRate: number;
  totalDurationSeconds: number;
  turnsCount: number;
  keyStrengths: string[];
  areasForImprovement: string[];
  keyPhrasesMastered: string[];
  reviewPhrases: { phrase: string; betterAlternative: string; reason: string }[];
  motivationalMessage: string;
}

export type ConversationVisualState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'thinking'
  | 'muted'
  | 'error';

export interface LiveVoiceStatus {
  isConnected: boolean;
  isConnecting: boolean;
  isRecording: boolean;
  isAiSpeaking: boolean;
  isMuted: boolean;
  isThinking: boolean;
  visualState: ConversationVisualState;
  audioInputLevel: number;
  audioOutputLevel: number;
  error: string | null;
}

export interface BridgeLanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: 'india' | 'global' | 'auto';
  isAuto?: boolean;
}

export interface StrangerBridgeMessage {
  id: string;
  speaker: 'user' | 'stranger';
  originalText: string;
  translatedText: string;
  sourceLanguage: BridgeLanguageOption;
  targetLanguage: BridgeLanguageOption;
  phoneticOriginal?: string;
  phoneticTranslated?: string;
  timestamp: number;
  isAutoDetected?: boolean;
  detectedConfidence?: number;
}

