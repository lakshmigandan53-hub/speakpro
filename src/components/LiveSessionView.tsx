import React, { useState, useRef, useEffect } from 'react';
import {
  ConversationVisualState,
  InteractionMode,
  Language,
  LiveTranscriptItem,
  PhraseHint,
  ProficiencyLevel,
  Scenario,
  SilentCorrection,
  KeyPhraseAchievement,
} from '../types';
import { GeminiOrb } from './GeminiOrb';
import { LiveTranscriptView } from './LiveTranscriptView';
import { CoachingDrawer } from './CoachingDrawer';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  ArrowLeft,
  BookOpen,
  Volume2,
  VolumeX,
  Keyboard,
  Headphones,
  Send,
  X,
  ChevronDown,
  Check,
  Languages,
  Square,
  Radio,
} from 'lucide-react';

interface LiveSessionViewProps {
  scenario: Scenario;
  language: Language;
  level: ProficiencyLevel;
  visualState: ConversationVisualState;
  audioInputLevel: number;
  audioOutputLevel: number;
  isMuted: boolean;
  transcript: LiveTranscriptItem[];
  corrections: SilentCorrection[];
  keyPhrasesAchieved: KeyPhraseAchievement[];
  currentMode: InteractionMode;
  isRecordingVoiceClip?: boolean;
  recordingDurationSeconds?: number;
  onStartRecordingVoiceClip?: () => void;
  onStopAndSendVoiceClip?: () => void;
  onCancelRecordingVoiceClip?: () => void;
  onSwitchInteractionMode: (mode: InteractionMode) => void;
  onToggleMute: () => void;
  onEndSession: () => void;
  onSendPhraseHint: (text: string) => void;
  onSendTextMessage: (text: string) => void;
  onBack: () => void;
  onOpenStrangerBridge?: () => void;
}

const INTERACTION_MODES_CONFIG: {
  id: InteractionMode;
  name: string;
  shortLabel: string;
  badge: string;
  icon: any;
  accent: string;
  description: string;
}[] = [
  {
    id: 'speech-to-speech',
    name: 'Speech to Speech',
    shortLabel: 'Live Voice Call',
    badge: '🎙️ ↔ 🔊 Live Call',
    icon: Mic,
    accent: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    description: 'Speak in voice, hear real-time native spoken replies.',
  },
  {
    id: 'speech-to-text',
    name: 'Speech to Text',
    shortLabel: 'Voice Record',
    badge: '🎙️ → 💬 Voice Record',
    icon: Mic,
    accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    description: 'Record & send voice messages; read character replies.',
  },
  {
    id: 'text-to-speech',
    name: 'Text to Speech',
    shortLabel: 'Type & Listen',
    badge: '⌨️ → 🔊 Type & Listen',
    icon: Volume2,
    accent: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    description: 'Type messages, hear native spoken pronunciation.',
  },
  {
    id: 'text-to-text',
    name: 'Text to Text',
    shortLabel: 'Written Chat',
    badge: '⌨️ ↔ 💬 Written Chat',
    icon: Keyboard,
    accent: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    description: 'Type messages, read silent responses & grammar notes.',
  },
];

