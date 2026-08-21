import React, { useState } from 'react';
import {
  Language,
  ProficiencyLevel,
  Scenario,
  MainNavTab,
  LanguageProgress,
  LanguageProgressMap,
} from '../types';
import {
  Sparkles,
  Camera,
  Languages,
  X,
  Search,
  Check,
  ChevronDown,
  Wand2,
  Home,
  Compass,
  User,
  ScanLine,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { TinderScenarioSlider } from './TinderScenarioSlider';
import { VisualTranslateModal } from './VisualTranslateModal';
import { LevelsView } from './LevelsView';
import { ProfilePerformanceView } from './ProfilePerformanceView';

interface ScenarioPickerProps {
  scenarios: Scenario[];
  languages: Language[];
  selectedLanguage: Language;
  onSelectLanguage: (language: Language) => void;
  selectedLevel: ProficiencyLevel;
  onSelectLevel: (level: ProficiencyLevel) => void;
  onSelectScenario: (scenario: Scenario) => void;
  onAddCustomScenario: (customScenario: Scenario) => void;
  onOpenStrangerBridge: () => void;
  progress?: LanguageProgress;
  allProgress?: LanguageProgressMap;
}

export const ScenarioPicker: React.FC<ScenarioPickerProps> = ({
  scenarios,
  languages,
  selectedLanguage,
  onSelectLanguage,
  selectedLevel,
  onSelectLevel,
  onSelectScenario,
  onAddCustomScenario,
  onOpenStrangerBridge,
  progress,
  allProgress = {},
}) => {
  // Navigation tab state: 'home' | 'levels' | 'profile'
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');

  // Modals state
  const [isVisualModalOpen, setIsVisualModalOpen] = useState<boolean>(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>('');
  const [langRegionFilter, setLangRegionFilter] = useState<'all' | 'india' | 'global'>('all');

  // Language switch confirmation state
  const [pendingLanguageChange, setPendingLanguageChange] = useState<Language | null>(null);

  // Custom AI Scenario creator modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isCreatingCustom, setIsCreatingCustom] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Filtered languages for modal
  const filteredLanguages = languages.filter((l) => {
    const matchesQuery =
      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
      l.code.toLowerCase().includes(langSearch.toLowerCase());
    const matchesRegion = langRegionFilter === 'all' || l.region === langRegionFilter;
    return matchesQuery && matchesRegion;
  });

  // Initiate language change click
  const handleInitiateLanguageChange = (targetLang: Language) => {
    if (targetLang.code === selectedLanguage.code) {
      setIsLangModalOpen(false);
      return;
    }
    setPendingLanguageChange(targetLang);
  };

  // Confirm language change
  const handleConfirmLanguageChange = () => {
    if (pendingLanguageChange) {
      onSelectLanguage(pendingLanguageChange);
      setPendingLanguageChange(null);
      setIsLangModalOpen(false);
    }
  };

  // Handle Custom AI Scenario Generation
  const handleGenerateCustomScenario = async () => {
    if (!customPrompt.trim() || isCreatingCustom) return;
    setIsCreatingCustom(true);
    setCustomError(null);

    try {
      const res = await fetch('/api/custom-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          language: selectedLanguage,
          level: selectedLevel,
        }),
      });

      if (res.ok) {
        const customScenario: Scenario = await res.json();
        onAddCustomScenario(customScenario);
        setIsCustomModalOpen(false);
        setCustomPrompt('');
        onSelectScenario(customScenario);
      } else {
        throw new Error('Failed to generate scenario');
      }
    } catch (err: any) {
      setCustomError('Could not generate scenario. Please try a different prompt.');
    } finally {
      setIsCreatingCustom(false);
    }
  };

  const pendingTargetProgress = pendingLanguageChange ? allProgress[pendingLanguageChange.code] : undefined;
  const isPendingLanguagePreviouslyPracticed = Boolean(pendingTargetProgress && pendingTargetProgress.hasPracticed);

  return (
    <div className="min-h-screen bg-[#F4FAF8] text-[#1E3A3A] flex flex-col justify-between selection:bg-[#4FD8B8]/30 selection:text-[#1E3A3A]">
      {/* ==================================================== */}
      {/* 1. TOP NAVIGATION BAR                                */}
      {/* ==================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#E2EFEA] px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left: App Logo & Name (Talkie) */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#4FD8B8] via-[#4FA8D8] to-[#B8A8E8] p-0.5 shadow-sm shadow-[#4FD8B8]/20 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-[#167D68]">
                <Sparkles className="w-4.5 h-4.5 text-[#2BB394]" />
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#1E3A3A] flex items-center gap-1.5">
                <span>Talkie</span>
              </h1>
              <p className="text-[10px] text-[#6B8A87] font-medium hidden sm:block">
                Multimodal AI Language Learning & Live Conversation
              </p>
            </div>
          </div>

          {/* Right Side: Sky-Blue Styled Language Selector Pill */}
          <div className="flex items-center gap-2">
            <button
              id="top-nav-language-selector-btn"
              onClick={() => setIsLangModalOpen(true)}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white hover:bg-[#EAF5FC] border border-[#4FA8D8]/50 hover:border-[#4FA8D8] text-[#1E3A3A] text-xs sm:text-sm font-bold transition-all shadow-xs hover:scale-102 active:scale-98 cursor-pointer group"
              title="Change Learning Language"
            >
              <span className="text-base sm:text-lg leading-none">{selectedLanguage.flag}</span>
              <span className="text-[#1E3A3A] group-hover:text-[#216E9B]">{selectedLanguage.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#4FA8D8]" />
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================== */}
      {/* 2. MAIN CONTENT AREA (TAB-SWITCHED)                  */}
      {/* ==================================================== */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6 flex flex-col justify-center">
        {/* TAB 1: HOME (TINDER SLIDER DECK + TWO LARGE ACTION BUTTONS) */}
        {activeTab === 'home' && (
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Center: Tinder-style Scenario Swipe Deck */}
            <section className="w-full">
              <TinderScenarioSlider
                scenarios={scenarios}
                currentLevel={selectedLevel}
                onStartScenario={onSelectScenario}
                onOpenCustomScenarioModal={() => setIsCustomModalOpen(true)}
              />
            </section>

            {/* Below the Slider: Two Large, Clearly Distinct Action Buttons */}
            <section className="w-full max-w-md mx-auto pt-1">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* 1. Camera / Visual Translate Button (Warm Coral Pop) */}
                <button
                  id="camera-visual-lens-btn"
                  onClick={() => setIsVisualModalOpen(true)}
                  className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-3xl bg-gradient-to-br from-[#FFB89A] via-[#FFA380] to-[#FF8C66] hover:from-[#FFA380] hover:to-[#FF7A50] border border-[#FFB89A]/50 transition-all shadow-md shadow-[#FFB89A]/35 hover:shadow-lg hover:shadow-[#FF8C66]/40 hover:scale-102 active:scale-98 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/90 border border-white/80 text-[#D9552E] flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-white group-hover:text-[#B83E1A] transition-all shadow-xs">
                    <ScanLine className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-[#1E3A3A]">
                    Visual Lens
                  </span>
                  <span className="text-[10px] text-[#4A281E] font-medium line-clamp-1 pt-0.5">
                    Scan Signs & Menus
                  </span>
                  <span className="mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-[#9C3818] border border-white/60">
                    Google Lens
                  </span>
                </button>

                {/* 2. Instant Stranger Bridge Button (Mint to Sky Ocean Breeze) */}
                <button
                  id="instant-stranger-bridge-btn"
                  onClick={onOpenStrangerBridge}
                  className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-3xl bg-gradient-to-br from-[#4FD8B8] via-[#46C4BD] to-[#4FA8D8] hover:from-[#3EC9A8] hover:to-[#389BCB] border border-[#4FD8B8]/50 transition-all shadow-md shadow-[#4FD8B8]/35 hover:shadow-lg hover:shadow-[#4FA8D8]/40 hover:scale-102 active:scale-98 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/90 border border-white/80 text-[#167D68] flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-white group-hover:text-[#0D5949] transition-all shadow-xs">
                    <Languages className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-black text-[#0A302A]">
                    Stranger Bridge
                  </span>
                  <span className="text-[10px] text-[#14483E] font-medium line-clamp-1 pt-0.5">
                    Live Talk with Strangers
                  </span>
                  <span className="mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-[#0F5446] border border-white/60">
                    Live Interpreter
                  </span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: LEVELS (LEARNING PROGRESSION PATH A1 TO C2) */}
        {activeTab === 'levels' && (
          <LevelsView
            currentLevel={selectedLevel}
            onSelectLevel={onSelectLevel}
            onStartScenario={onSelectScenario}
            scenarios={scenarios}
            targetLanguage={selectedLanguage}
            progress={progress}
          />
        )}

        {/* TAB 3: PROFILE / PERFORMANCE */}
        {activeTab === 'profile' && (
          <ProfilePerformanceView
            currentLevel={selectedLevel}
            targetLanguage={selectedLanguage}
            onSelectLevel={onSelectLevel}
            progress={progress}
            allProgress={allProgress}
            onRequestLanguageChange={handleInitiateLanguageChange}
          />
        )}
      </main>

      {/* ==================================================== */}
      {/* 3. PERSISTENT FOOTER NAVIGATION (MOBILE-FIRST 3 TABS)*/}
      {/* ==================================================== */}
      <nav className="sticky bottom-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[#E2EFEA] px-4 py-2 shadow-sm">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
          {/* Tab 1: Home */}
          <button
            id="footer-tab-home"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'text-[#1E3A3A] bg-[#E8F8F4] border border-[#4FD8B8]/50 shadow-xs'
                : 'text-[#6B8A87] hover:text-[#1E3A3A]'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-[#167D68]' : ''}`} />
            <span className="text-[11px] font-bold mt-1">Home</span>
          </button>

          {/* Tab 2: Levels */}
          <button
            id="footer-tab-levels"
            onClick={() => setActiveTab('levels')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'levels'
                ? 'text-[#1E3A3A] bg-[#EAF5FC] border border-[#4FA8D8]/50 shadow-xs'
                : 'text-[#6B8A87] hover:text-[#1E3A3A]'
            }`}
          >
            <Compass className={`w-5 h-5 ${activeTab === 'levels' ? 'text-[#216E9B]' : ''}`} />
            <span className="text-[11px] font-bold mt-1">Levels</span>
          </button>

          {/* Tab 3: Profile / Performance */}
          <button
            id="footer-tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-[#1E3A3A] bg-[#F3EFFF] border border-[#B8A8E8]/60 shadow-xs'
                : 'text-[#6B8A87] hover:text-[#1E3A3A]'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-[#6951BA]' : ''}`} />
            <span className="text-[11px] font-bold mt-1">Profile</span>
          </button>
        </div>
      </nav>

      {/* ==================================================== */}
      {/* 4. MODALS (LANGUAGE PICKER, CONFIRMATION, VISUAL, AI)*/}
      {/* ==================================================== */}

      {/* Google Lens Visual Translate Modal */}
      <VisualTranslateModal
        isOpen={isVisualModalOpen}
        onClose={() => setIsVisualModalOpen(false)}
        userLanguage={languages.find((l) => l.code === 'en') || languages[0]}
        targetLanguage={selectedLanguage}
      />

      {/* Target Language Picker Overlay Modal */}
      {isLangModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E3A3A]/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-[#E2EFEA] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#E2EFEA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌐</span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1E3A3A]">Select Target Language</h3>
                  <p className="text-xs text-[#6B8A87]">24+ Indian & Global Languages Supported</p>
                </div>
              </div>
              <button
                onClick={() => setIsLangModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4FAF8] text-[#6B8A87] hover:text-[#1E3A3A] hover:bg-[#E2EFEA] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Region Filter & Search */}
            <div className="p-3 bg-[#F4FAF8] border-b border-[#E2EFEA] space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8A87]" />
                <input
                  type="text"
                  placeholder="Search by language name or native script..."
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  className="w-full bg-white border border-[#E2EFEA] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1E3A3A] placeholder-[#6B8A87] focus:outline-none focus:border-[#4FA8D8] shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLangRegionFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    langRegionFilter === 'all'
                      ? 'bg-[#4FA8D8] text-white shadow-xs'
                      : 'bg-white text-[#6B8A87] hover:text-[#1E3A3A] border border-[#E2EFEA]'
                  }`}
                >
                  All (24)
                </button>
                <button
                  onClick={() => setLangRegionFilter('india')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    langRegionFilter === 'india'
                      ? 'bg-[#4FD8B8] text-[#0A302A] shadow-xs'
                      : 'bg-white text-[#6B8A87] hover:text-[#1E3A3A] border border-[#E2EFEA]'
                  }`}
                >
                  Indian Languages (13)
                </button>
                <button
                  onClick={() => setLangRegionFilter('global')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    langRegionFilter === 'global'
                      ? 'bg-[#B8A8E8] text-[#36276B] shadow-xs'
                      : 'bg-white text-[#6B8A87] hover:text-[#1E3A3A] border border-[#E2EFEA]'
                  }`}
                >
                  Global Languages (11)
                </button>
              </div>
            </div>

            {/* Languages Grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredLanguages.map((lang) => {
                const isSelected = selectedLanguage.code === lang.code;
                const langProgress = allProgress[lang.code];
                const hasHistory = langProgress && langProgress.hasPracticed;

                return (
                  <button
                    key={lang.code}
                    onClick={() => handleInitiateLanguageChange(lang)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E8F8F4] border-[#4FD8B8] text-[#1E3A3A] shadow-sm'
                        : 'bg-white border-[#E2EFEA] hover:bg-[#F4FAF8] hover:border-[#4FA8D8]/50 text-[#1E3A3A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{lang.flag}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-[#1E3A3A]">{lang.name}</p>
                          {hasHistory && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#EAF5FC] text-[#216E9B] font-mono font-bold">
                              {langProgress.level.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#6B8A87] font-mono">{lang.nativeName}</p>
                      </div>
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-[#167D68]" />
                    ) : hasHistory ? (
                      <span className="text-[10px] text-[#2BB394] font-bold font-mono">
                        {langProgress.xp} XP
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Language Switch Confirmation Prompt Dialog */}
      {pendingLanguageChange && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#1E3A3A]/50 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-[#E2EFEA] rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF5FC] border border-[#4FA8D8]/40 text-[#216E9B] flex items-center justify-center shrink-0">
                <span className="text-xl">{pendingLanguageChange.flag}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[#1E3A3A]">
                  Switch to {pendingLanguageChange.name}?
                </h3>
                <p className="text-xs text-[#6B8A87] leading-relaxed">
                  {isPendingLanguagePreviouslyPracticed ? (
                    <>
                      Switching to <strong className="text-[#1E3A3A]">{pendingLanguageChange.name}</strong> — you'll resume your saved progress at Level <strong className="text-[#216E9B] uppercase font-mono">{pendingTargetProgress?.level}</strong> with <strong className="text-[#167D68] font-mono">{pendingTargetProgress?.xp.toLocaleString()} XP</strong>. Your progress in <strong className="text-[#1E3A3A]">{selectedLanguage.name}</strong> will be saved and you can switch back anytime.
                    </>
                  ) : (
                    <>
                      Switching to <strong className="text-[#1E3A3A]">{pendingLanguageChange.name}</strong> — you'll start this language from the <strong className="text-[#167D68]">Beginner</strong> level. Your progress in <strong className="text-[#1E3A3A]">{selectedLanguage.name}</strong> will be saved and you can switch back anytime.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Visual Transition Preview */}
            <div className="p-3 rounded-2xl bg-[#F4FAF8] border border-[#E2EFEA] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span>{selectedLanguage.flag}</span>
                <span className="font-bold text-[#1E3A3A]">{selectedLanguage.name}</span>
                <span className="text-[10px] text-[#6B8A87] font-mono">({selectedLevel.toUpperCase()})</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#4FA8D8]" />
              <div className="flex items-center gap-2">
                <span>{pendingLanguageChange.flag}</span>
                <span className="font-bold text-[#1E3A3A]">{pendingLanguageChange.name}</span>
                <span className="text-[10px] text-[#167D68] font-mono font-bold">
                  ({(pendingTargetProgress?.level || 'beginner').toUpperCase()})
                </span>
              </div>
            </div>

            {/* Action Buttons: Cancel and Confirm */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                id="cancel-language-switch-btn"
                onClick={() => setPendingLanguageChange(null)}
                className="px-4 py-2.5 rounded-xl bg-[#F4FAF8] hover:bg-[#E2EFEA] text-xs font-bold text-[#6B8A87] hover:text-[#1E3A3A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-language-switch-btn"
                onClick={handleConfirmLanguageChange}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4FD8B8] to-[#4FA8D8] text-[#0A302A] text-xs font-black shadow-md shadow-[#4FD8B8]/30 hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Confirm Switch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom AI Scenario Generation Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E3A3A]/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-[#E2EFEA] rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F3EFFF] text-[#6951BA] flex items-center justify-center border border-[#B8A8E8]/50">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1E3A3A]">Generate Custom Scenario</h3>
                  <p className="text-[11px] text-[#6B8A87]">Powered by Gemini Multimodal Prompting</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#F4FAF8] text-[#6B8A87] hover:text-[#1E3A3A] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1E3A3A]">
                Describe the real-world situation or persona:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Renting a bicycle in Amsterdam, asking for a gluten-free dish in Rome, or negotiating a salary in Tokyo..."
                rows={3}
                className="w-full bg-[#F4FAF8] border border-[#E2EFEA] rounded-xl p-3 text-xs text-[#1E3A3A] placeholder-[#6B8A87] focus:outline-none focus:border-[#4FD8B8]"
              />
            </div>

            {customError && (
              <p className="text-xs text-[#C53030] bg-[#FFF5F5] p-2 rounded-lg border border-[#FEB2B2]">
                {customError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F4FAF8] hover:bg-[#E2EFEA] text-xs font-bold text-[#6B8A87] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateCustomScenario}
                disabled={!customPrompt.trim() || isCreatingCustom}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4FD8B8] to-[#4FA8D8] text-[#0A302A] text-xs font-extrabold shadow-md shadow-[#4FD8B8]/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0A302A]" />
                <span>{isCreatingCustom ? 'Creating...' : 'Create Scenario'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

