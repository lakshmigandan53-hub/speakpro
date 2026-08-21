import React from 'react';
import {
  Compass,
  CheckCircle2,
  Lock,
  Star,
  Zap,
  Award,
  ChevronRight,
  Flame,
  BookOpen,
  Sparkles,
  ArrowRight,
  Target,
} from 'lucide-react';
import { Language, ProficiencyLevel, Scenario } from '../types';

interface LevelsViewProps {
  currentLevel: ProficiencyLevel;
  onSelectLevel: (level: ProficiencyLevel) => void;
  onStartScenario: (scenario: Scenario) => void;
  scenarios: Scenario[];
  targetLanguage: Language;
}

interface LevelStage {
  id: string;
  level: ProficiencyLevel;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  unlocked: boolean;
  progressPercent: number;
  totalStars: number;
  milestones: {
    title: string;
    scenarioId: string;
    completed: boolean;
    xp: number;
  }[];
}

export const LevelsView: React.FC<LevelsViewProps> = ({
  currentLevel,
  onSelectLevel,
  onStartScenario,
  scenarios,
  targetLanguage,
}) => {
  const STAGES: LevelStage[] = [
    {
      id: 'stage-beginner',
      level: 'beginner',
      code: 'A1 - A2',
      title: 'Basic / Beginner Path',
      subtitle: 'Foundations of Survival & Social Connections',
      description: 'Master first impressions, ordering food, basic daily greetings, and navigating simple polite transactions.',
      accent: 'from-emerald-500 to-teal-600',
      unlocked: true,
      progressPercent: currentLevel === 'beginner' ? 65 : 100,
      totalStars: 12,
      milestones: [
        { title: 'Meeting Someone & Introductions', scenarioId: 'greeting-intro', completed: true, xp: 150 },
        { title: 'Ordering at a Café / Bakery', scenarioId: 'cafe-restaurant', completed: true, xp: 200 },
        { title: 'Neighborhood Pleasantries & Small Talk', scenarioId: 'neighborhood-smalltalk', completed: false, xp: 180 },
        { title: 'Hotel Check-In & Room Inquiries', scenarioId: 'hotel-checkin', completed: false, xp: 220 },
      ],
    },
    {
      id: 'stage-intermediate',
      level: 'intermediate',
      code: 'B1 - B2',
      title: 'Intermediate Conversationalist',
      subtitle: 'Real-World Autonomy & Travel Fluency',
      description: 'Negotiate fares, ask detailed street directions, handle airport customs & luggage, and bargain at local open-air markets.',
      accent: 'from-sky-500 to-blue-600',
      unlocked: currentLevel === 'intermediate' || currentLevel === 'advanced',
      progressPercent: currentLevel === 'advanced' ? 100 : currentLevel === 'intermediate' ? 40 : 0,
      totalStars: 9,
      milestones: [
        { title: 'Asking Street Directions & Landmarks', scenarioId: 'asking-directions', completed: currentLevel !== 'beginner', xp: 250 },
        { title: 'Auto-Rickshaw & Taxi Driver Bargaining', scenarioId: 'taxi-rickshaw', completed: currentLevel === 'advanced', xp: 280 },
        { title: 'Airport Security, Customs & Baggage', scenarioId: 'airport-travel', completed: false, xp: 300 },
        { title: 'Haggling at an Artisan Bazaar', scenarioId: 'market-haggling', completed: false, xp: 320 },
      ],
    },
    {
      id: 'stage-advanced',
      level: 'advanced',
      code: 'C1 - C2',
      title: 'Advanced Fluency & Mastery',
      subtitle: 'Nuanced Professional & Complex Situations',
      description: 'Express nuanced thoughts, participate in corporate interviews, explain medical symptoms at the pharmacy, and engage in high-speed native banter.',
      accent: 'from-purple-500 to-fuchsia-600',
      unlocked: currentLevel === 'advanced',
      progressPercent: currentLevel === 'advanced' ? 25 : 0,
      totalStars: 3,
      milestones: [
        { title: 'Pharmacy & Explaining Health Symptoms', scenarioId: 'medical-pharmacy', completed: false, xp: 400 },
        { title: 'Executive Job Interview & Career Q&A', scenarioId: 'job-interview', completed: false, xp: 450 },
        { title: 'Complex Debate & Cultural Nuances', scenarioId: 'greeting-intro', completed: false, xp: 500 },
      ],
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 px-3 sm:px-4">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{targetLanguage.flag}</span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {targetLanguage.name} Learning Roadmap
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 pt-1">
              Progressive mastery path from Basic Survival (A1) to Native-level Professional Autonomy (C2).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-mono">Current Level:</span>
            <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-bold text-xs capitalize shadow-md shadow-indigo-600/30">
              {currentLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Levels Tree Stages */}
      <div className="space-y-5">
        {STAGES.map((stage, idx) => {
          const isCurrentActive = stage.level === currentLevel;

          return (
            <div
              key={stage.id}
              className={`rounded-3xl border transition-all overflow-hidden ${
                isCurrentActive
                  ? 'bg-slate-900 border-indigo-500/50 shadow-2xl ring-1 ring-indigo-500/30'
                  : stage.unlocked
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-80'
              }`}
            >
              {/* Stage Top Bar */}
              <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stage.accent} flex items-center justify-center text-white font-black text-sm font-mono shadow-lg shrink-0`}
                  >
                    {stage.code}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {stage.title}
                      </h3>
                      {isCurrentActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                          ACTIVE STAGE
                        </span>
                      )}
                      {!stage.unlocked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{stage.subtitle}</p>
                    <p className="text-xs text-slate-400 max-w-xl">{stage.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={() => onSelectLevel(stage.level)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrentActive
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isCurrentActive ? 'Current Level' : `Switch to ${stage.level}`}
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-300">Stage Progress</span>
                  <div className="w-28 sm:w-44 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${stage.accent} transition-all duration-500`}
                      style={{ width: `${stage.progressPercent}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">{stage.progressPercent}%</span>
                </div>

                <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{stage.totalStars} Stars Earned</span>
                </div>
              </div>

              {/* Milestones & Scenarios List */}
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stage.milestones.map((milestone, mIdx) => {
                  const targetScenario = scenarios.find((s) => s.id === milestone.scenarioId) || scenarios[0];

                  return (
                    <div
                      key={mIdx}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        milestone.completed
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            milestone.completed
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {milestone.completed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Target className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{milestone.title}</p>
                          <span className="text-[10px] font-mono text-indigo-300">
                            +{milestone.xp} XP • {targetScenario.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onStartScenario(targetScenario)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                      >
                        <span>Practice</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