export const LiveSessionView: React.FC<LiveSessionViewProps> = ({
  scenario,
  language,
  level,
  visualState,
  audioInputLevel,
  audioOutputLevel,
  isMuted,
  transcript,
  corrections,
  keyPhrasesAchieved,
  currentMode,
  isRecordingVoiceClip = false,
  recordingDurationSeconds = 0,
  onStartRecordingVoiceClip,
  onStopAndSendVoiceClip,
  onCancelRecordingVoiceClip,
  onSwitchInteractionMode,
  onToggleMute,
  onEndSession,
  onSendPhraseHint,
  onSendTextMessage,
  onBack,
  onOpenStrangerBridge,
}) => {
  const [isCoachingDrawerOpen, setIsCoachingDrawerOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('');
  const [showKeyboardInput, setShowKeyboardInput] = useState<boolean>(
    currentMode === 'text-to-speech' || currentMode === 'text-to-text'
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync keyboard visibility when mode changes
  useEffect(() => {
    if (currentMode === 'text-to-speech' || currentMode === 'text-to-text') {
      setShowKeyboardInput(true);
    } else {
      setShowKeyboardInput(false);
    }
  }, [currentMode]);

  // Auto-scroll chat thread in turn-based modes
  useEffect(() => {
    if (currentMode === 'speech-to-text' || currentMode === 'text-to-text' || currentMode === 'text-to-speech') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, currentMode]);

  const activeModeConfig =
    INTERACTION_MODES_CONFIG.find((m) => m.id === currentMode) ||
    INTERACTION_MODES_CONFIG[0];

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getStatusLabel = () => {
    switch (visualState) {
      case 'connecting':
        return 'Connecting to Gemini Live...';
      case 'listening':
        if (currentMode === 'speech-to-text') {
          return `Recording your voice (${formatSeconds(recordingDurationSeconds)})...`;
        }
        return isMuted ? 'Microphone Muted' : 'Listening to you...';
      case 'speaking':
        return currentMode === 'speech-to-text' || currentMode === 'text-to-text'
          ? `${scenario.audioProfile.name} is replying...`
          : `${scenario.audioProfile.name} is speaking...`;
      case 'thinking':
        return 'Transcribing & Analyzing...';
      case 'muted':
        return 'Microphone Muted';
      case 'error':
        return 'Connection notice';
      default:
        if (currentMode === 'speech-to-text') {
          return 'Voice Record Mode • Press Record to speak';
        }
        return currentMode === 'text-to-text' || currentMode === 'text-to-speech'
          ? 'Type your message below'
          : 'Live Voice Active';
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;
    onSendTextMessage(textInput.trim());
    setTextInput('');
  };

  const handleInsertPhrase = (phraseText: string) => {
    onSendTextMessage(phraseText);
  };

  return (
    <div className="relative w-screen h-screen bg-[#0B0C0F] text-slate-100 flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Background ambient radial glow matching scenario accent */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-950/20 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-900/80 bg-slate-950/60 backdrop-blur-md">
        {/* Back / Exit Button */}
        <button
          id="live-session-back-btn"
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Scenarios</span>
        </button>

        {/* Center: Character & Scenario Pill */}
        <div className="flex items-center gap-2">
          <button
            id="scenario-info-pill-btn"
            onClick={() => setIsInfoModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-850 border border-slate-800 shadow-sm transition-all text-xs font-medium text-slate-200 cursor-pointer"
          >
            <span className="text-base">{language.flag}</span>
            <span className="font-semibold text-white">{scenario.audioProfile.name}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 hidden md:inline">{scenario.title}</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 ml-0.5" />
          </button>
        </div>

        {/* Right: Interaction Mode Switcher Dropdown */}
        <div className="relative">
          <button
            id="interaction-mode-switch-btn"
            onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all shadow-xs cursor-pointer ${activeModeConfig.accent}`}
          >
            {React.createElement(activeModeConfig.icon, { className: 'w-3.5 h-3.5' })}
            <span className="hidden sm:inline">{activeModeConfig.shortLabel}</span>
            <span className="sm:hidden">{activeModeConfig.name.split(' ')[0]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isModeDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 font-mono">
                Switch Interaction Mode
              </div>
              <div className="space-y-1">
                {INTERACTION_MODES_CONFIG.map((m) => {
                  const Icon = m.icon;
                  const isCurrent = m.id === currentMode;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSwitchInteractionMode(m.id);
                        setIsModeDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600/30 border border-indigo-500/40 text-white'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-100">{m.name}</span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{m.description}</p>
                      </div>
                    </button>
                  );
                })}

                {onOpenStrangerBridge && (
                  <div className="pt-1 mt-1 border-t border-slate-800">
                    <button
                      id="live-session-stranger-bridge-btn"
                      onClick={() => {
                        setIsModeDropdownOpen(false);
                        onOpenStrangerBridge();
                      }}
                      className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left text-xs bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-200 transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-600/30 flex items-center justify-center shrink-0 mt-0.5 text-emerald-300">
                        <Languages className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">Instant Stranger Bridge</span>
                          <span className="text-[9px] px-1 rounded bg-emerald-500/30 text-emerald-300 font-mono">
                            NEW
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-300/80 line-clamp-1">
                          Live bilateral Google Translate interpreter
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Centerpiece 1: SPEECH-TO-SPEECH (Full-bleed Live Orb Visualizer) */}
      {/* ---------------------------------------------------------------- */}
      {currentMode === 'speech-to-speech' && (
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 -mt-2">
          <GeminiOrb
            visualState={visualState}
            audioInputLevel={audioInputLevel}
            audioOutputLevel={audioOutputLevel}
            isMuted={isMuted}
          />

          <div className="mt-2 mb-3">
            <p className="text-xs font-medium text-slate-400/90 tracking-wide uppercase font-mono">
              {getStatusLabel()}
            </p>
          </div>

          <LiveTranscriptView
            transcript={transcript}
            characterName={scenario.audioProfile.name}
          />
        </main>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Centerpiece 2: SPEECH-TO-TEXT (Turn-based Voice Message Dialogue)*/}
      {/* ---------------------------------------------------------------- */}
      {currentMode === 'speech-to-text' && (
        <main className="relative z-10 flex-1 flex flex-col items-center max-w-2xl w-full mx-auto px-4 py-3 overflow-hidden">
          {/* Header Status Bar */}
          <div className="w-full flex items-center justify-between pb-2 border-b border-slate-900/80 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300 font-mono">
                Speech-to-Text Mode (Voice Recording)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {language.name} • {scenario.audioProfile.name}
            </span>
          </div>

          {/* Conversation Transcript Message Stream */}
          <div className="flex-1 w-full overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Mic className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Record your voice input</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Press the green microphone button below to record your sentence in {language.name}. {scenario.audioProfile.name} will reply in text with grammar coaching.
                  </p>
                </div>
              </div>
            ) : (
              transcript.map((item) => {
                const isUser = item.speaker === 'user';
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono px-1">
                      <span>{isUser ? 'You (Voice Recording)' : scenario.audioProfile.name}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                        isUser
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs'
                          : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-bl-xs'
                      }`}
                    >
                      <p className="font-medium text-white">{item.text}</p>
                      {item.translation && (
                        <p className="text-[11px] text-slate-300/80 italic mt-1 pt-1 border-t border-white/10">
                          {item.translation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>
        </main>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Centerpiece 3: TEXT-TO-SPEECH & TEXT-TO-TEXT (Chat UI)          */}
      {/* ---------------------------------------------------------------- */}
      {(currentMode === 'text-to-speech' || currentMode === 'text-to-text') && (
        <main className="relative z-10 flex-1 flex flex-col items-center max-w-2xl w-full mx-auto px-4 py-3 overflow-hidden">
          <div className="w-full flex items-center justify-between pb-2 border-b border-slate-900/80 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300 font-mono">
                {currentMode === 'text-to-speech' ? 'Text to Speech (Listening Drill)' : 'Text to Text (Written Roleplay)'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {language.name} • {scenario.audioProfile.name}
            </span>
          </div>

          <div className="flex-1 w-full overflow-y-auto pr-1 space-y-3 scrollbar-thin">
            {transcript.map((item) => {
              const isUser = item.speaker === 'user';
              return (
                <div
                  key={item.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="text-[10px] text-slate-500 font-mono px-1">
                    {isUser ? 'You (Typed)' : scenario.audioProfile.name}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-100 rounded-bl-xs'
                    }`}
                  >
                    <p className="font-medium text-white">{item.text}</p>
                    {item.translation && (
                      <p className="text-[11px] text-slate-300/80 italic mt-1 pt-1 border-t border-white/10">
                        {item.translation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>
        </main>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Bottom Control Dock: Push-to-Talk Recorder & Controls             */}
      {/* ---------------------------------------------------------------- */}
      <footer className="relative z-20 pb-6 pt-2 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 space-y-3">
        {/* Quick Phrase Hint Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          <span className="text-[10px] uppercase font-mono text-slate-500 shrink-0">Hints:</span>
          {scenario.phraseHints.slice(0, 3).map((hint) => (
            <button
              key={hint.id}
              onClick={() => handleInsertPhrase(hint.original)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              title={`${hint.translation} (${hint.phonetic})`}
            >
              <span>{hint.original}</span>
            </button>
          ))}
        </div>

        {/* -------------------------------------------------------------- */}
        {/* SPEECH-TO-TEXT: Dedicated Voice Recording Control Interface     */}
        {/* -------------------------------------------------------------- */}
        {currentMode === 'speech-to-text' ? (
          <div className="w-full space-y-2">
            {isRecordingVoiceClip ? (
              /* Active Recording Panel */
              <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border border-red-500/50 shadow-2xl animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-bold text-red-400 font-mono uppercase">
                      REC {formatSeconds(recordingDurationSeconds)}
                    </span>
                  </div>

                  {/* Audio Level Waveform Indicator */}
                  <div className="flex items-center gap-1 h-5">
                    {[0.2, 0.5, 0.8, 1, 0.6, 0.3].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-red-400 rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(4, Math.min(20, audioInputLevel * 100 * h + 4))}px`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="cancel-voice-recording-btn"
                    onClick={onCancelRecordingVoiceClip}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>

                  <button
                    id="stop-and-send-voice-recording-btn"
                    onClick={onStopAndSendVoiceClip}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Stop & Send</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Idle Voice Record Button */
              <div className="w-full flex items-center gap-2.5">
                <button
                  id="start-voice-recording-btn"
                  onClick={onStartRecordingVoiceClip}
                  disabled={visualState === 'thinking'}
                  className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {visualState === 'thinking'
                      ? 'Transcribing & Analyzing...'
                      : `Record Voice in ${language.name}`}
                  </span>
                </button>

                {/* Keyboard toggle */}
                <button
                  id="toggle-keyboard-in-s2t-btn"
                  onClick={() => setShowKeyboardInput(!showKeyboardInput)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    showKeyboardInput
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                  title="Type text instead"
                >
                  <Keyboard className="w-4 h-4" />
                </button>

                {/* Coaching Drawer */}
                <button
                  id="open-coaching-drawer-s2t-btn"
                  onClick={() => setIsCoachingDrawerOpen(!isCoachingDrawerOpen)}
                  className={`relative p-3 rounded-2xl border transition-all cursor-pointer ${
                    corrections.length > 0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                  title="Open Grammar Coaching Drawer"
                >
                  <BookOpen className="w-4 h-4" />
                  {corrections.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
                      {corrections.length}
                    </span>
                  )}
                </button>

                {/* End Session Button */}
                <button
                  id="end-session-s2t-btn"
                  onClick={onEndSession}
                  className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                  title="End conversation & see performance report"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Text Input Bar (Visible in T2S, T2T or when keyboard is toggled) */}
        {showKeyboardInput && (
          <form
            onSubmit={handleSend}
            className="w-full flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-xl backdrop-blur-md"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={`Type in ${language.name} (${language.nativeName})...`}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md cursor-pointer"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Bottom Floating Voice/Session Dock for S2S, T2S, T2T */}
        {currentMode !== 'speech-to-text' && (
          <div className="flex items-center gap-3 p-2 rounded-full bg-slate-950/90 border border-slate-800/90 shadow-2xl backdrop-blur-lg">
            {/* Mute / Mic Toggle for Live Speech-to-Speech mode */}
            {currentMode === 'speech-to-speech' && (
              <button
                id="toggle-mic-mute-btn"
                onClick={onToggleMute}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isMuted
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Keyboard Toggle Button */}
            <button
              id="toggle-keyboard-input-btn"
              onClick={() => setShowKeyboardInput(!showKeyboardInput)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                showKeyboardInput
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={showKeyboardInput ? 'Hide keyboard input' : 'Open keyboard input'}
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Center Pulse Visualizer */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-sky-500 to-teal-400 p-0.5 shadow-lg shadow-indigo-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    visualState === 'speaking'
                      ? 'bg-indigo-400 scale-150 animate-pulse'
                      : visualState === 'listening'
                      ? 'bg-sky-400 scale-125'
                      : 'bg-slate-500'
                  }`}
                />
              </div>
            </div>

            {/* Open Coaching Drawer Button */}
            <button
              id="open-coaching-drawer-btn"
              onClick={() => setIsCoachingDrawerOpen(!isCoachingDrawerOpen)}
              className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                corrections.length > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Open Silent Grammar Coaching Drawer"
            >
              <BookOpen className="w-4 h-4" />
              {corrections.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
                  {corrections.length}
                </span>
              )}
            </button>

            {/* End Call / Finish Session Button */}
            <button
              id="end-live-session-btn"
              onClick={onEndSession}
              className="w-11 h-11 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all hover:scale-105 cursor-pointer"
              title="End conversation & see performance evaluation report"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        )}
      </footer>

      {/* Sliding Coaching & Key Phrases Drawer */}
      <CoachingDrawer
        corrections={corrections}
        keyPhrasesAchieved={keyPhrasesAchieved}
        targetKeyPhrases={scenario.targetKeyPhrases}
        phraseHints={scenario.phraseHints}
        targetLanguage={language}
        onSendPhraseHint={onSendPhraseHint}
        isOpen={isCoachingDrawerOpen}
        onToggle={() => setIsCoachingDrawerOpen(!isCoachingDrawerOpen)}
      />

      {/* Scenario Details & Director's Notes Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{language.flag}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">{scenario.title}</h3>
                  <p className="text-xs text-slate-400">{scenario.tagline}</p>
                </div>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Character:</span>{' '}
                <span className="text-white font-semibold">{scenario.audioProfile.name}</span>{' '}
                <span className="text-slate-500">({scenario.audioProfile.role})</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Setting:</span>{' '}
                <span className="text-slate-300">{scenario.scene.setting}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Pace & Tone:</span>{' '}
                <span className="text-slate-300">
                  {scenario.directorsNotes.pace} • {scenario.directorsNotes.tone}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Modality:</span>{' '}
                <span className="text-indigo-400 font-semibold capitalize">
                  {currentMode.replace(/-/g, ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Cultural Notes:
              </h4>
              <ul className="text-xs text-slate-400 space-y-1">
                {scenario.culturalTips?.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-400">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setIsInfoModalOpen(false)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Close & Resume Practice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
