import React, { useState } from 'react';
import {
  Language,
  ProficiencyLevel,
  Scenario,
  MainNavTab,
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
  Radio,
  ScanLine,
  ArrowRight,
  Layers,
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
}) => {
  // Navigation tab state: 'home' | 'levels' | 'profile'
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');

  // Modals state
  const [isVisualModalOpen, setIsVisualModalOpen] = useState<boolean>(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState<boolean>(false);
  const [langSearch, setLangSearch] = useState<string>('');
  const [langRegionFilter, setLangRegionFilter] = useState<'all' | 'india' | 'global'>('all');

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30">
      {/* ==================================================== */}
      {/* 1. TOP NAVIGATION BAR                                */}
      {/* ==================================================== */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left: App Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-sky-400 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Phrasebook Buddy</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Multimodal AI Conversational Partner
              </p>
            </div>
          </div>

          {/* Right Side: Compact Language Selector Pill */}
          <div className="flex items-center gap-2">
            <button
              id="top-nav-language-selector-btn"
              onClick={() => setIsLangModalOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm hover:scale-102 active:scale-98 cursor-pointer"
              title="Change Learning Language"
            >
              <span className="text-base sm:text-lg leading-none">{selectedLanguage.flag}</span>
              <span className="font-bold text-white">{selectedLanguage.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
                {/* 1. Camera / Visual Translate Button (Google Lens) */}
                <button
                  id="camera-visual-lens-btn"
                  onClick={() => setIsVisualModalOpen(true)}
                  className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-sky-950/50 hover:from-indigo-900/70 hover:to-sky-900/60 border border-indigo-500/30 hover:border-indigo-400/60 transition-all shadow-lg hover:shadow-indigo-500/10 hover:scale-102 active:scale-98 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-md">
                    <ScanLine className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    Visual Lens
                  </span>
                  <span className="text-[10px] text-slate-300 line-clamp-1 pt-0.5">
                    Scan Signs & Menus
                  </span>
                  <span className="mt-1.5 text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Google Lens
                  </span>
                </button>

                {/* 2. Instant Conversation Translate Button (Stranger Bridge) */}
                <button
                  id="instant-stranger-bridge-btn"
                  onClick={onOpenStrangerBridge}
                  className="flex flex-col items-center text-center p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/50 hover:from-emerald-900/70 hover:to-teal-900/60 border border-emerald-500/30 hover:border-emerald-400/60 transition-all shadow-lg hover:shadow-emerald-500/10 hover:scale-102 active:scale-98 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all shadow-md">
                    <Languages className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    Stranger Bridge
                  </span>
                  <span className="text-[10px] text-slate-300 line-clamp-1 pt-0.5">
                    Live Talk with Strangers
                  </span>
                  <span className="mt-1.5 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
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
          />
        )}

        {/* TAB 3: PROFILE / PERFORMANCE */}
        {activeTab === 'profile' && (
          <ProfilePerformanceView
            currentLevel={selectedLevel}
            targetLanguage={selectedLanguage}
            onSelectLevel={onSelectLevel}
          />
        )}
      </main>

      {/* ==================================================== */}
      {/* 3. PERSISTENT FOOTER NAVIGATION (MOBILE-FIRST 3 TABS)*/}
      {/* ==================================================== */}
      <nav className="sticky bottom-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-4 py-2">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
          {/* Tab 1: Home */}
          <button
            id="footer-tab-home"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'text-white bg-slate-900 border border-slate-700/80 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-indigo-400' : ''}`} />
            <span className="text-[11px] font-bold mt-1">Home</span>
          </button>

          {/* Tab 2: Levels */}
          <button
            id="footer-tab-levels"
            onClick={() => setActiveTab('levels')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'levels'
                ? 'text-white bg-slate-900 border border-slate-700/80 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className={`w-5 h-5 ${activeTab === 'levels' ? 'text-sky-400' : ''}`} />
            <span className="text-[11px] font-bold mt-1">Levels</span>
          </button>

          {/* Tab 3: Profile / Performance */}
          <button
            id="footer-tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-white bg-slate-900 border border-slate-700/80 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-emerald-400' : ''}`} />
            <span className="text-[11px] font-bold mt-1">Profile</span>
          </button>
        </div>
      </nav>

      {/* ==================================================== */}
      {/* 4. MODALS (LANGUAGE PICKER, VISUAL LENS, CUSTOM AI)  */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌐</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Select Target Language</h3>
                  <p className="text-xs text-slate-400">24+ Indian & Global Languages Supported</p>
                </div>
              </div>
              <button
                onClick={() => setIsLangModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Region Filter & Search */}
            <div className="p-3 bg-slate-950/40 border-b border-slate-800 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by language name or native script..."
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLangRegionFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    langRegionFilter === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All (24)
                </button>
                <button
                  onClick={() => setLangRegionFilter('india')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    langRegionFilter === 'india'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Indian Languages (13)
                </button>
                <button
                  onClick={() => setLangRegionFilter('global')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    langRegionFilter === 'global'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
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
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onSelectLanguage(lang);
                      setIsLangModalOpen(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{lang.flag}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{lang.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{lang.nativeName}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Custom AI Scenario Generation Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Generate Custom Scenario</h3>
                  <p className="text-[11px] text-slate-400">Powered by Gemini Multimodal Prompting</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Describe the real-world situation or persona:
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Renting a bicycle in Amsterdam, asking for a gluten-free dish in Rome, or negotiating a salary in Tokyo..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {customError && (
              <p className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-500/30">
                {customError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateCustomScenario}
                disabled={!customPrompt.trim() || isCreatingCustom}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isCreatingCustom ? 'Creating...' : 'Create Scenario'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
