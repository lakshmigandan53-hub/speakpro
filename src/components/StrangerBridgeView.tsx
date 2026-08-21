import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BridgeLanguageOption, StrangerBridgeMessage, Language } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { VoiceClipRecorder } from '../utils/audio';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowLeftRight,
  RotateCw,
  Languages,
  Sparkles,
  Copy,
  Check,
  Send,
  Keyboard,
  BookOpen,
  History,
  X,
  ArrowLeft,
  Loader2,
  AlertCircle,
  HelpCircle,
  Radio,
  Compass,
  DollarSign,
  Utensils,
  ChevronDown,
  Search,
  CheckCheck,
} from 'lucide-react';

interface StrangerBridgeViewProps {
  onBack: () => void;
  defaultUserLanguage?: Language;
  defaultStrangerLanguage?: Language;
}

const AUTO_DETECT_OPTION: BridgeLanguageOption = {
  code: 'auto',
  name: 'Auto Detect',
  nativeName: 'Auto Detect Language',
  flag: '🌐',
  region: 'auto',
  isAuto: true,
};

// Common situational quick phrases for travelers and instant encounters
const QUICK_SITUATIONAL_PHRASES = [
  {
    category: 'Emergency & Help',
    icon: AlertCircle,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    phrases: [
      { text: 'Excuse me, could you please help me?', context: 'Polite request' },
      { text: 'I am lost. Where is the nearest railway station?', context: 'Directions' },
      { text: 'I need a doctor or medical assistance immediately.', context: 'Medical' },
      { text: 'Where is the nearest police station or help desk?', context: 'Safety' },
    ],
  },
  {
    category: 'Commute & Directions',
    icon: Compass,
    color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    phrases: [
      { text: 'How do I get to this address?', context: 'Navigation' },
      { text: 'Which bus or train goes to the city center?', context: 'Transit' },
      { text: 'How much is the taxi / auto-rickshaw fare to the airport?', context: 'Commute' },
      { text: 'Is it within walking distance from here?', context: 'Walking' },
    ],
  },
  {
    category: 'Shopping & Market',
    icon: DollarSign,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    phrases: [
      { text: 'How much does this item cost?', context: 'Price inquiry' },
      { text: 'Can you give a little discount for this?', context: 'Bargaining' },
      { text: 'Do you accept UPI, Google Pay, or card payment?', context: 'Payment' },
      { text: 'Could I get a receipt or bag, please?', context: 'Purchase' },
    ],
  },
  {
    category: 'Food & Dining',
    icon: Utensils,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    phrases: [
      { text: 'Is this food vegetarian or non-vegetarian?', context: 'Dietary' },
      { text: 'Please make it less spicy with less oil.', context: 'Taste' },
      { text: 'Could I have bottled drinking water and the bill, please?', context: 'Service' },
      { text: 'What is the most popular local specialty here?', context: 'Recommendation' },
    ],
  },
  {
    category: 'Polite Conversation',
    icon: HelpCircle,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    phrases: [
      { text: 'Hello, nice to meet you! How are you doing?', context: 'Greeting' },
      { text: 'Could you please speak a little slower?', context: 'Pacing' },
      { text: 'Thank you so much for your kind help!', context: 'Gratitude' },
      { text: 'I do not speak the local language well.', context: 'Disclaimer' },
    ],
  },
];

