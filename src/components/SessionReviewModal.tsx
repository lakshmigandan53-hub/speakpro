import React, { useState } from 'react';
import {
  Language,
  Scenario,
  SessionEvaluation,
  SilentCorrection,
} from '../types';
import {
  Trophy,
  Sparkles,
  RotateCcw,
  Compass,
  CheckCircle2,
  AlertCircle,
  Volume2,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';

interface SessionReviewModalProps {
  evaluation: SessionEvaluation;
  scenario: Scenario;
  language: Language;
  corrections: SilentCorrection[];
  onRestart: () => void;
  onExit: () => void;
}

export const SessionReviewModal: React.FC<SessionReviewModalProps> = ({
  evaluation,
  scenario,
  language,
  corrections,
  onRestart,
  onExit,
}) => {
  const [playingPhrase, setPlayingPhrase] = useState<string | null>(null);

  const handlePlayAudio = async (text: string) => {
    if (playingPhrase) return;
    setPlayingPhrase(text);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: language.defaultVoice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio) {
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
            setPlayingPhrase(null);
            ctx.close();
          };
          return;
        }
      }
    } catch (e) {
      console.warn('TTS playback failed:', e);
    }
    setPlayingPhrase(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">{language.flag}</span>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Session Performance Report
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                {scenario.title} • {formatTime(evaluation.totalDurationSeconds)} ({evaluation.turnsCount} turns)
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {evaluation.overallScore}
              <span className="text-xs text-slate-400 font-normal">/100</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
              Overall Mastery
            </span>
          </div>
        </div>

        {/* 4 Score Metrics Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
            <span className="text-xs text-slate-400">Fluency</span>
            <div className="text-lg font-bold text-sky-400">{evaluation.fluencyScore}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full"
                style={{ width: `${evaluation.fluencyScore}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
            <span className="text-xs text-slate-400">Vocabulary</span>
            <div className="text-lg font-bold text-indigo-400">{evaluation.vocabularyScore}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-400 h-full rounded-full"
                style={{ width: `${evaluation.vocabularyScore}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
            <span className="text-xs text-slate-400">Grammar</span>
            <div className="text-lg font-bold text-emerald-400">{evaluation.grammarScore}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full"
                style={{ width: `${evaluation.grammarScore}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl text-center space-y-1">
            <span className="text-xs text-slate-400">Goal Success</span>
            <div className="text-lg font-bold text-amber-400">{evaluation.scenarioSuccessRate}%</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: `${evaluation.scenarioSuccessRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Motivational Coach Feedback */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Coach Takeaway
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
              {evaluation.motivationalMessage}
            </p>
          </div>
        </div>

        {/* Strengths & Improvement Areas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Key Strengths</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {evaluation.keyStrengths?.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <TrendingUp className="w-4 h-4" />
              <span>Areas for Growth</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {evaluation.areasForImprovement?.map((a, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Review Phrases with Native Pronunciation Audio */}
        {evaluation.reviewPhrases && evaluation.reviewPhrases.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Recommended Phrases to Practice</span>
            </h4>
            <div className="space-y-2">
              {evaluation.reviewPhrases.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-slate-400 line-through">
                      &ldquo;{item.phrase}&rdquo;
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {item.betterAlternative}
                    </p>
                    <p className="text-[11px] text-slate-400 italic">
                      {item.reason}
                    </p>
                  </div>
                  <button
                    id={`review-phrase-audio-btn-${idx}`}
                    onClick={() => handlePlayAudio(item.betterAlternative)}
                    disabled={playingPhrase === item.betterAlternative}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors shrink-0"
                    title="Listen to native audio"
                  >
                    <Volume2
                      className={`w-4 h-4 ${
                        playingPhrase === item.betterAlternative
                          ? 'animate-pulse text-sky-200'
                          : ''
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            id="choose-another-scenario-btn"
            onClick={onExit}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Choose Another Scenario</span>
          </button>

          <button
            id="practice-again-btn"
            onClick={onRestart}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Scenario Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
