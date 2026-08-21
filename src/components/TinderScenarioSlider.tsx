import React, { useState, useMemo } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import {
  Handshake,
  Plane,
  Car,
  UtensilsCrossed,
  Compass,
  Store,
  Briefcase,
  ShoppingBag,
  Hotel,
  Cross,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  Volume2,
  MapPin,
  User,
  Zap,
  Flame,
  Award,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { ProficiencyLevel, Scenario } from '../types';

interface TinderScenarioSliderProps {
  scenarios: Scenario[];
  currentLevel: ProficiencyLevel;
  onStartScenario: (scenario: Scenario) => void;
  onOpenCustomScenarioModal?: () => void;
}

// Icon mapping helper
const SCENARIO_ICONS: Record<string, React.ElementType> = {
  Handshake,
  Plane,
  Car,
  UtensilsCrossed,
  Compass,
  Store,
  Briefcase,
  ShoppingBag,
  Hotel,
  Cross,
  Sparkles,
};

// Level priority score for sorting
const LEVEL_WEIGHT: Record<ProficiencyLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export const TinderScenarioSlider: React.FC<TinderScenarioSliderProps> = ({
  scenarios,
  currentLevel,
  onStartScenario,
  onOpenCustomScenarioModal,
}) => {
  // Sort scenarios starting from the user's current level, then progressing toward advanced
  const orderedScenarios = useMemo(() => {
    const list = [...scenarios];
    const userWeight = LEVEL_WEIGHT[currentLevel] || 1;

    return list.sort((a, b) => {
      const aWeight = LEVEL_WEIGHT[a.difficultyLevel || 'intermediate'] || 2;
      const bWeight = LEVEL_WEIGHT[b.difficultyLevel || 'intermediate'] || 2;

      // Distance from current level
      const aDiff = aWeight >= userWeight ? aWeight - userWeight : aWeight + 10;
      const bDiff = bWeight >= userWeight ? bWeight - userWeight : bWeight + 10;

      return aDiff - bDiff;
    });
  }, [scenarios, currentLevel]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [historyIndices, setHistoryIndices] = useState<number[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Active top scenario
  const currentScenario = orderedScenarios[currentIndex % orderedScenarios.length];
  // Next scenario for background peek card
  const nextScenario = orderedScenarios[(currentIndex + 1) % orderedScenarios.length];
  // Third scenario for 3D stack depth
  const thirdScenario = orderedScenarios[(currentIndex + 2) % orderedScenarios.length];

  // Motion values for physics drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const startStampOpacity = useTransform(x, [30, 120], [0, 1]);
  const skipStampOpacity = useTransform(x, [-120, -30], [1, 0]);
  const startStampScale = useTransform(x, [30, 120], [0.8, 1.1]);
  const skipStampScale = useTransform(x, [-120, -30], [1.1, 0.8]);

  // Handle swipe completion
  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      // Swiped Right -> START
      triggerSwipe('right');
    } else if (info.offset.x < -threshold) {
      // Swiped Left -> SKIP
      triggerSwipe('left');
    }
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    if (direction === 'right') {
      // Start Scenario
      onStartScenario(currentScenario);
    } else {
      // Skip to next card
      setHistoryIndices((prev) => [...prev, currentIndex]);
      setCurrentIndex((prev) => (prev + 1) % orderedScenarios.length);
    }
  };

  const handleRewind = () => {
    if (historyIndices.length > 0) {
      const prevIdx = historyIndices[historyIndices.length - 1];
      setHistoryIndices((prev) => prev.slice(0, -1));
      setCurrentIndex(prevIdx);
    } else {
      setCurrentIndex((prev) => (prev - 1 + orderedScenarios.length) % orderedScenarios.length);
    }
  };

  const ScenarioIcon = SCENARIO_ICONS[currentScenario?.icon] || Sparkles;
  const NextScenarioIcon = SCENARIO_ICONS[nextScenario?.icon] || Sparkles;

  // Level badge styling
  const getLevelBadge = (level: ProficiencyLevel = 'intermediate') => {
    switch (level) {
      case 'beginner':
        return {
          label: 'Beginner A1-A2',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          dotClass: 'bg-emerald-400',
        };
      case 'intermediate':
        return {
          label: 'Intermediate B1-B2',
          badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          dotClass: 'bg-sky-400',
        };
      case 'advanced':
        return {
          label: 'Advanced C1-C2',
          badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          dotClass: 'bg-purple-400',
        };
    }
  };

  const currentBadge = getLevelBadge(currentScenario?.difficultyLevel);
  const nextBadge = getLevelBadge(nextScenario?.difficultyLevel);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none">
      {/* Slider Header info: Card Counter & Level Indicator */}
      <div className="w-full flex items-center justify-between px-2 pb-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="text-slate-300 font-semibold">Conversational Scenarios</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
            {(currentIndex % orderedScenarios.length) + 1} of {orderedScenarios.length}
          </span>
        </div>
      </div>

      {/* TINDER DECK CONTAINER */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] max-h-[500px] flex items-center justify-center">
        {/* 3rd Card in background stack */}
        {thirdScenario && (
          <div className="absolute w-[88%] h-[92%] rounded-3xl bg-slate-800/40 border border-slate-700/30 scale-90 translate-y-6 opacity-40 shadow-lg pointer-events-none" />
        )}

        {/* 2nd Card (Peeking immediately behind) */}
        {nextScenario && (
          <div className="absolute w-[94%] h-[96%] rounded-3xl bg-slate-800/80 border border-slate-700/60 scale-95 translate-y-3 opacity-80 shadow-xl overflow-hidden pointer-events-none transition-transform duration-300">
            <div className="p-5 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${nextBadge.badgeClass}`}
                >
                  {nextBadge.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">
                  {nextScenario.category}
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-300">{nextScenario.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-1">{nextScenario.tagline}</p>
              </div>
            </div>
          </div>
        )}

        {/* TOP ACTIVE SWIPEABLE CARD */}
        <AnimatePresence mode="wait">
          {currentScenario && (
            <motion.div
              key={currentScenario.id}
              style={{ x, rotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              whileTap={{ cursor: 'grabbing' }}
              className="absolute inset-0 w-full h-full rounded-3xl bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 border border-slate-700 shadow-2xl overflow-hidden cursor-grab flex flex-col justify-between p-5 sm:p-6"
            >
              {/* TINDER STAMP OVERLAYS */}
              {/* "START / LET'S GO" GREEN STAMP (Right Swipe) */}
              <motion.div
                style={{ opacity: startStampOpacity, scale: startStampScale }}
                className="absolute top-7 left-6 z-30 pointer-events-none -rotate-15 border-3 border-emerald-400 bg-emerald-950/90 text-emerald-300 px-4 py-1.5 rounded-2xl shadow-xl shadow-emerald-900/50 backdrop-blur-md"
              >
                <div className="flex items-center gap-1.5 font-black tracking-wider uppercase text-sm sm:text-base font-mono">
                  <span>START</span>
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
              </motion.div>

              {/* "SKIP / NEXT" RED/AMBER STAMP (Left Swipe) */}
              <motion.div
                style={{ opacity: skipStampOpacity, scale: skipStampScale }}
                className="absolute top-7 right-6 z-30 pointer-events-none rotate-15 border-3 border-rose-500 bg-rose-950/90 text-rose-300 px-4 py-1.5 rounded-2xl shadow-xl shadow-rose-900/50 backdrop-blur-md"
              >
                <div className="flex items-center gap-1.5 font-black tracking-wider uppercase text-sm sm:text-base font-mono">
                  <X className="w-5 h-5 stroke-[3]" />
                  <span>SKIP</span>
                </div>
              </motion.div>

              {/* CARD TOP BAR: Level Badge & Category */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${currentBadge.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${currentBadge.dotClass} animate-pulse`} />
                    {currentBadge.label}
                  </span>
                </div>

                <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-900/80 text-slate-400 border border-slate-700">
                  {currentScenario.category}
                </span>
              </div>

              {/* CARD CENTER: Scenario Icon Banner, Title & Description */}
              <div className="my-auto space-y-3 z-10">
                {/* Visual Decorative Icon Circle */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500/20 via-sky-500/20 to-emerald-500/20 border border-indigo-400/30 flex items-center justify-center shadow-inner relative group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <ScenarioIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-slate-900 border border-indigo-400/50 text-[9px] font-mono text-indigo-300 flex items-center gap-0.5">
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>{currentScenario.audioProfile?.voice || 'Zephyr'}</span>
                  </div>
                </div>

                {/* Scenario Title & Tagline */}
                <div className="text-center space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
                    {currentScenario.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                    {currentScenario.tagline}
                  </p>
                </div>

                {/* Character Persona & Setting Chip */}
                <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-semibold">
                    <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">
                      Partner: {currentScenario.audioProfile?.name} ({currentScenario.audioProfile?.role})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{currentScenario.scene?.setting}</span>
                  </div>
                </div>

                {/* Target Phrases Preview */}
                {currentScenario.targetKeyPhrases && currentScenario.targetKeyPhrases.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {currentScenario.targetKeyPhrases.slice(0, 3).map((phrase, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700 font-mono"
                      >
                        "{phrase}"
                      </span>
                    ))}
                    {currentScenario.targetKeyPhrases.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        +{currentScenario.targetKeyPhrases.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CARD BOTTOM: Swipe Direction Hint */}
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono z-10">
                <span className="flex items-center gap-1 text-rose-400">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Swipe Left to Skip</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span>Swipe Right to Start</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* NON-SWIPE FALLBACK ACTION BUTTONS (Desktop / Accessibility) */}
      <div className="w-full flex items-center justify-center gap-3.5 pt-4">
        {/* Rewind Button */}
        <button
          id="rewind-scenario-deck-btn"
          onClick={handleRewind}
          title="Rewind to previous card"
          className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Skip Button (Swipe Left) */}
        <button
          id="skip-scenario-deck-btn"
          onClick={() => triggerSwipe('left')}
          title="Skip scenario (Swipe Left)"
          className="w-13 h-13 rounded-2xl bg-slate-800/90 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-rose-400 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Custom AI Generator Button */}
        {onOpenCustomScenarioModal && (
          <button
            id="custom-scenario-deck-btn"
            onClick={onOpenCustomScenarioModal}
            title="Create Custom Scenario with AI"
            className="w-11 h-11 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-indigo-400" />
          </button>
        )}

        {/* Accept / Start Button (Swipe Right) */}
        <button
          id="start-scenario-deck-btn"
          onClick={() => triggerSwipe('right')}
          title="Start Scenario (Swipe Right)"
          className="w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/25 flex items-center justify-center transition-all hover:scale-108 active:scale-95 cursor-pointer font-bold"
        >
          <Check className="w-7 h-7 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