export const StrangerBridgeView: React.FC<StrangerBridgeViewProps> = ({
  onBack,
  defaultUserLanguage,
  defaultStrangerLanguage,
}) => {
  // Bridge Languages
  const [userLang, setUserLang] = useState<BridgeLanguageOption>(() => {
    if (defaultUserLanguage) {
      return {
        code: defaultUserLanguage.code,
        name: defaultUserLanguage.name,
        nativeName: defaultUserLanguage.nativeName,
        flag: defaultUserLanguage.flag,
        region: defaultUserLanguage.region,
      };
    }
    return { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'global' };
  });

  const [strangerLang, setStrangerLang] = useState<BridgeLanguageOption>(() => {
    if (defaultStrangerLanguage && defaultStrangerLanguage.code !== 'en') {
      return {
        code: defaultStrangerLanguage.code,
        name: defaultStrangerLanguage.name,
        nativeName: defaultStrangerLanguage.nativeName,
        flag: defaultStrangerLanguage.flag,
        region: defaultStrangerLanguage.region,
      };
    }
    return AUTO_DETECT_OPTION;
  });

  // Conversation turns
  const [messages, setMessages] = useState<StrangerBridgeMessage[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<'user' | 'stranger' | 'dual' | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSpeaker, setRecordingSpeaker] = useState<'user' | 'stranger' | 'auto'>('user');
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  // UI state
  const [isFlipped, setIsFlipped] = useState<boolean>(false); // 180° flip for stranger face-to-face mode
  const [isSlowSpeech, setIsSlowSpeech] = useState<boolean>(false);
  const [showKeyboard, setShowKeyboard] = useState<boolean>(false);
  const [typedText, setTypedText] = useState<string>('');
  const [typedSpeaker, setTypedSpeaker] = useState<'user' | 'stranger'>('user');
  const [showPhraseDrawer, setShowPhraseDrawer] = useState<boolean>(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Language Dropdown modals
  const [isUserLangModalOpen, setIsUserLangModalOpen] = useState<boolean>(false);
  const [isStrangerLangModalOpen, setIsStrangerLangModalOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>('');
  const [langRegionFilter, setLangRegionFilter] = useState<'all' | 'india' | 'global'>('all');

  // Audio level and recording refs
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const recorderRef = useRef<VoiceClipRecorder | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Latest messages for user and stranger panels
  const latestStrangerMessage = messages.slice().reverse().find((m) => m.speaker === 'stranger');
  const latestUserMessage = messages.slice().reverse().find((m) => m.speaker === 'user');
  const mostRecentMessage = messages[messages.length - 1];

  // Initialize Speech Synthesis voice helper
  const speakText = useCallback(
    (text: string, langCode: string, isSlow: boolean = false, messageId?: string) => {
      if (!('speechSynthesis' in window)) return;

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = isSlow ? 0.75 : 1.0;
        utterance.pitch = 1.0;

        // Map language code to BCP 47 tag
        const langMap: Record<string, string> = {
          hi: 'hi-IN',
          ta: 'ta-IN',
          te: 'te-IN',
          kn: 'kn-IN',
          ml: 'ml-IN',
          bn: 'bn-IN',
          mr: 'mr-IN',
          gu: 'gu-IN',
          pa: 'pa-IN',
          ur: 'ur-IN',
          es: 'es-ES',
          fr: 'fr-FR',
          ja: 'ja-JP',
          de: 'de-DE',
          it: 'it-IT',
          zh: 'zh-CN',
          ko: 'ko-KR',
          ar: 'ar-SA',
          ru: 'ru-RU',
          en: 'en-US',
        };

        utterance.lang = langMap[langCode] || 'en-US';

        if (messageId) {
          setPlayingAudioId(messageId);
          utterance.onend = () => setPlayingAudioId(null);
          utterance.onerror = () => setPlayingAudioId(null);
        }

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
        setPlayingAudioId(null);
      }
    },
    []
  );

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Swap User and Stranger languages
  const handleSwapLanguages = () => {
    if (strangerLang.isAuto) {
      // If stranger was auto, set user to English and stranger to Tamil/Hindi default
      const prevUser = userLang;
      setUserLang({ code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', region: 'india' });
      setStrangerLang(prevUser);
    } else {
      const prevUser = userLang;
      setUserLang(strangerLang);
      setStrangerLang(prevUser);
    }
  };

  // ----------------------------------------------------
  // Audio Recording Flow
  // ----------------------------------------------------
  const startRecording = async (speaker: 'user' | 'stranger' | 'auto') => {
    try {
      if (isRecording) {
        await stopAndProcessRecording();
        return;
      }

      setRecordingSpeaker(speaker);
      setIsRecording(true);
      setRecordingSeconds(0);
      setAudioLevel(0);

      if (!recorderRef.current) {
        recorderRef.current = new VoiceClipRecorder((level) => {
          setAudioLevel(level);
        });
      }

      await recorderRef.current.start();

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      setIsRecording(false);
      alert('Microphone permission required for instant translation.');
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    recorderRef.current?.cancel();
    setIsRecording(false);
    setRecordingSeconds(0);
    setAudioLevel(0);
  };

  const stopAndProcessRecording = async () => {
    if (!recorderRef.current || !isRecording) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
    setIsProcessing(true);
    setProcessingStatus(
      recordingSpeaker === 'stranger'
        ? 'Detecting stranger language...'
        : recordingSpeaker === 'auto'
        ? 'Identifying speaker & language...'
        : 'Translating for stranger...'
    );

    try {
      const clip = await recorderRef.current.stop();
      if (!clip || !clip.base64) {
        setIsProcessing(false);
        return;
      }

      const res = await fetch('/api/stranger-bridge/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: clip.base64,
          mimeType: clip.mimeType,
          speaker: recordingSpeaker,
          userLanguage: userLang,
          strangerLanguage: strangerLang,
          conversationHistory: messages,
        }),
      });

      if (!res.ok) throw new Error('Translation failed');
      const data = await res.json();

      const newMsg: StrangerBridgeMessage = {
        id: 'msg-' + Date.now(),
        speaker: data.speaker || (recordingSpeaker === 'stranger' ? 'stranger' : 'user'),
        originalText: data.originalText,
        translatedText: data.translatedText,
        sourceLanguage: data.detectedLanguage || (data.speaker === 'user' ? userLang : strangerLang),
        targetLanguage: data.targetLanguage || (data.speaker === 'user' ? strangerLang : userLang),
        phoneticOriginal: data.phoneticOriginal,
        phoneticTranslated: data.phoneticTranslated,
        timestamp: Date.now(),
        isAutoDetected: data.detectedLanguage?.code !== userLang.code,
        detectedConfidence: data.detectedLanguage?.confidence,
      };

      setMessages((prev) => [...prev, newMsg]);

      // If stranger spoke and auto-detect was active, update the stranger language badge to match detected language
      if (
        data.speaker === 'stranger' &&
        data.detectedLanguage &&
        strangerLang.isAuto
      ) {
        setStrangerLang({
          code: data.detectedLanguage.code,
          name: data.detectedLanguage.name,
          nativeName: data.detectedLanguage.nativeName || data.detectedLanguage.name,
          flag: data.detectedLanguage.flag || '🌐',
          region: 'global',
        });
      }

      // Auto-speak translated output aloud
      const speakLangCode = newMsg.speaker === 'user' ? newMsg.targetLanguage.code : newMsg.targetLanguage.code;
      speakText(newMsg.translatedText, speakLangCode, isSlowSpeech, newMsg.id);
    } catch (err) {
      console.error('Error processing audio turn:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      setRecordingSeconds(0);
      setAudioLevel(0);
    }
  };

  // ----------------------------------------------------
  // Text Translation Flow (Keyboard / Preset Phrases)
  // ----------------------------------------------------
  const handleTranslateText = async (textToSend: string, speaker: 'user' | 'stranger' = 'user') => {
    if (!textToSend.trim()) return;
    setIsProcessing(true);
    setProcessingStatus('Translating text bridge...');

    try {
      const res = await fetch('/api/stranger-bridge/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend.trim(),
          speaker,
          userLanguage: userLang,
          strangerLanguage: strangerLang,
          conversationHistory: messages,
        }),
      });

      if (!res.ok) throw new Error('Failed to translate text');
      const data = await res.json();

      const newMsg: StrangerBridgeMessage = {
        id: 'msg-' + Date.now(),
        speaker,
        originalText: data.originalText || textToSend,
        translatedText: data.translatedText,
        sourceLanguage: data.detectedLanguage || (speaker === 'user' ? userLang : strangerLang),
        targetLanguage: data.targetLanguage || (speaker === 'user' ? strangerLang : userLang),
        phoneticOriginal: data.phoneticOriginal,
        phoneticTranslated: data.phoneticTranslated,
        timestamp: Date.now(),
        isAutoDetected: false,
      };

      setMessages((prev) => [...prev, newMsg]);
      setTypedText('');
      setShowKeyboard(false);

      // Auto-speak translation
      speakText(newMsg.translatedText, newMsg.targetLanguage.code, isSlowSpeech, newMsg.id);
    } catch (err) {
      console.error('Error sending text translation:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Filter languages for selection modal
  const allLanguageOptions: BridgeLanguageOption[] = [
    AUTO_DETECT_OPTION,
    ...SUPPORTED_LANGUAGES.map((l) => ({
      code: l.code,
      name: l.name,
      nativeName: l.nativeName,
      flag: l.flag,
      region: l.region,
    })),
  ];

  const filteredLanguages = allLanguageOptions.filter((lang) => {
    const matchesRegion =
      langRegionFilter === 'all' ||
      (langRegionFilter === 'india' && lang.region === 'india') ||
      (langRegionFilter === 'global' && (lang.region === 'global' || lang.region === 'auto'));
    const matchesSearch =
      lang.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      lang.code.toLowerCase().includes(langSearch.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0C0F] text-slate-100 flex flex-col justify-between overflow-hidden font-sans select-none">
      {/* ---------------------------------------------------------------- */}
      {/* Top Header Bar: App Name, Back Button, Mode Badge, Flip Control  */}
      {/* ---------------------------------------------------------------- */}
      <header className="relative z-30 px-4 py-2.5 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            id="stranger-bridge-back-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 via-sky-500 to-teal-400 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-[#0B0C0F] rounded-[6px] flex items-center justify-center">
                <Languages className="w-4 h-4 text-sky-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Instant Speaking to Stranger
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-mono font-bold">
                  Google Translate Bridge
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right Tools: Flip 180°, Phrasebook Drawer, Full Transcript History */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Flip 180° for Face-to-Face Table Talk */}
          <button
            id="toggle-flip-view-btn"
            onClick={() => setIsFlipped(!isFlipped)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
              isFlipped
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-xs'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            title="Flip Stranger Screen 180° for two people facing each other"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isFlipped ? 'text-indigo-400' : ''}`} />
            <span className="hidden md:inline">Face-to-Face {isFlipped ? '(Flipped)' : ''}</span>
          </button>

          {/* Emergency / Travel Phrases */}
          <button
            id="toggle-phrase-drawer-btn"
            onClick={() => setShowPhraseDrawer(!showPhraseDrawer)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            title="Quick Situational Phrases"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Phrases</span>
          </button>

          {/* Conversation History Drawer */}
          <button
            id="toggle-history-drawer-btn"
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            title="Full Bilateral Conversation Log"
          >
            <History className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">History</span>
            {messages.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Main Dual-View Translation Surface (Google Translate Split View)  */}
      {/* ---------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* ============================================================== */}
        {/* TOP CARD: STRANGER'S PERSPECTIVE / FACING                      */}
        {/* ============================================================== */}
        <section
          className={`flex-1 flex flex-col justify-between p-4 sm:p-6 transition-all duration-300 border-b border-slate-800/90 relative ${
            isFlipped ? 'rotate-180 bg-slate-950/90' : 'bg-slate-900/40'
          }`}
        >
          {/* Stranger Card Header: Language tag & speech controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                id="select-stranger-language-top-btn"
                onClick={() => setIsStrangerLangModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-xs font-semibold text-white transition-all cursor-pointer shadow-xs"
              >
                <span className="text-base">{strangerLang.flag}</span>
                <span>{strangerLang.name}</span>
                {strangerLang.nativeName && !strangerLang.isAuto && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({strangerLang.nativeName})
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                Stranger Facing
              </span>

              {mostRecentMessage && mostRecentMessage.speaker === 'stranger' && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" />
                  <span>Detected: {mostRecentMessage.sourceLanguage.name}</span>
                </span>
              )}
            </div>

            {/* Stranger Audio Actions */}
            <div className="flex items-center gap-1.5">
              {latestStrangerMessage || latestUserMessage ? (
                <>
                  <button
                    onClick={() => setIsSlowSpeech(!isSlowSpeech)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-colors cursor-pointer border ${
                      isSlowSpeech
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white'
                    }`}
                    title="0.75x slow voice speed for clearer pronunciation"
                  >
                    0.75x Slow
                  </button>

                  <button
                    onClick={() => {
                      const textToSpeak =
                        mostRecentMessage?.speaker === 'user'
                          ? mostRecentMessage.translatedText
                          : mostRecentMessage?.originalText;
                      if (textToSpeak) {
                        speakText(
                          textToSpeak,
                          strangerLang.code === 'auto' ? 'ta' : strangerLang.code,
                          isSlowSpeech,
                          'top-card'
                        );
                      }
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer border ${
                      playingAudioId === 'top-card'
                        ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60'
                    }`}
                    title="Play pronunciation aloud for stranger"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const textToCopy =
                        mostRecentMessage?.speaker === 'user'
                          ? mostRecentMessage.translatedText
                          : mostRecentMessage?.originalText;
                      if (textToCopy) handleCopy(textToCopy, 'top-card');
                    }}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
                    title="Copy text"
                  >
                    {copiedId === 'top-card' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Stranger Card Main Display Content */}
          <div className="flex-1 flex flex-col justify-center py-3 overflow-y-auto">
            {isProcessing && recordingSpeaker === 'user' ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Translating your speech to {strangerLang.name}...</p>
                  <p className="text-[11px] text-slate-400">Transcribing and generating natural translation</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <Languages className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs sm:text-sm font-medium text-slate-400">
                  Stranger translation will appear here
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  Speak in your language using the blue microphone below, or hand to the stranger to speak.
                </p>
              </div>
            ) : mostRecentMessage?.speaker === 'user' ? (
              /* User just spoke -> Display translated text in Stranger's language */
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-bold">
                    Translated for Stranger ({mostRecentMessage.targetLanguage.name})
                  </span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                  {mostRecentMessage.translatedText}
                </p>
                {mostRecentMessage.phoneticTranslated && (
                  <p className="text-xs sm:text-sm text-indigo-300/80 font-mono italic">
                    Pronunciation: "{mostRecentMessage.phoneticTranslated}"
                  </p>
                )}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">You said:</span>
                  <span>"{mostRecentMessage.originalText}"</span>
                </div>
              </div>
            ) : (
              /* Stranger just spoke -> Display what stranger said in their native tongue */
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-rose-400 font-bold">
                    Stranger Spoke ({mostRecentMessage?.sourceLanguage.name})
                  </span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                  {mostRecentMessage?.originalText}
                </p>
                {mostRecentMessage?.phoneticOriginal && (
                  <p className="text-xs sm:text-sm text-rose-300/80 font-mono italic">
                    Pronunciation: "{mostRecentMessage.phoneticOriginal}"
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* MIDDLE CONTROL & LANGUAGE SWITCHER STRIP                      */}
        {/* ============================================================== */}
        <div className="bg-slate-950 border-y border-slate-800/90 px-4 py-2 flex items-center justify-between z-20 shadow-md">
          {/* User Language Selector (Left) */}
          <button
            id="user-language-strip-btn"
            onClick={() => setIsUserLangModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            <span className="text-base">{userLang.flag}</span>
            <span className="font-bold text-white">{userLang.name}</span>
            <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">
              ({userLang.nativeName})
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Center Swap Languages Button */}
          <button
            id="swap-languages-btn"
            onClick={handleSwapLanguages}
            className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Swap translation languages"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          {/* Stranger Language Selector (Right) */}
          <button
            id="stranger-language-strip-btn"
            onClick={() => setIsStrangerLangModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            <span className="text-base">{strangerLang.flag}</span>
            <span className="font-bold text-white">{strangerLang.name}</span>
            {strangerLang.isAuto && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">
                Auto
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* BOTTOM CARD: USER'S PERSPECTIVE / FACING                      */}
        {/* ============================================================== */}
        <section className="flex-1 flex flex-col justify-between p-4 sm:p-6 bg-slate-900/60 relative">
          {/* User Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                Your Translation ({userLang.name})
              </span>
            </div>

            {/* User Audio Actions */}
            <div className="flex items-center gap-1.5">
              {latestStrangerMessage || latestUserMessage ? (
                <>
                  <button
                    onClick={() => {
                      const textToSpeak =
                        mostRecentMessage?.speaker === 'stranger'
                          ? mostRecentMessage.translatedText
                          : mostRecentMessage?.originalText;
                      if (textToSpeak) {
                        speakText(textToSpeak, userLang.code, isSlowSpeech, 'bottom-card');
                      }
                    }}
                    className={`p-2 rounded-xl transition-all cursor-pointer border ${
                      playingAudioId === 'bottom-card'
                        ? 'bg-indigo-600 text-white border-indigo-400 animate-pulse'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60'
                    }`}
                    title="Play pronunciation aloud for you"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const textToCopy =
                        mostRecentMessage?.speaker === 'stranger'
                          ? mostRecentMessage.translatedText
                          : mostRecentMessage?.originalText;
                      if (textToCopy) handleCopy(textToCopy, 'bottom-card');
                    }}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer"
                    title="Copy text"
                  >
                    {copiedId === 'bottom-card' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* User Card Main Display Content */}
          <div className="flex-1 flex flex-col justify-center py-3 overflow-y-auto">
            {isProcessing && (recordingSpeaker === 'stranger' || recordingSpeaker === 'auto') ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200">
                <Loader2 className="w-5 h-5 animate-spin text-rose-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">
                    Translating stranger's speech to {userLang.name}...
                  </p>
                  <p className="text-[11px] text-slate-400">Detecting dialect & grammar nuances</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-4 text-slate-500">
                <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs sm:text-sm font-medium text-slate-400">
                  Ready for instant bilateral translation
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  Tap the microphone buttons below. Gemini automatically detects Indian and Global languages.
                </p>
              </div>
            ) : mostRecentMessage?.speaker === 'stranger' ? (
              /* Stranger spoke -> Display translated text in User's language */
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">
                    Translated for You ({userLang.name})
                  </span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                  {mostRecentMessage.translatedText}
                </p>
                {mostRecentMessage.phoneticTranslated && (
                  <p className="text-xs sm:text-sm text-emerald-300/80 font-mono italic">
                    "{mostRecentMessage.phoneticTranslated}"
                  </p>
                )}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Stranger said:</span>
                  <span>"{mostRecentMessage.originalText}"</span>
                </div>
              </div>
            ) : (
              /* User just spoke -> Display what user said in user language */
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-bold">
                    You Said ({userLang.name})
                  </span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-white leading-relaxed">
                  {mostRecentMessage?.originalText}
                </p>
                {mostRecentMessage?.phoneticOriginal && (
                  <p className="text-xs sm:text-sm text-indigo-300/80 font-mono italic">
                    "{mostRecentMessage.phoneticOriginal}"
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ---------------------------------------------------------------- */}
      {/* Active Recording Waveform Banner (When recording is underway)     */}
      {/* ---------------------------------------------------------------- */}
      {isRecording && (
        <div className="bg-gradient-to-r from-red-950/95 via-slate-900/95 to-red-950/95 border-t border-red-500/40 px-4 py-3 flex items-center justify-between z-40 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold text-red-400 font-mono uppercase">
                LISTENING {recordingSpeaker === 'user' ? 'TO YOU' : recordingSpeaker === 'stranger' ? 'TO STRANGER' : 'DUAL CONVERSATION'} ({formatSeconds(recordingSeconds)})
              </span>
            </div>

            {/* Audio Waveform visual bars */}
            <div className="flex items-center gap-1 h-5">
              {[0.3, 0.7, 1, 0.6, 0.4, 0.8, 0.5].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-400 rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(4, Math.min(22, audioLevel * 120 * h + 4))}px`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="cancel-bridge-recording-btn"
              onClick={cancelRecording}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <button
              id="stop-and-translate-bridge-btn"
              onClick={stopAndProcessRecording}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Translate Now</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Keyboard Text Translation Input Bar (Optional modal/drawer)       */}
      {/* ---------------------------------------------------------------- */}
      {showKeyboard && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 z-30 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Type message as:</span>
              <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <button
                  onClick={() => setTypedSpeaker('user')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    typedSpeaker === 'user'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  You ({userLang.name})
                </button>
                <button
                  onClick={() => setTypedSpeaker('stranger')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    typedSpeaker === 'stranger'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Stranger ({strangerLang.name})
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowKeyboard(false)}
              className="text-slate-500 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTranslateText(typedText, typedSpeaker);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={`Type in ${typedSpeaker === 'user' ? userLang.name : strangerLang.name}...`}
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!typedText.trim() || isProcessing}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Translate</span>
            </button>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Bottom Control Dock: Google Translate 3-Mic Button Interface     */}
      {/* ---------------------------------------------------------------- */}
      <footer className="relative z-30 p-3 sm:p-4 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl flex flex-col items-center gap-2.5">
        <div className="w-full max-w-md flex items-center justify-between gap-3">
          {/* 1. Left Button: USER SPEAK (Blue) */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <button
              id="user-speak-mic-btn"
              onClick={() => startRecording('user')}
              disabled={isProcessing}
              className={`w-full py-3.5 px-3 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                isRecording && recordingSpeaker === 'user'
                  ? 'bg-blue-500 text-white border-blue-400 ring-4 ring-blue-500/30 animate-pulse'
                  : 'bg-blue-600/90 hover:bg-blue-500 text-white border-blue-500/40 hover:shadow-blue-600/30'
              }`}
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-bold truncate">
                {userLang.name}
              </span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono">You Speak</span>
          </div>

          {/* 2. Center Button: AUTO DUAL MIC / CONVERSATION (Gradient/Purple) */}
          <div className="flex flex-col items-center gap-1">
            <button
              id="auto-dual-conversation-mic-btn"
              onClick={() => startRecording('auto')}
              disabled={isProcessing}
              className={`w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white flex items-center justify-center shadow-xl shadow-indigo-600/40 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isRecording && recordingSpeaker === 'auto'
                  ? 'ring-4 ring-purple-500/50 animate-pulse'
                  : ''
              }`}
              title="Auto Conversation Mode: Identifies either speaker and language automatically"
            >
              <Radio className="w-6 h-6" />
            </button>
            <span className="text-[10px] text-indigo-300 font-mono font-bold">Auto Bridge</span>
          </div>

          {/* 3. Right Button: STRANGER SPEAK (Rose/Red) */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <button
              id="stranger-speak-mic-btn"
              onClick={() => startRecording('stranger')}
              disabled={isProcessing}
              className={`w-full py-3.5 px-3 rounded-2xl border font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                isRecording && recordingSpeaker === 'stranger'
                  ? 'bg-rose-500 text-white border-rose-400 ring-4 ring-rose-500/30 animate-pulse'
                  : 'bg-rose-600/90 hover:bg-rose-500 text-white border-rose-500/40 hover:shadow-rose-600/30'
              }`}
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-bold truncate">
                {strangerLang.isAuto ? 'Stranger' : strangerLang.name}
              </span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono">Stranger Speaks</span>
          </div>
        </div>

        {/* Quick Bottom Auxiliary Action Chips */}
        <div className="flex items-center gap-2 pt-1 text-xs">
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Type Text</span>
          </button>

          <span className="text-slate-700">•</span>

          <button
            onClick={() => setShowPhraseDrawer(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Emergency / Travel Phrases</span>
          </button>
        </div>
      </footer>

      {/* ---------------------------------------------------------------- */}
      {/* Drawer 1: Quick Situational Phrases Overlay                      */}
      {/* ---------------------------------------------------------------- */}
      {showPhraseDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Emergency & Travel Phrases
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tap any phrase to instantly translate & speak aloud to the stranger
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPhraseDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {QUICK_SITUATIONAL_PHRASES.map((group, idx) => {
                const GroupIcon = group.icon;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <GroupIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{group.category}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.phrases.map((phrase, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => {
                            setShowPhraseDrawer(false);
                            handleTranslateText(phrase.text, 'user');
                          }}
                          className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group cursor-pointer"
                        >
                          <p className="text-xs font-medium text-slate-200 group-hover:text-white">
                            {phrase.text}
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                            {phrase.context}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Drawer 2: Full Bilateral Conversation History Transcript         */}
      {/* ---------------------------------------------------------------- */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-500/30">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Conversation Transcript Log
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {messages.length} bilateral translations in this session
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin"
            >
              {messages.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No conversation turns recorded yet.
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.speaker === 'user';
                  return (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl border space-y-1.5 ${
                        isUser
                          ? 'bg-indigo-950/40 border-indigo-500/30'
                          : 'bg-rose-950/40 border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span
                          className={`font-bold uppercase ${
                            isUser ? 'text-indigo-300' : 'text-rose-300'
                          }`}
                        >
                          {isUser ? `You (${m.sourceLanguage.name})` : `Stranger (${m.sourceLanguage.name})`}
                        </span>
                        <span className="text-slate-500">
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-slate-300">"{m.originalText}"</p>
                        <p className="text-xs font-bold text-white mt-1">
                          ↳ {m.translatedText}
                        </p>
                        {m.phoneticTranslated && (
                          <p className="text-[11px] text-slate-400 font-mono italic">
                            ({m.phoneticTranslated})
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => speakText(m.translatedText, m.targetLanguage.code, false)}
                          className="p-1 rounded-md text-slate-400 hover:text-white"
                          title="Play translation"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopy(m.translatedText, m.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-white"
                          title="Copy"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {messages.length > 0 && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setMessages([])}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                >
                  Clear Transcript
                </button>
                <button
                  onClick={() => setShowHistoryDrawer(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Language Selection Modal (User or Stranger)                      */}
      {/* ---------------------------------------------------------------- */}
      {(isUserLangModalOpen || isStrangerLangModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Select {isUserLangModalOpen ? 'Your Language' : "Stranger's Language"}
              </span>
              <button
                onClick={() => {
                  setIsUserLangModalOpen(false);
                  setIsStrangerLangModalOpen(false);
                  setLangSearch('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Region Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl text-xs">
              <button
                onClick={() => setLangRegionFilter('all')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  langRegionFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setLangRegionFilter('india')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                  langRegionFilter === 'india'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇮🇳</span>
                <span>Indian</span>
              </button>
              <button
                onClick={() => setLangRegionFilter('global')}
                className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                  langRegionFilter === 'global'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🌍</span>
                <span>Global</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search language (e.g. Tamil, Hindi, French, Spanish)..."
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Languages List */}
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {filteredLanguages.map((lang) => {
                const isSelected = isUserLangModalOpen
                  ? userLang.code === lang.code
                  : strangerLang.code === lang.code;

                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (isUserLangModalOpen) {
                        setUserLang(lang);
                      } else {
                        setStrangerLang(lang);
                      }
                      setIsUserLangModalOpen(false);
                      setIsStrangerLangModalOpen(false);
                      setLangSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/30 text-white border border-indigo-500/50'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{lang.flag}</span>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-100">{lang.name}</span>
                          {lang.region === 'india' && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium font-mono">
                              IN
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">{lang.nativeName}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
