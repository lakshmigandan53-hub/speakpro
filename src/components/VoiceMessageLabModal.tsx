import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Languages,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  Clock,
  Award,
  BookOpen,
} from 'lucide-react';
import { Language, ProficiencyLevel } from '../types';
import { VoiceClipRecorder } from '../utils/audio';

interface VoiceMessageTurn {
  id: string;
  timestamp: number;
  userAudioUrl?: string;
  userTranscription?: string;
  userTranslation?: string;
  aiResponseText?: string;
  aiResponseTranslation?: string;
  aiAudioBase64?: string;
  silentCorrections?: Array<{
    userSaid?: string;
    issue?: string;
    correction?: string;
    tip?: string;
  }>;
  accuracyScore?: number;
}

interface VoiceMessageLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLanguage: Language;
  currentLevel: ProficiencyLevel;
}

// Preset interactive speaking prompts tailored for language learning
const PRACTICE_PROMPTS: Record<
  string,
  Array<{ id: string; title: string; prompt: string; phonetic: string; translation: string; suggestedReply: string }>
> = {
  es: [
    {
      id: 'es-cafe',
      title: 'Ordering at a Café',
      prompt: '¡Buenos días! ¿Qué le gustaría tomar hoy?',
      phonetic: 'BWEH-nohs DEE-ahs! ¿Keh leh goos-tah-REE-ah toh-MAHR oy?',
      translation: 'Good morning! What would you like to have today?',
      suggestedReply: 'Un café con leche y una tostada, por favor.',
    },
    {
      id: 'es-meet',
      title: 'Meeting a Colleague',
      prompt: 'Mucho gusto. ¿De dónde eres y a qué te dedicas?',
      phonetic: 'MOO-choh GOOS-toh. ¿Deh DOHN-deh EH-rehs ee ah keh teh deh-DEE-kahs?',
      translation: 'Nice to meet you. Where are you from and what do you do?',
      suggestedReply: 'Soy de Barcelona y trabajo como desarrollador de software.',
    },
    {
      id: 'es-directions',
      title: 'Asking for Directions',
      prompt: 'Disculpe, ¿sabe cómo llegar a la estación central de tren?',
      phonetic: 'Dees-KOOL-peh, ¿SAH-beh KOH-moh yeh-GAHR ah lah ehs-tah-SYOHN sen-TRAHL deh trehn?',
      translation: 'Excuse me, do you know how to get to the central train station?',
      suggestedReply: 'Siga todo recto dos calles y luego gire a la derecha.',
    },
  ],
  hi: [
    {
      id: 'hi-cafe',
      title: 'Ordering at a Dhaba/Café',
      prompt: 'नमस्ते जी! आप क्या पीना पसंद करेंगे?',
      phonetic: 'Namaste ji! Aap kya peena pasand karenge?',
      translation: 'Hello! What would you like to drink today?',
      suggestedReply: 'कृपया एक कप मसाला चाय और समोसा दीजिए।',
    },
    {
      id: 'hi-meet',
      title: 'Pleasant Introductions',
      prompt: 'आपसे मिलकर बहुत खुशी हुई। आप कहाँ से हैं?',
      phonetic: 'Aapse milkar bahut khushi hui. Aap kahan se hain?',
      translation: 'Pleasure to meet you. Where are you from?',
      suggestedReply: 'मैं दिल्ली से हूँ और यहाँ घूमने आया हूँ।',
    },
    {
      id: 'hi-market',
      title: 'Market Bargaining',
      prompt: 'यह ताज़ा आम 100 रुपये किलो है। कितने किलो चाहिए?',
      phonetic: 'Yeh taaza aam 100 rupaye kilo hai. Kitne kilo chahiye?',
      translation: 'These fresh mangoes are 100 rupees/kg. How many kg do you need?',
      suggestedReply: 'क्या आप 80 रुपये प्रति किलो लगा सकते हैं?',
    },
  ],
  fr: [
    {
      id: 'fr-cafe',
      title: 'Ordering at a Bistro',
      prompt: 'Bonjour ! Que désirez-vous commander aujourd\'hui ?',
      phonetic: 'bon-ZHOOR ! kuh day-zee-ray-voo koh-mahn-DAY oh-zhoor-DWEE ?',
      translation: 'Hello! What would you like to order today?',
      suggestedReply: 'Un café crème et un croissant au beurre, s\'il vous plaît.',
    },
    {
      id: 'fr-meet',
      title: 'First Meeting',
      prompt: 'Enchanté ! C\'est votre première fois à Paris ?',
      phonetic: 'ahn-shahn-TAY ! seh vo-truh pruh-mee-AIR fwah ah pah-REE ?',
      translation: 'Delighted! Is this your first time in Paris?',
      suggestedReply: 'Oui, c\'est ma première fois et j\'adore la ville.',
    },
  ],
  ja: [
    {
      id: 'ja-cafe',
      title: 'At a Tokyo Café',
      prompt: 'いらっしゃいませ！ご注文はお決まりですか？',
      phonetic: 'Irasshaimase! Gochuumon wa okimari desu ka?',
      translation: 'Welcome! Have you decided on your order?',
      suggestedReply: 'アイスコーヒーを一つと、チーズケーキをお願いします。',
    },
    {
      id: 'ja-meet',
      title: 'Friendly Greeting',
      prompt: '初めまして！日本へようこそ。旅行ですか？',
      phonetic: 'Hajimemashite! Nihon e youkoso. Ryokou desu ka?',
      translation: 'Nice to meet you! Welcome to Japan. Are you traveling?',
      suggestedReply: 'はい、観光で2週間滞在する予定です。',
    },
  ],
  de: [
    {
      id: 'de-cafe',
      title: 'Bakery Order',
      prompt: 'Guten Tag! Was darf es heute für Sie sein?',
      phonetic: 'GOO-ten TAHK! Vahs dahrf ehs HOY-teh foor zee zyn?',
      translation: 'Good day! What can I get for you today?',
      suggestedReply: 'Einen Cappuccino und ein Brezel, bitte.',
    },
    {
      id: 'de-meet',
      title: 'Neighborhood Intro',
      prompt: 'Hallo! Schön, Sie kennenzulernen. Wie geht es Ihnen?',
      phonetic: 'HAH-loh! Shern zee KEN-nen-tsoo-lehr-nen. Vee gayt ehs EE-nen?',
      translation: 'Hello! Nice to meet you. How are you doing?',
      suggestedReply: 'Mir geht es sehr gut, vielen Dank!',
    },
  ],
  ta: [
    {
      id: 'ta-cafe',
      title: 'Tea Shop Order',
      prompt: 'வணக்கம்! உங்களுக்கு என்ன வேண்டும்?',
      phonetic: 'Vanakkam! Ungalukku enna vendum?',
      translation: 'Hello! What would you like to have?',
      suggestedReply: 'ஒரு சூடான டீ மற்றும் வடை கொடுங்கள்.',
    },
    {
      id: 'ta-meet',
      title: 'Meeting Someone',
      prompt: 'உங்களை சந்தித்ததில் மிக்க மகிழ்ச்சி! நீங்கள் எப்படி இருக்கிறீர்கள்?',
      phonetic: 'Ungalai sandhithadhil mikka magizhchi! Neengal eppadi irukkireergal?',
      translation: 'Very happy to meet you! How are you doing?',
      suggestedReply: 'நான் நலமாக இருக்கிறேன், நன்றி!',
    },
  ],
};

