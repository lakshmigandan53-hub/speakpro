import React, { useState } from 'react';
import {
  SilentCorrection,
  KeyPhraseAchievement,
  PhraseHint,
  Language,
} from '../types';
import {
  ChevronUp,
  ChevronDown,
  Sparkles,
  Volume2,
  CheckCircle2,
  BookOpen,
  MessageSquare,
  AlertCircle,
  X,
} from 'lucide-react';

interface CoachingDrawerProps {
  corrections: SilentCorrection[];
  keyPhrasesAchieved: KeyPhraseAchievement[];
  targetKeyPhrases: string[];
  phraseHints: PhraseHint[];
  targetLanguage: Language;
  onSendPhraseHint: (text: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const CoachingDrawer: React.FC<CoachingDrawerProps> = ({
  corrections,
  keyPhrasesAchieved,
  targetKeyPhrases,
  phraseHints,
  targetLanguage,
  onSendPhraseHint,
  isOpen,
  onToggle,
}) => {
  const [activeTab, setActiveTab] = useState<'corrections' | 'phrases' | 'hints'>('corrections');
  const [playingTtsId, setPlayingTtsId] = useState<string | null>(null);

  // Play audio pronunciation for a correction or phrase hint
  const handlePlayAudio = async (text: string, id: string) => {
    if (playingTtsId) return;
    setPlayingTtsId(id);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: targetLanguage.defaultVoice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
          // Play PCM audio
          const binary = window.atob(data.audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const int16 = new Int16Array(bytes.buffer);
          const float32 = new Float32Array(int16.length);
          for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / (int16[i] < 0 ? 32768 : 32767);
          }

          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx({ sampleRate: 24000 });
          const buffer = ctx.createBuffer(1, float32.length, 24000);
          buffer.getChannelData(0).set(float32);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start();
          source.onended = () => {
            setPlayingTtsId(null);
            ctx.close();
          };
          return;
        }
      }
    } catch (e) {
      console.warn('TTS playback error:', e);
    }
    setPlayingTtsId(null);
  };

  const achievedPhraseSet = new Set(
    keyPhrasesAchieved.map((k) => k.phrase.toLowerCase().trim())
  );

  return (
    <>
      {/* Collapsed Bottom Pill Trigger */}
      {!isOpen && (
        <button
          id="coaching-drawer-trigger-btn"
          onClick={onToggle}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 group"
        >
          <Sparkles className="w-4 h-4 text-sky-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-medium tracking-wide">
            Coaching & Phrases
          </span>
          {corrections.length > 0 && (
            <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-indigo-500 text-white rounded-full">
              {corrections.length}
            </span>
          )}
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      )}

      {/* Expanded Sliding Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          {/* Backdrop click area */}
          <div className="flex-1" onClick={onToggle} />

          <div className="w-full max-w-2xl mx-auto bg-slate-900 border-t border-slate-700/80 rounded-t-3xl shadow-2xl flex flex-col max-h-[75vh] overflow-hidden">
            {/* Drawer Header & Tabs */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Live Assistant Coaching
                  </h3>
                  <p className="text-xs text-slate-400">
                    Silent feedback without interrupting spoken dialogue
                  </p>
                </div>
              </div>

              <button
                id="close-coaching-drawer-btn"
                onClick={onToggle}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex px-4 pt-2 border-b border-slate-800 gap-2">
              <button
                id="tab-silent-corrections-btn"
                onClick={() => setActiveTab('corrections')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'corrections'
                    ? 'border-indigo-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Corrections</span>
                {corrections.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {corrections.length}
                  </span>
                )}
              </button>

              <button
                id="tab-key-phrases-btn"
                onClick={() => setActiveTab('phrases')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'phrases'
                    ? 'border-indigo-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Target Phrases</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {keyPhrasesAchieved.length}/{targetKeyPhrases.length}
                </span>
              </button>

              <button
                id="tab-phrase-hints-btn"
                onClick={() => setActiveTab('hints')}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'hints'
                    ? 'border-indigo-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cheat Sheet</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {phraseHints.length}
                </span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* TAB 1: SILENT CORRECTIONS */}
              {activeTab === 'corrections' && (
                <div>
                  {corrections.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-300">
                        No errors detected yet!
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Speak naturally. If you make a slip, the AI will silently log the refinement here without stopping the call.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {corrections.map((corr) => (
                        <div
                          key={corr.id}
                          className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{corr.issue}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 line-through">
                                &ldquo;{corr.userSaid}&rdquo;
                              </p>
                            </div>
                            <button
                              onClick={() => handlePlayAudio(corr.correction, corr.id)}
                              disabled={playingTtsId === corr.id}
                              className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sky-300 transition-colors"
                              title="Listen to native pronunciation"
                            >
                              <Volume2 className={`w-4 h-4 ${playingTtsId === corr.id ? 'animate-pulse text-sky-200' : ''}`} />
                            </button>
                          </div>

                          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                            <p className="text-xs font-semibold text-emerald-300">
                              Natural Alternative:
                            </p>
                            <p className="text-sm font-medium text-white mt-0.5">
                              {corr.correction}
                            </p>
                          </div>

                          {corr.tip && (
                            <p className="text-xs text-slate-400 bg-slate-800/40 p-2 rounded-lg">
                              💡 <span className="text-slate-300">{corr.tip}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TARGET KEY PHRASES */}
              {activeTab === 'phrases' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 mb-2">
                    Try incorporating these key situational phrases during your conversation:
                  </p>
                  {targetKeyPhrases.map((phrase, idx) => {
                    const isDone = achievedPhraseSet.has(phrase.toLowerCase().trim());
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isDone
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2
                            className={`w-5 h-5 shrink-0 ${
                              isDone ? 'text-emerald-400' : 'text-slate-600'
                            }`}
                          />
                          <span className={`text-sm font-medium ${isDone ? 'text-white font-semibold' : ''}`}>
                            {phrase}
                          </span>
                        </div>
                        {isDone && (
                          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                            Achieved
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: CHEAT SHEET */}
              {activeTab === 'hints' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-400 mb-2">
                    Quick situational phrases you can speak or send into the conversation:
                  </p>
                  {phraseHints.map((hint) => (
                    <div
                      key={hint.id}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 space-y-1.5 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">
                          {hint.original}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handlePlayAudio(hint.original, hint.id)}
                            disabled={playingTtsId === hint.id}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sky-300 transition-colors"
                            title="Hear pronunciation"
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${playingTtsId === hint.id ? 'animate-pulse text-sky-200' : ''}`} />
                          </button>
                          <button
                            onClick={() => {
                              onSendPhraseHint(hint.original);
                              onToggle();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                          >
                            Say This
                          </button>
                        </div>
                      </div>

                      {hint.phonetic && (
                        <p className="text-xs text-sky-400 font-mono">
                          [{hint.phonetic}]
                        </p>
                      )}

                      <p className="text-xs text-slate-300">
                        {hint.translation}
                      </p>

                      {hint.contextUsage && (
                        <p className="text-[11px] text-slate-400 italic">
                          Usage: {hint.contextUsage}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
