import React, { useState } from 'react';
import {
  Flame,
  Award,
  Zap,
  BookOpen,
  Volume2,
  TrendingUp,
  Clock,
  CheckCircle2,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Target,
  Globe2,
} from 'lucide-react';
import { Language, ProficiencyLevel } from '../types';

interface ProfilePerformanceViewProps {
  currentLevel: ProficiencyLevel;
  targetLanguage: Language;
  onSelectLevel: (level: ProficiencyLevel) => void;
}

const SAVED_PHRASES = [
  {
    original: '¿Podría hablar un poco más despacio, por favor?',
    phonetic: 'poh-DREE-ah ah-BLAHR oon POH-koh mahs des-PAH-syoh',
    translation: 'Could you please speak a little slower?',
    category: 'Essential',
    mastered: true,
  },
  {
    original: 'Una mesa para dos cerca de la ventana',
    phonetic: 'OO-nah MEH-sah PAH-rah dohs SEHR-kah deh lah ven-TAH-nah',
    translation: 'A table for two near the window',
    category: 'Dining',
    mastered: true,
  },
  {
    original: '¿Cuánto cuesta este artículo artesanal?',
    phonetic: 'KWAHN-toh KWEHS-tah EHS-teh ahr-teh-sah-NAHL',
    translation: 'How much does this handmade item cost?',
    category: 'Shopping',
    mastered: false,
  },
  {
    original: 'Tengo experiencia liderando proyectos de tecnología',
    phonetic: 'TEN-goh eks-peh-RYEN-syah lee-deh-RAHN-doh proh-YEK-tohs',
    translation: 'I have experience leading engineering projects',
    category: 'Career',
    mastered: false,
  },
];

export const ProfilePerformanceView: React.FC<ProfilePerformanceViewProps> = ({
  currentLevel,
  targetLanguage,
  onSelectLevel,
}) => {
  const [playingPhrase, setPlayingPhrase] = useState<string | null>(null);

  const playTTS = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    setPlayingPhrase(text);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = targetLanguage.code === 'hi' ? 'hi-IN' : targetLanguage.code === 'es' ? 'es-ES' : 'en-US';
    u.onend = () => setPlayingPhrase(null);
    u.onerror = () => setPlayingPhrase(null);
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 px-3 sm:px-4">
      {/* User Header Profile Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-xl font-bold text-white">
                👤
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Language Learner</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
                  Level {currentLevel.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 pt-0.5 flex items-center gap-1.5">
                <span>Practicing:</span>
                <span className="text-slate-200 font-semibold flex items-center gap-1">
                  <span>{targetLanguage.flag}</span>
                  <span>{targetLanguage.name}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold font-mono">7 Days Streak 🔥</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold font-mono">1,450 XP</span>
            </div>
          </div>
        </div>

        {/* 4 Stat Metrics Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Fluency Score</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-xl font-black text-white font-mono">88 / 100</p>
            <span className="text-[10px] text-emerald-400 font-mono">+12% this week</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Speaking Time</span>
              <Clock className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <p className="text-xl font-black text-white font-mono">42 mins</p>
            <span className="text-[10px] text-sky-400 font-mono">34 conversational turns</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Phrases Mastered</span>
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-xl font-black text-white font-mono">24 phrases</p>
            <span className="text-[10px] text-indigo-400 font-mono">92% retention</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Grammar Accuracy</span>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <p className="text-xl font-black text-white font-mono">85%</p>
            <span className="text-[10px] text-purple-400 font-mono">Low hesitation rate</span>
          </div>
        </div>
      </div>

      {/* Vocabulary Vault & Saved Phrases */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Vocabulary Vault & Active Drill
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Tap speaker to drill audio</span>
        </div>

        <div className="space-y-2.5">
          {SAVED_PHRASES.map((phrase, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{phrase.original}</p>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                    {phrase.category}
                  </span>
                </div>
                <p className="text-xs text-indigo-300/80 font-mono italic">{phrase.phonetic}</p>
                <p className="text-xs text-slate-400">{phrase.translation}</p>
              </div>

              <button
                onClick={() => playTTS(phrase.original)}
                className="w-9 h-9 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              >
                <Volume2 className={`w-4 h-4 ${playingPhrase === phrase.original ? 'animate-bounce' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