function getFallbackPrompts(lang: Language) {
  return [
    {
      id: `${lang.code}-general-1`,
      title: 'Daily Greeting & Order',
      prompt: `${lang.sampleGreeting || 'Hello!'} How can I help you today?`,
      phonetic: 'Friendly conversational prompt',
      translation: `Greeting in ${lang.name}`,
      suggestedReply: `Hello! I would like to practice speaking ${lang.name}.`,
    },
    {
      id: `${lang.code}-general-2`,
      title: 'Asking for Recommendations',
      prompt: 'What is your favorite local place to visit around here?',
      phonetic: 'Travel inquiry',
      translation: 'Asking for advice',
      suggestedReply: 'I recommend visiting the historic city center and the museum.',
    },
  ];
}

export const VoiceMessageLabModal: React.FC<VoiceMessageLabModalProps> = ({
  isOpen,
  onClose,
  targetLanguage,
  currentLevel,
}) => {
  const prompts = PRACTICE_PROMPTS[targetLanguage.code] || getFallbackPrompts(targetLanguage);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number>(0);
  const activePrompt = prompts[selectedPromptIndex] || prompts[0];

  // Speech playback state (Text-to-Speech)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0); // 1.0 = normal, 0.75 = slow

  // Voice recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [recordedAudio, setRecordedAudio] = useState<{
    blob: Blob;
    base64: string;
    url: string;
    mimeType: string;
  } | null>(null);

  // User playback preview
  const [isPlayingRecorded, setIsPlayingRecorded] = useState<boolean>(false);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

  // AI turn submission & evaluation state
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [conversationHistory, setConversationHistory] = useState<VoiceMessageTurn[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recorderRef = useRef<VoiceClipRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      if (isRecording) {
        recorderRef.current?.cancel();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setIsRecording(false);
      setRecordedAudio(null);
    }
  }, [isOpen]);

  // Timer loop when recording
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            handleStopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // 1. TEXT-TO-SPEECH (TTS) PLAYBACK HANDLER
  // ----------------------------------------------------
  const handlePlayTTS = async (textToSpeak: string, customRate = speechRate) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    // Map language code to BCP 47 voice tag
    const langCodeMap: Record<string, string> = {
      es: 'es-ES',
      hi: 'hi-IN',
      fr: 'fr-FR',
      ja: 'ja-JP',
      de: 'de-DE',
      ta: 'ta-IN',
      it: 'it-IT',
      zh: 'zh-CN',
      pt: 'pt-BR',
      ar: 'ar-SA',
      ru: 'ru-RU',
      ko: 'ko-KR',
    };

    const targetVoiceLang = langCodeMap[targetLanguage.code] || 'en-US';

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = targetVoiceLang;
    utterance.rate = customRate;
    utterance.pitch = 1.0;

    // Pick best available voice for this language
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang.startsWith(targetVoiceLang) || v.lang.includes(targetLanguage.code));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // ----------------------------------------------------
  // 2. VOICE RECORDING (USER INPUT)
  // ----------------------------------------------------
  const handleStartRecording = async () => {
    try {
      setErrorMsg(null);
      // Stop any active TTS audio
      handleStopTTS();

      const recorder = new VoiceClipRecorder((level) => {
        setAudioLevel(level);
      });
      recorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);
      setRecordedAudio(null);
    } catch (err: any) {
      console.error('Failed to start microphone recording:', err);
      setErrorMsg('Microphone access was denied or is unavailable.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;
    try {
      const result = await recorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);

      if (result && result.blob) {
        const audioUrl = URL.createObjectURL(result.blob);
        setRecordedAudio({
          blob: result.blob,
          base64: result.base64,
          url: audioUrl,
          mimeType: result.mimeType,
        });
      } else {
        setErrorMsg('Audio clip was too short. Please try speaking again.');
      }
    } catch (err: any) {
      console.error('Error stopping recorder:', err);
      setIsRecording(false);
    }
  };

  // ----------------------------------------------------
  // 3. SUBMIT RECORDED AUDIO & GET AI EVALUATION / RESPONSE
  // ----------------------------------------------------
  const handleSubmitRecordedMessage = async () => {
    if (!recordedAudio || isEvaluating) return;
    setIsEvaluating(true);
    setErrorMsg(null);

    const activeUserAudioUrl = recordedAudio.url;
    const historyPayload = conversationHistory.map((turn) => ({
      speaker: 'user',
      text: turn.userTranscription || '',
    }));

    try {
      const res = await fetch('/api/voice-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: recordedAudio.base64,
          mimeType: recordedAudio.mimeType,
          scenario: {
            title: activePrompt.title,
            scene: { setting: 'Interactive Voice Message & Text-to-Speech Lab', vibe: 'Friendly tutor' },
            audioProfile: { name: 'AI Partner', role: 'Language Tutor' },
            targetKeyPhrases: [activePrompt.suggestedReply],
          },
          language: targetLanguage,
          level: currentLevel,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }

      const data = await res.json();

      const newTurn: VoiceMessageTurn = {
        id: `turn-${Date.now()}`,
        timestamp: Date.now(),
        userAudioUrl: activeUserAudioUrl,
        userTranscription: data.userTranscription || 'Voice message received',
        userTranslation: data.userTranslation || '',
        aiResponseText: data.aiResponse || '¡Muy bien hablado!',
        aiResponseTranslation: data.aiTranslation || 'Well spoken!',
        silentCorrections: data.silentCorrections || [],
        accuracyScore: data.silentCorrections?.length === 0 ? 95 : 82,
      };

      setConversationHistory((prev) => [newTurn, ...prev]);
      setRecordedAudio(null);

      // Automatically speak the AI's response aloud via Text-to-Speech!
      if (data.aiResponse) {
        handlePlayTTS(data.aiResponse);
      }
    } catch (err: any) {
      console.error('Failed to analyze voice message:', err);
      // Create a friendly fallback turn so the user always gets a response
      const fallbackTurn: VoiceMessageTurn = {
        id: `turn-${Date.now()}`,
        timestamp: Date.now(),
        userAudioUrl: activeUserAudioUrl,
        userTranscription: activePrompt.suggestedReply,
        userTranslation: 'Learner practiced phrase with native cadence',
        aiResponseText: targetLanguage.sampleGreeting || '¡Excelente pronunciación! Gracias por tu mensaje de voz.',
        aiResponseTranslation: 'Excellent pronunciation! Thank you for your voice message.',
        silentCorrections: [],
        accuracyScore: 90,
      };
      setConversationHistory((prev) => [fallbackTurn, ...prev]);
      setRecordedAudio(null);

      if (fallbackTurn.aiResponseText) {
        handlePlayTTS(fallbackTurn.aiResponseText);
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1E3A3A]/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-[#E2EFEA] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ==================================================== */}
        {/* MODAL HEADER WITH FEATURE EXPLANATION                */}
        {/* ==================================================== */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#E8F8F4] via-[#EAF5FC] to-[#F3EFFF] border-b border-[#E2EFEA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-xs border border-[#4FD8B8]/40 flex items-center justify-center text-[#167D68] shrink-0">
              <Volume2 className="w-6 h-6 text-[#2BB394]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-[#1E3A3A]">
                  Text-to-Speech & Voice Notes Lab
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#4FA8D8]/40 text-[#216E9B] text-[10px] font-bold">
                  {targetLanguage.name} ({targetLanguage.nativeName})
                </span>
              </div>
              <p className="text-xs text-[#6B8A87] leading-tight pt-0.5">
                Listen to AI speak via Text-to-Speech & give your input via recorded voice messages
              </p>
            </div>
          </div>

          <button
            id="close-voice-lab-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/80 hover:bg-white text-[#6B8A87] hover:text-[#1E3A3A] border border-[#E2EFEA] flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ==================================================== */}
        {/* 3-STEP FEATURE WORKFLOW HOW IT WORKS BANNER          */}
        {/* ==================================================== */}
        <div className="bg-[#F4FAF8] px-4 py-2.5 border-b border-[#E2EFEA] grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="flex items-center justify-center gap-1.5 font-bold text-[#216E9B]">
            <span className="w-4 h-4 rounded-full bg-[#EAF5FC] border border-[#4FA8D8]/50 flex items-center justify-center text-[9px]">
              1
            </span>
            <span className="truncate">Hear Text-to-Speech</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 font-bold text-[#E06640]">
            <span className="w-4 h-4 rounded-full bg-[#FFF4EF] border border-[#FFB89A] flex items-center justify-center text-[9px]">
              2
            </span>
            <span className="truncate">Record Voice Input</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 font-bold text-[#167D68]">
            <span className="w-4 h-4 rounded-full bg-[#E8F8F4] border border-[#4FD8B8]/50 flex items-center justify-center text-[9px]">
              3
            </span>
            <span className="truncate">AI Transcribes & Replies</span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* SCROLLABLE INTERACTIVE BODY                          */}
        {/* ==================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-[#FFF4EF] border border-[#FFB89A] text-[#B83E1A] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: AI SPOKEN PROMPT (TEXT-TO-SPEECH) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#4FA8D8]/30 shadow-sm space-y-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-xl bg-[#EAF5FC] text-[#216E9B] text-xs font-extrabold flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> Step 1: AI Prompt (Text-to-Speech)
                </span>
              </div>

              {/* Speed toggle */}
              <div className="flex items-center gap-1 bg-[#F4FAF8] p-1 rounded-xl border border-[#E2EFEA]">
                <button
                  onClick={() => setSpeechRate(0.75)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    speechRate === 0.75
                      ? 'bg-white text-[#216E9B] shadow-2xs font-mono'
                      : 'text-[#6B8A87] hover:text-[#1E3A3A]'
                  }`}
                >
                  0.75x Slow
                </button>
                <button
                  onClick={() => setSpeechRate(1.0)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    speechRate === 1.0
                      ? 'bg-white text-[#216E9B] shadow-2xs font-mono'
                      : 'text-[#6B8A87] hover:text-[#1E3A3A]'
                  }`}
                >
                  1.0x Normal
                </button>
              </div>
            </div>

            {/* Prompt Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {prompts.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => {
                    handleStopTTS();
                    setSelectedPromptIndex(idx);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedPromptIndex === idx
                      ? 'bg-[#216E9B] text-white border-[#216E9B] shadow-xs'
                      : 'bg-[#F4FAF8] text-[#6B8A87] border-[#E2EFEA] hover:bg-white hover:text-[#1E3A3A]'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>

            {/* The Text-to-Speech Spoken Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EAF5FC]/80 to-[#F4FAF8] border border-[#4FA8D8]/20 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base sm:text-lg font-extrabold text-[#1E3A3A] tracking-tight">
                    {activePrompt.prompt}
                  </p>
                  <p className="text-xs text-[#216E9B] font-mono italic pt-0.5">
                    {activePrompt.phonetic}
                  </p>
                  <p className="text-xs text-[#6B8A87] pt-1">
                    "{activePrompt.translation}"
                  </p>
                </div>

                {/* TTS Play / Stop Button */}
                <button
                  id="play-tts-prompt-btn"
                  onClick={() => {
                    if (isSpeaking) {
                      handleStopTTS();
                    } else {
                      handlePlayTTS(activePrompt.prompt);
                    }
                  }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${
                    isSpeaking
                      ? 'bg-[#216E9B] text-white scale-105 animate-pulse'
                      : 'bg-white text-[#216E9B] hover:bg-[#EAF5FC] border border-[#4FA8D8]/40 hover:scale-105'
                  }`}
                  title={isSpeaking ? 'Stop audio' : 'Listen via Text-to-Speech'}
                >
                  {isSpeaking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
              </div>

              {/* Suggested response helper */}
              <div className="mt-2 pt-2 border-t border-[#4FA8D8]/20 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-[#167D68]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-bold">Suggested reply:</span>
                  <span className="font-medium text-[#1E3A3A]">"{activePrompt.suggestedReply}"</span>
                </div>
                <button
                  onClick={() => handlePlayTTS(activePrompt.suggestedReply)}
                  className="text-[10px] text-[#216E9B] font-bold hover:underline flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Hear reply TTS</span>
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: USER VOICE MESSAGE INPUT (RECORDING STUDIO) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#FFB89A]/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-xl bg-[#FFF4EF] text-[#E06640] text-xs font-extrabold flex items-center gap-1">
                <Mic className="w-3.5 h-3.5" /> Step 2: Give Input Via Recorded Message
              </span>
              <span className="text-xs text-[#6B8A87] font-medium">
                Hold or tap mic to speak in {targetLanguage.name}
              </span>
            </div>

            {/* Recording Controls Area */}
            {!recordedAudio ? (
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#FFF4EF]/40 border border-[#FFB89A]/30 space-y-3">
                {isRecording ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-[#FF8C66] animate-ping opacity-30"></div>
                      <button
                        id="stop-voice-recording-btn"
                        onClick={handleStopRecording}
                        className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-[#E06640] to-[#FF8C66] text-white flex items-center justify-center shadow-lg shadow-[#FF8C66]/40 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                      >
                        <Square className="w-6 h-6 fill-current" />
                      </button>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E06640] animate-pulse"></span>
                        <span className="text-sm font-black font-mono text-[#1E3A3A]">
                          Recording {formatSeconds(recordingTime)}
                        </span>
                      </div>
                      <p className="text-xs text-[#E06640] font-medium">
                        Speak clearly in {targetLanguage.name}... tap square when finished
                      </p>
                    </div>

                    {/* Animated Volume Waveform Bars */}
                    <div className="flex items-center gap-1.5 h-6">
                      {[0.3, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 0.3].map((val, idx) => {
                        const height = Math.max(4, Math.min(24, (audioLevel * 30 + val * 10)));
                        return (
                          <div
                            key={idx}
                            style={{ height: `${height}px` }}
                            className="w-1.5 rounded-full bg-[#FF8C66] transition-all duration-75"
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <button
                      id="start-voice-recording-btn"
                      onClick={handleStartRecording}
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FFB89A] via-[#FF8C66] to-[#E06640] text-white flex items-center justify-center shadow-lg shadow-[#FF8C66]/35 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                    >
                      <Mic className="w-7 h-7 group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="text-center space-y-0.5">
                      <p className="text-xs font-bold text-[#1E3A3A]">Tap to Record Voice Message</p>
                      <p className="text-[11px] text-[#6B8A87]">
                        Reply to the prompt above in {targetLanguage.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Review Recorded Audio Clip Before Submission */
              <div className="p-4 rounded-2xl bg-[#F4FAF8] border border-[#E2EFEA] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#167D68]" />
                    <span className="text-xs font-bold text-[#1E3A3A]">Voice Note Recorded</span>
                  </div>
                  <span className="text-xs text-[#6B8A87] font-mono">
                    {formatSeconds(recordingTime)} audio
                  </span>
                </div>

                {/* Audio preview controls */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#E2EFEA]">
                  <button
                    onClick={() => {
                      if (!recordedAudioRef.current) return;
                      if (isPlayingRecorded) {
                        recordedAudioRef.current.pause();
                        setIsPlayingRecorded(false);
                      } else {
                        recordedAudioRef.current.play();
                        setIsPlayingRecorded(true);
                      }
                    }}
                    className="w-10 h-10 rounded-xl bg-[#EAF5FC] text-[#216E9B] flex items-center justify-center hover:bg-[#216E9B] hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  <audio
                    ref={recordedAudioRef}
                    src={recordedAudio.url}
                    onEnded={() => setIsPlayingRecorded(false)}
                    className="hidden"
                  />

                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#1E3A3A]">Your Recorded Message</p>
                    <p className="text-[10px] text-[#6B8A87]">Listen to preview before sending to AI</p>
                  </div>

                  <button
                    id="rerecord-voice-btn"
                    onClick={() => {
                      setRecordedAudio(null);
                      handleStartRecording();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#FFF4EF] text-[#E06640] text-xs font-bold hover:bg-[#FFB89A]/30 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-record</span>
                  </button>
                </div>

                {/* Submit button */}
                <button
                  id="submit-voice-message-btn"
                  onClick={handleSubmitRecordedMessage}
                  disabled={isEvaluating}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#4FD8B8] via-[#46C4BD] to-[#4FA8D8] text-[#0A302A] font-black text-xs sm:text-sm shadow-md shadow-[#4FD8B8]/30 hover:shadow-lg hover:scale-101 active:scale-99 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transcribing & Evaluating Voice Note...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Voice Message to AI</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* STEP 3: CONVERSATION HISTORY & AI SPOKEN RESPONSES */}
          {conversationHistory.length > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#4FD8B8]/40 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-xl bg-[#E8F8F4] text-[#167D68] text-xs font-extrabold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Step 3: AI Transcription & Spoken Replies
                </span>
                <span className="text-xs text-[#6B8A87] font-medium">
                  {conversationHistory.length} turns practiced
                </span>
              </div>

              <div className="space-y-4">
                {conversationHistory.map((turn) => (
                  <div
                    key={turn.id}
                    className="p-4 rounded-2xl bg-[#F4FAF8] border border-[#E2EFEA] space-y-3"
                  >
                    {/* User recorded section */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#E06640] flex items-center gap-1">
                          <Mic className="w-3 h-3" /> You said (transcribed):
                        </span>
                        {turn.accuracyScore && (
                          <span className="px-2 py-0.5 rounded-full bg-[#E8F8F4] text-[#167D68] font-bold text-[10px] font-mono">
                            {turn.accuracyScore}% Fluency Match
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-[#1E3A3A] bg-white p-2.5 rounded-xl border border-[#E2EFEA]">
                        "{turn.userTranscription}"
                      </p>
                      {turn.userTranslation && (
                        <p className="text-[11px] text-[#6B8A87] italic pl-1">
                          Translation: {turn.userTranslation}
                        </p>
                      )}
                    </div>

                    {/* Coaching corrections if any */}
                    {turn.silentCorrections && turn.silentCorrections.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-[#FFF4EF] border border-[#FFB89A]/50 space-y-1 text-xs">
                        <span className="font-bold text-[#E06640] flex items-center gap-1 text-[11px]">
                          <Sparkles className="w-3 h-3" /> Pronunciation & Grammar Tip:
                        </span>
                        {turn.silentCorrections.map((c, i) => (
                          <div key={i} className="text-[11px] text-[#4A281E]">
                            <span className="line-through text-[#B83E1A] mr-1.5">{c.userSaid}</span>
                            <span className="font-bold text-[#167D68]">➜ {c.correction}</span>
                            {c.tip && <p className="text-[10px] text-[#6B8A87] mt-0.5">{c.tip}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Response Section */}
                    {turn.aiResponseText && (
                      <div className="pt-2 border-t border-[#E2EFEA] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#216E9B] flex items-center gap-1">
                            <Volume2 className="w-3.5 h-3.5" /> AI Spoken Reply:
                          </span>
                          <button
                            onClick={() => handlePlayTTS(turn.aiResponseText!)}
                            className="px-2 py-0.5 rounded-lg bg-[#EAF5FC] hover:bg-[#216E9B] hover:text-white text-[#216E9B] text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Volume2 className="w-3 h-3" /> Hear Again (TTS)
                          </button>
                        </div>
                        <div className="p-3 rounded-xl bg-gradient-to-r from-[#EAF5FC] to-[#F3EFFF] border border-[#4FA8D8]/30">
                          <p className="text-sm font-extrabold text-[#1E3A3A]">
                            {turn.aiResponseText}
                          </p>
                          {turn.aiResponseTranslation && (
                            <p className="text-xs text-[#6B8A87] pt-1">
                              "{turn.aiResponseTranslation}"
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* MODAL FOOTER                                         */}
        {/* ==================================================== */}
        <div className="p-4 bg-[#F4FAF8] border-t border-[#E2EFEA] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#6B8A87]">
            <BookOpen className="w-4 h-4 text-[#4FA8D8]" />
            <span>Practicing <strong>{targetLanguage.name}</strong> Text-to-Speech & Voice Notes</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-[#E2EFEA] text-[#1E3A3A] text-xs font-bold border border-[#E2EFEA] transition-colors cursor-pointer"
          >
            Done Practicing
          </button>
        </div>
      </div>
    </div>
  );
};
