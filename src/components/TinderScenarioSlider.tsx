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
  RotateCcw,
  Check,
  X,
  Volume2,
  MapPin,
  User,
  Zap,
  Flame,
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

      const aDiff = aWeight >= userWeight ? aWeight - userWeight : aWeight + 10;
      const bDiff = bWeight >= userWeight ? bWeight - userWeight : bWeight + 10;

      return aDiff - bDiff;
    });
  }, [scenarios, currentLevel]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [historyIndices, setHistoryIndices] = useState<number[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Reset scenario slider position when level changes (e.g. on language switch or level selection)
  React.useEffect(() => {
    setCurrentIndex(0);
    setHistoryIndices([]);
  }, [currentLevel, scenarios]);

  // Active top scenario
  const currentScenario = orderedScenarios[currentIndex % orderedScenarios.length];
  // Next scenario for background peek card
  const nextScenario = orderedScenarios[(currentIndex + 1) % orderedScenarios.length];
  // Third scenario for 3D stack depth
  const thirdScenario = orderedScenarios[(currentIndex + 2) % orderedScenarios.length];

  // Motion values for physics drag
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-16, 0, 16]);
  const startStampOpacity = useTransform(x, [30, 110], [0, 1]);
  const skipStampOpacity = useTransform(x, [-110, -30], [1, 0]);
  const startStampScale = useTransform(x, [30, 110], [0.85, 1.05]);
  const skipStampScale = useTransform(x, [-110, -30], [1.05, 0.85]);

  // Handle swipe completion
  const handleDragEnd = (event: any, info: any) => {
    const threshold = 90;
    if (info.offset.x > threshold) {
      triggerSwipe('right');
    } else if (info.offset.x < -threshold) {
      triggerSwipe('left');
    }
  };

  const triggerSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    if (direction === 'right') {
      onStartScenario(currentScenario);
    } else {
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

  // Level badge styling matching fresh palette
  const getLevelBadge = (level: ProficiencyLevel = 'intermediate') => {
    switch (level) {
      case 'beginner':
        return {
          label: 'Beginner A1-A2',
          badgeClass: 'bg-[#E8F8F4] text-[#167D68] border-[#4FD8B8]/60',
          dotClass: 'bg-[#4FD8B8]',
          borderCardClass: 'border-[#4FD8B8]/50 shadow-[0_12px_40px_rgba(79,216,184,0.14)]',
          glowClass: 'from-[#4FD8B8]/20 to-[#4FA8D8]/20',
          iconGradient: 'from-[#4FD8B8] to-[#3EC9A8]',
        };
      case 'intermediate':
        return {
          label: 'Intermediate B1-B2',
          badgeClass: 'bg-[#EAF5FC] text-[#216E9B] border-[#4FA8D8]/60',
          dotClass: 'bg-[#4FA8D8]',
          borderCardClass: 'border-[#4FA8D8]/50 shadow-[0_12px_40px_rgba(79,168,216,0.14)]',
          glowClass: 'from-[#4FA8D8]/20 to-[#B8A8E8]/20',
          iconGradient: 'from-[#4FA8D8] to-[#3A94C7]',
        };
      case 'advanced':
        return {
          label: 'Advanced C1-C2',
          badgeClass: 'bg-[#F3EFFF] text-[#6951BA] border-[#B8A8E8]/60',
          dotClass: 'bg-[#B8A8E8]',
          borderCardClass: 'border-[#B8A8E8]/60 shadow-[0_12px_40px_rgba(184,168,232,0.18)]',
          glowClass: 'from-[#B8A8E8]/20 to-[#4FD8B8]/20',
          iconGradient: 'from-[#B8A8E8] to-[#9885D6]',
        };
    }
  };

  const currentBadge = getLevelBadge(currentScenario?.difficultyLevel);
  const nextBadge = getLevelBadge(nextScenario?.difficultyLevel);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none">
      {/* Slider Header info: Card Counter & Level Indicator */}
      <div className="w-full flex items-center justify-between px-2 pb-2.5 text-xs text-[#6B8A87]">
        <div className="flex items-center gap-1.5 font-medium">
          <Flame className="w-3.5 h-3.5 text-[#FF8C66] animate-pulse" />
          <span className="text-[#1E3A3A] font-bold">Conversational Scenarios</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="px-2.5 py-0.5 rounded-full bg-white text-[#1E3A3A] border border-[#E2EFEA] shadow-xs font-semibold">
            {(currentIndex % orderedScenarios.length) + 1} of {orderedScenarios.length}
          </span>
        </div>
      </div>

      {/* TINDER DECK CONTAINER */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] max-h-[500px] flex items-center justify-center">
        {/* 3rd Card in background stack */}
        {thirdScenario && (
          <div className="absolute w-[88%] h-[92%] rounded-3xl bg-white/70 border border-[#E2EFEA] scale-90 translate-y-6 opacity-40 shadow-sm pointer-events-none" />
        )}

        {/* 2nd Card (Peeking immediately behind) */}
        {nextScenario && (
          <div className="absolute w-[94%] h-[96%] rounded-3xl bg-white border border-[#E2EFEA] scale-95 translate-y-3 opacity-90 shadow-md overflow-hidden pointer-events-none transition-transform duration-300">
            <div className="p-5 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${nextBadge.badgeClass}`}
                >
                  {nextBadge.label}
                </span>
                <span className="text-[10px] font-mono text-[#6B8A87] uppercase font-bold">
                  {nextScenario.category}
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#1E3A3A]">{nextScenario.title}</h4>
                <p className="text-xs text-[#6B8A87] line-clamp-1">{nextScenario.tagline}</p>
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
              className={`absolute inset-0 w-full h-full rounded-3xl bg-white border-2 ${currentBadge.borderCardClass} overflow-hidden cursor-grab flex flex-col justify-between p-5 sm:p-6 transition-colors`}
            >
              {/* TINDER STAMP OVERLAYS */}
              {/* "START / LET'S GO" FRESH MINT STAMP (Right Swipe) */}
              <motion.div
                style={{ opacity: startStampOpacity, scale: startStampScale }}
                className="absolute top-7 left-6 z-30 pointer-events-none -rotate-12 border-3 border-[#4FD8B8] bg-[#4FD8B8] text-[#0A302A] px-4 py-1.5 rounded-2xl shadow-xl shadow-[#4FD8B8]/40 backdrop-blur-md"
              >
                <div className="flex items-center gap-1.5 font-black tracking-wider uppercase text-sm sm:text-base font-mono">
                  <span>START</span>
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
              </motion.div>

              {/* "SKIP / NEXT" CORAL STAMP (Left Swipe) */}
              <motion.div
                style={{ opacity: skipStampOpacity, scale: skipStampScale }}
                className="absolute top-7 right-6 z-30 pointer-events-none rotate-12 border-3 border-[#FF8C66] bg-[#FF8C66] text-white px-4 py-1.5 rounded-2xl shadow-xl shadow-[#FF8C66]/40 backdrop-blur-md"
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
                    className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${currentBadge.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${currentBadge.dotClass} animate-pulse`} />
                    {currentBadge.label}
                  </span>
                </div>

                <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-[#F4FAF8] text-[#6B8A87] border border-[#E2EFEA]">
                  {currentScenario.category}
                </span>
              </div>

              {/* CARD CENTER: Scenario Icon Banner, Title & Description */}
              <div className="my-auto space-y-3 z-10">
                {/* Visual Decorative Icon Box with Mint to Sky Ocean Gradient */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#4FD8B8]/15 via-[#4FA8D8]/15 to-[#B8A8E8]/15 border border-[#E2EFEA] flex items-center justify-center relative group shadow-sm">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${currentBadge.iconGradient} flex items-center justify-center text-white shadow-md shadow-[#4FD8B8]/20`}>
                    <ScenarioIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-white border border-[#4FA8D8]/40 text-[9px] font-mono text-[#216E9B] flex items-center gap-0.5 shadow-xs font-semibold">
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>{currentScenario.audioProfile?.voice || 'Zephyr'}</span>
                  </div>
                </div>

                {/* Scenario Title & Tagline */}
                <div className="text-center space-y-1">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#1E3A3A] tracking-tight leading-snug">
                    {currentScenario.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B8A87] leading-relaxed max-w-xs mx-auto font-medium">
                    {currentScenario.tagline}
                  </p>
                </div>

                {/* Character Persona & Setting Chip */}
                <div className="bg-[#F4FAF8] border border-[#E2EFEA] rounded-2xl p-2.5 sm:p-3 space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#216E9B] font-bold">
                    <User className="w-3.5 h-3.5 text-[#4FA8D8] shrink-0" />
                    <span className="truncate">
                      Partner: {currentScenario.audioProfile?.name} ({currentScenario.audioProfile?.role})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6B8A87]">
                    <MapPin className="w-3.5 h-3.5 text-[#6B8A87] shrink-0" />
                    <span className="truncate">{currentScenario.scene?.setting}</span>
                  </div>
                </div>

                {/* Target Phrases Preview */}
                {currentScenario.targetKeyPhrases && currentScenario.targetKeyPhrases.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {currentScenario.targetKeyPhrases.slice(0, 3).map((phrase, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-[#F4FAF8] text-[#1E3A3A] border border-[#D5ECE3] font-medium"
                      >
                        "{phrase}"
                      </span>
                    ))}
                    {currentScenario.targetKeyPhrases.length > 3 && (
                      <span className="text-[10px] text-[#6B8A87] font-mono">
                        +{currentScenario.targetKeyPhrases.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CARD BOTTOM: Swipe Direction Hint */}
              <div className="pt-2 border-t border-[#E2EFEA] flex items-center justify-between text-[11px] text-[#6B8A87] font-mono z-10">
                <span className="flex items-center gap-1 text-[#E06640] font-semibold">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Swipe Left to Skip</span>
                </span>
                <span className="flex items-center gap-1 text-[#167D68] font-bold">
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
          className="w-11 h-11 rounded-2xl bg-white hover:bg-[#F4FAF8] text-[#6B8A87] hover:text-[#1E3A3A] border border-[#E2EFEA] shadow-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Skip Button (Swipe Left) — Soft Coral Pop */}
        <button
          id="skip-scenario-deck-btn"
          onClick={() => triggerSwipe('left')}
          title="Skip scenario (Swipe Left)"
          className="w-13 h-13 rounded-2xl bg-white hover:bg-[#FFF4EF] border border-[#FFB89A] hover:border-[#FF8C66] text-[#E06640] shadow-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <X className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Custom AI Generator Button — Lavender Highlight */}
        {onOpenCustomScenarioModal && (
          <button
            id="custom-scenario-deck-btn"
            onClick={onOpenCustomScenarioModal}
            title="Create Custom Scenario with AI"
            className="w-11 h-11 rounded-2xl bg-white hover:bg-[#F3EFFF] border border-[#B8A8E8] text-[#6951BA] shadow-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-[#B8A8E8]" />
          </button>
        )}

        {/* Accept / Start Button (Swipe Right) — Fresh Mint Gradient */}
        <button
          id="start-scenario-deck-btn"
          onClick={() => triggerSwipe('right')}
          title="Start Scenario (Swipe Right)"
          className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#4FD8B8] to-[#3EC9A8] hover:from-[#3EC9A8] hover:to-[#2EB898] text-[#0A302A] shadow-lg shadow-[#4FD8B8]/35 flex items-center justify-center transition-all hover:scale-108 active:scale-95 cursor-pointer font-bold"
        >
          <Check className="w-7 h-7 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
