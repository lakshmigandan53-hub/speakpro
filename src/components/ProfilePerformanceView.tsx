import React, { useState } from 'react';
import {
  Flame,
  Award,
  BookOpen,
  Volume2,
  TrendingUp,
  Clock,
  ShieldCheck,
  Globe2,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Language, ProficiencyLevel, LanguageProgress, LanguageProgressMap } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/languages';

interface ProfilePerformanceViewProps {
  currentLevel: ProficiencyLevel;
  targetLanguage: Language;
  onSelectLevel: (level: ProficiencyLevel) => void;
  progress?: LanguageProgress;
  allProgress?: LanguageProgressMap;
  onRequestLanguageChange?: (language: Language) => void;
}

export const ProfilePerformanceView: React.FC<ProfilePerformanceViewProps> = ({
  currentLevel,
  targetLanguage,
  progress,
  allProgress = {},
  onRequestLanguageChange,
}) => {
  const [playingPhrase, setPlayingPhrase] = useState<string | null>(null);

  // Active language metrics
  const xp = progress?.xp ?? 0;
  const streak = progress?.streakDays ?? 1;
  const fluencyScore = progress?.fluencyScore ?? 0;
  const speakingTime = progress?.speakingTimeMinutes ?? 0;
  const turns = progress?.conversationalTurns ?? 0;
  const accuracy = progress?.grammarAccuracy ?? 75;
  const phrases = progress?.savedPhrases || [];
  const masteredCount = phrases.filter((p) => p.mastered).length;

  const playTTS = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    setPlayingPhrase(text);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = targetLanguage.code === 'hi' ? 'hi-IN' : targetLanguage.code === 'es' ? 'es-ES' : targetLanguage.code === 'fr' ? 'fr-FR' : targetLanguage.code === 'ja' ? 'ja-JP' : targetLanguage.code === 'de' ? 'de-DE' : targetLanguage.code === 'ta' ? 'ta-IN' : 'en-US';
    u.onend = () => setPlayingPhrase(null);
    u.onerror = () => setPlayingPhrase(null);
    window.speechSynthesis.speak(u);
  };

  // List of practiced languages
  const practicedLanguagesList = Object.keys(allProgress)
    .map((code) => {
      const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === code);
      const prog = allProgress[code];
      return {
        code,
        lang: langObj,
        progress: prog,
      };
    })
    .filter((item) => item.lang !== undefined);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 px-3 sm:px-4">
      {/* User Header Profile Card */}
      <div className="rounded-3xl bg-white border border-[#E2EFEA] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#4FD8B8] via-[#4FA8D8] to-[#B8A8E8] p-0.5 shadow-md shadow-[#4FD8B8]/20">
              <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-2xl font-bold">
                🌟
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[#1E3A3A]">Language Learner</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF5FC] text-[#216E9B] font-mono font-bold border border-[#4FA8D8]/50">
                  Level {currentLevel.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#6B8A87] pt-0.5 flex items-center gap-1.5 font-medium">
                <span>Practicing:</span>
                <span className="text-[#1E3A3A] font-bold flex items-center gap-1">
                  <span>{targetLanguage.flag}</span>
                  <span>{targetLanguage.name}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#FFF4EF] border border-[#FFB89A] text-[#E06640]">
              <Flame className="w-4 h-4 text-[#FF8C66] animate-pulse" />
              <span className="text-xs font-bold font-mono">{streak} Days Streak 🔥</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#E8F8F4] border border-[#4FD8B8]/50 text-[#167D68]">
              <Award className="w-4 h-4 text-[#2BB394]" />
              <span className="text-xs font-bold font-mono">{xp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        {/* 4 Stat Metrics Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#F4FAF8] border border-[#E2EFEA] space-y-1">
            <div className="flex items-center justify-between text-[#6B8A87] text-xs font-semibold">
              <span>Fluency Score</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#167D68]" />
            </div>
            <p className="text-xl font-black text-[#1E3A3A] font-mono">{fluencyScore} / 100</p>
            <span className="text-[10px] text-[#167D68] font-bold font-mono">
              {fluencyScore > 0 ? '+12% active mastery' : 'Beginner baseline'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4FAF8] border border-[#E2EFEA] space-y-1">
            <div className="flex items-center justify-between text-[#6B8A87] text-xs font-semibold">
              <span>Speaking Time</span>
              <Clock className="w-3.5 h-3.5 text-[#216E9B]" />
            </div>
            <p className="text-xl font-black text-[#1E3A3A] font-mono">{speakingTime} mins</p>
            <span className="text-[10px] text-[#216E9B] font-bold font-mono">{turns} conversational turns</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4FAF8] border border-[#E2EFEA] space-y-1">
            <div className="flex items-center justify-between text-[#6B8A87] text-xs font-semibold">
              <span>Phrases Mastered</span>
              <BookOpen className="w-3.5 h-3.5 text-[#6951BA]" />
            </div>
            <p className="text-xl font-black text-[#1E3A3A] font-mono">{masteredCount} / {phrases.length}</p>
            <span className="text-[10px] text-[#6951BA] font-bold font-mono">
              {phrases.length > 0 ? `${Math.round((masteredCount / phrases.length) * 100)}% retention` : 'Ready to drill'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F4FAF8] border border-[#E2EFEA] space-y-1">
            <div className="flex items-center justify-between text-[#6B8A87] text-xs font-semibold">
              <span>Grammar Accuracy</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#167D68]" />
            </div>
            <p className="text-xl font-black text-[#1E3A3A] font-mono">{accuracy}%</p>
            <span className="text-[10px] text-[#167D68] font-bold font-mono">Real-time coaching</span>
          </div>
        </div>
      </div>

      {/* Multilingual Portfolio & Saved Language Progress Breakdown */}
      {practicedLanguagesList.length > 0 && (
        <div className="rounded-3xl bg-white border border-[#E2EFEA] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-[#4FA8D8]" />
              <h3 className="text-base sm:text-lg font-bold text-[#1E3A3A]">
                Language Learning Portfolio
              </h3>
            </div>
            <span className="text-xs text-[#6B8A87] font-semibold">Independent progression saved</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {practicedLanguagesList.map(({ code, lang, progress: p }) => {
              const isActive = code === targetLanguage.code;
              return (
                <div
                  key={code}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isActive
                      ? 'bg-[#E8F8F4]/50 border-[#4FD8B8] shadow-xs'
                      : 'bg-[#F4FAF8] border-[#E2EFEA] hover:border-[#4FA8D8]/60 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{lang?.flag}</span>
                      <div>
                        <h4 className="text-sm font-bold text-[#1E3A3A]">{lang?.name}</h4>
                        <p className="text-[11px] text-[#6B8A87]">{lang?.nativeName}</p>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#4FD8B8]/20 text-[#167D68] text-[11px] font-bold border border-[#4FD8B8]/50 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <button
                        onClick={() => lang && onRequestLanguageChange?.(lang)}
                        className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#EAF5FC] text-[#216E9B] text-xs font-bold border border-[#4FA8D8]/40 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Resume</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E2EFEA]/80 text-center">
                    <div>
                      <span className="text-[10px] text-[#6B8A87] block">Level</span>
                      <span className="text-xs font-bold text-[#1E3A3A] uppercase font-mono">{p.level}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B8A87] block">XP</span>
                      <span className="text-xs font-bold text-[#167D68] font-mono">{p.xp}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B8A87] block">Fluency</span>
                      <span className="text-xs font-bold text-[#216E9B] font-mono">{p.fluencyScore}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vocabulary Vault & Saved Phrases for Active Language */}
      <div className="rounded-3xl bg-white border border-[#E2EFEA] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#216E9B]" />
            <h3 className="text-base sm:text-lg font-bold text-[#1E3A3A]">
              {targetLanguage.name} Vocabulary Vault & Active Drill
            </h3>
          </div>
          <span className="text-xs text-[#6B8A87] font-semibold">Tap speaker to drill native audio</span>
        </div>

        <div className="space-y-2.5">
          {phrases.map((phrase, idx) => (
            <div
              key={phrase.id || idx}
              className="p-3.5 rounded-2xl bg-[#F4FAF8] border border-[#E2EFEA] flex items-center justify-between gap-3 hover:bg-white hover:border-[#4FA8D8]/50 transition-all shadow-2xs"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-bold text-[#1E3A3A] truncate">{phrase.original}</p>
                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-white text-[#6B8A87] border border-[#E2EFEA] font-bold">
                    {phrase.category}
                  </span>
                  {phrase.mastered && (
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-[#E8F8F4] text-[#167D68] border border-[#4FD8B8]/40 font-bold">
                      Mastered
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#216E9B] font-mono italic">{phrase.phonetic}</p>
                <p className="text-xs text-[#6B8A87]">{phrase.translation}</p>
              </div>

              <button
                onClick={() => playTTS(phrase.original)}
                className="w-9 h-9 rounded-xl bg-white hover:bg-[#EAF5FC] border border-[#4FA8D8]/40 text-[#216E9B] flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-xs"
              >
                <Volume2 className={`w-4 h-4 ${playingPhrase === phrase.original ? 'animate-bounce text-[#4FA8D8]' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

