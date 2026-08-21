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
import { Language, ProficiencyLevel, Scenario, LanguageProgress } from '../types';

interface LevelsViewProps {
  currentLevel: ProficiencyLevel;
  onSelectLevel: (level: ProficiencyLevel) => void;
  onStartScenario: (scenario: Scenario) => void;
  scenarios: Scenario[];
  targetLanguage: Language;
  progress?: LanguageProgress;
}

interface LevelStage {
  id: string;
  level: ProficiencyLevel;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  badgeClass: string;
  borderClass: string;
  progressColor: string;
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
  progress,
}) => {
  const completedIds = progress?.completedMilestoneIds || [];

  const beginnerMilestones = [
    { title: 'Meeting Someone & Introductions', scenarioId: 'greeting-intro', completed: completedIds.includes('greeting-intro'), xp: 150 },
    { title: 'Ordering at a Café / Bakery', scenarioId: 'cafe-restaurant', completed: completedIds.includes('cafe-restaurant'), xp: 200 },
    { title: 'Neighborhood Pleasantries & Small Talk', scenarioId: 'neighborhood-smalltalk', completed: completedIds.includes('neighborhood-smalltalk'), xp: 180 },
    { title: 'Hotel Check-In & Room Inquiries', scenarioId: 'hotel-checkin', completed: completedIds.includes('hotel-checkin'), xp: 220 },
  ];

  const intermediateMilestones = [
    { title: 'Asking Street Directions & Landmarks', scenarioId: 'asking-directions', completed: completedIds.includes('asking-directions'), xp: 250 },
    { title: 'Auto-Rickshaw & Taxi Driver Bargaining', scenarioId: 'taxi-rickshaw', completed: completedIds.includes('taxi-rickshaw'), xp: 280 },
    { title: 'Airport Security, Customs & Baggage', scenarioId: 'airport-travel', completed: completedIds.includes('airport-travel'), xp: 300 },
    { title: 'Haggling at an Artisan Bazaar', scenarioId: 'market-haggling', completed: completedIds.includes('market-haggling'), xp: 320 },
  ];

  const advancedMilestones = [
    { title: 'Pharmacy & Explaining Health Symptoms', scenarioId: 'medical-pharmacy', completed: completedIds.includes('medical-pharmacy'), xp: 400 },
    { title: 'Executive Job Interview & Career Q&A', scenarioId: 'job-interview', completed: completedIds.includes('job-interview'), xp: 450 },
    { title: 'Complex Debate & Cultural Nuances', scenarioId: 'greeting-intro', completed: completedIds.includes('cultural-debate'), xp: 500 },
  ];

  // Calculate percentage dynamically from completed milestones or saved progress
  const begCompletedCount = beginnerMilestones.filter((m) => m.completed).length;
  const begPercent = progress?.stageProgress?.beginner ?? Math.round((begCompletedCount / beginnerMilestones.length) * 100);

  const intCompletedCount = intermediateMilestones.filter((m) => m.completed).length;
  const intPercent = currentLevel === 'beginner' ? 0 : (progress?.stageProgress?.intermediate ?? Math.round((intCompletedCount / intermediateMilestones.length) * 100));

  const advCompletedCount = advancedMilestones.filter((m) => m.completed).length;
  const advPercent = currentLevel !== 'advanced' ? 0 : (progress?.stageProgress?.advanced ?? Math.round((advCompletedCount / advancedMilestones.length) * 100));

  const isIntermediateUnlocked = currentLevel === 'intermediate' || currentLevel === 'advanced' || begPercent >= 80;
  const isAdvancedUnlocked = currentLevel === 'advanced' || (isIntermediateUnlocked && intPercent >= 80);

  const STAGES: LevelStage[] = [
    {
      id: 'stage-beginner',
      level: 'beginner',
      code: 'A1 - A2',
      title: 'Basic / Beginner Path',
      subtitle: 'Foundations of Survival & Social Connections',
      description: 'Master first impressions, ordering food, basic daily greetings, and navigating simple polite transactions.',
      accent: 'from-[#4FD8B8] to-[#3EC9A8]',
      badgeClass: 'bg-[#E8F8F4] text-[#167D68] border-[#4FD8B8]/60',
      borderClass: 'border-[#4FD8B8]/50 shadow-[0_10px_35px_rgba(79,216,184,0.12)]',
      progressColor: 'bg-[#4FD8B8]',
      unlocked: true,
      progressPercent: begPercent,
      totalStars: Math.max(0, begCompletedCount * 3),
      milestones: beginnerMilestones,
    },
    {
      id: 'stage-intermediate',
      level: 'intermediate',
      code: 'B1 - B2',
      title: 'Intermediate Conversationalist',
      subtitle: 'Real-World Autonomy & Travel Fluency',
      description: 'Negotiate fares, ask detailed street directions, handle airport customs & luggage, and bargain at local open-air markets.',
      accent: 'from-[#4FA8D8] to-[#3A94C7]',
      badgeClass: 'bg-[#EAF5FC] text-[#216E9B] border-[#4FA8D8]/60',
      borderClass: 'border-[#4FA8D8]/50 shadow-[0_10px_35px_rgba(79,168,216,0.12)]',
      progressColor: 'bg-[#4FA8D8]',
      unlocked: isIntermediateUnlocked,
      progressPercent: isIntermediateUnlocked ? intPercent : 0,
      totalStars: isIntermediateUnlocked ? Math.max(0, intCompletedCount * 3) : 0,
      milestones: intermediateMilestones,
    },
    {
      id: 'stage-advanced',
      level: 'advanced',
      code: 'C1 - C2',
      title: 'Advanced Fluency & Mastery',
      subtitle: 'Nuanced Professional & Complex Situations',
      description: 'Express nuanced thoughts, participate in corporate interviews, explain medical symptoms at the pharmacy, and engage in high-speed native banter.',
      accent: 'from-[#B8A8E8] to-[#9885D6]',
      badgeClass: 'bg-[#F3EFFF] text-[#6951BA] border-[#B8A8E8]/60',
      borderClass: 'border-[#B8A8E8]/60 shadow-[0_10px_35px_rgba(184,168,232,0.15)]',
      progressColor: 'bg-[#B8A8E8]',
      unlocked: isAdvancedUnlocked,
      progressPercent: isAdvancedUnlocked ? advPercent : 0,
      totalStars: isAdvancedUnlocked ? Math.max(0, advCompletedCount * 3) : 0,
      milestones: advancedMilestones,
    },
  ];


  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 px-3 sm:px-4">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-[#E2EFEA] p-5 sm:p-6 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{targetLanguage.flag}</span>
              <h2 className="text-xl sm:text-2xl font-black text-[#1E3A3A] tracking-tight">
                {targetLanguage.name} Learning Roadmap
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#6B8A87] pt-1">
              Progressive mastery path from Basic Survival (A1) to Native-level Professional Autonomy (C2).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#6B8A87] font-semibold">Active Level:</span>
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#4FD8B8] to-[#4FA8D8] text-[#0A302A] font-bold text-xs capitalize shadow-xs">
              {currentLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Levels Tree Stages */}
      <div className="space-y-5">
        {STAGES.map((stage) => {
          const isCurrentActive = stage.level === currentLevel;

          return (
            <div
              key={stage.id}
              className={`rounded-3xl bg-white border-2 ${stage.borderClass} p-5 sm:p-6 transition-all ${
                !stage.unlocked ? 'opacity-70' : ''
              }`}
            >
              {/* Top info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2EFEA]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stage.accent} flex items-center justify-center text-white font-black text-sm shadow-sm`}
                  >
                    {stage.unlocked ? (
                      stage.progressPercent === 100 ? (
                        <CheckCircle2 className="w-6 h-6 text-[#0A302A]" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-[#0A302A]" />
                      )
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-[#1E3A3A]">{stage.title}</h3>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${stage.badgeClass}`}>
                        {stage.code}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B8A87] font-medium">{stage.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500 font-mono text-xs font-bold bg-[#FFF9EB] px-2.5 py-1 rounded-xl border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{stage.totalStars} Stars</span>
                  </div>

                  {!isCurrentActive && stage.unlocked && (
                    <button
                      onClick={() => onSelectLevel(stage.level)}
                      className="text-xs font-bold px-3 py-1 rounded-xl bg-[#F4FAF8] hover:bg-[#E2EFEA] text-[#1E3A3A] border border-[#E2EFEA] transition-colors cursor-pointer"
                    >
                      Switch Level
                    </button>
                  )}
                  {isCurrentActive && (
                    <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-[#E8F8F4] text-[#167D68] border border-[#4FD8B8]/40">
                      Current Target
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="pt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B8A87] font-medium">Stage Completion</span>
                  <span className="font-mono font-bold text-[#1E3A3A]">{stage.progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#F4FAF8] border border-[#E2EFEA] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.progressColor} rounded-full transition-all duration-500`}
                    style={{ width: `${stage.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Milestones List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4">
                {stage.milestones.map((m, idx) => {
                  const matchingScenario = scenarios.find((s) => s.id === m.scenarioId);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (matchingScenario && stage.unlocked) {
                          onStartScenario(matchingScenario);
                        }
                      }}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                        stage.unlocked
                          ? 'bg-[#F4FAF8] hover:bg-white hover:border-[#4FA8D8]/60 cursor-pointer shadow-2xs hover:shadow-xs'
                          : 'bg-[#F4FAF8]/60 border-[#E2EFEA] text-[#6B8A87] cursor-not-allowed'
                      } ${m.completed ? 'border-[#4FD8B8]/40 bg-[#E8F8F4]/30' : 'border-[#E2EFEA]'}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {m.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#167D68] shrink-0" />
                        ) : stage.unlocked ? (
                          <div className="w-4 h-4 rounded-full border-2 border-[#D5ECE3] shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-[#6B8A87] shrink-0" />
                        )}
                        <span className="text-xs font-bold text-[#1E3A3A] truncate">{m.title}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono font-bold text-[#216E9B]">+{m.xp} XP</span>
                        {stage.unlocked && <ChevronRight className="w-3.5 h-3.5 text-[#6B8A87]" />}
                      </div>
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
