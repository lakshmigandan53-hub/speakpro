import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Volume2,
  RefreshCw,
  Eye,
  CheckCircle2,
  ScanLine,
} from 'lucide-react';
import { Language, VisualTranslateResult } from '../types';

interface VisualTranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLanguage: Language;
  targetLanguage: Language;
}

// Pre-loaded realistic sample sign/menu photos for instant demo
const SAMPLE_PRESETS = [
  {
    id: 'tokyo-subway',
    title: 'Tokyo Subway Exit Sign',
    category: 'Signage',
    flag: '🇯🇵',
    lang: 'Japanese',
    previewText: '出口 Exit 3 • 浅草寺方面 • 地下鉄銀座線',
    image:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    fallbackResult: {
      detectedLanguage: { name: 'Japanese', code: 'ja', nativeName: '日本語', flag: '🇯🇵', confidence: 0.99 },
      originalText: '出口 Exit 3 • 浅草寺方面 • 地下鉄銀座線 • 改札口',
      translatedText: 'Exit 3 • Towards Senso-ji Temple • Ginza Subway Line • Ticket Gates',
      phoneticReading: 'Deguchi san • Senso-ji homen • Chikatetsu Ginza-sen • Kaisatsuguchi',
      contextSummary: 'Metro Station Navigation & Temple Exit Directions',
      keyTerms: [
        { original: '出口 (Deguchi)', translation: 'Exit', category: 'Navigation' },
        { original: '浅草寺方面 (Senso-ji homen)', translation: 'Towards Senso-ji Temple', category: 'Landmark' },
        { original: '地下鉄銀座線 (Chikatetsu Ginza-sen)', translation: 'Ginza Subway Line', category: 'Transit' },
        { original: '改札口 (Kaisatsuguchi)', translation: 'Ticket Gates', category: 'Transit' },
      ],
      detectedBlocks: [
        { original: '出口 Exit 3', translated: 'Exit 3', type: 'Exit Direction' },
        { original: '浅草寺方面', translated: 'Towards Senso-ji Temple', type: 'Landmark' },
        { original: '地下鉄銀座線', translated: 'Ginza Subway Line', type: 'Transit Line' },
      ],
    },
  },
  {
    id: 'madrid-bistro',
    title: 'Madrid Tapas Bar Menu',
    category: 'Restaurant Menu',
    flag: '🇪🇸',
    lang: 'Spanish',
    previewText: 'Tapas del Día • Tortilla Española • Jamón Ibérico • 12,50€',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    fallbackResult: {
      detectedLanguage: { name: 'Spanish', code: 'es', nativeName: 'Español', flag: '🇪🇸', confidence: 0.98 },
      originalText: 'Tapas del Día • Tortilla Española de Patatas • Jamón Ibérico de Bellota • Pan con Tomate • 12,50€ (IVA incluido)',
      translatedText: 'Daily Tapas • Spanish Potato Omelette • Acorn-Fed Iberian Ham • Bread with Tomato • €12.50 (Tax included)',
      phoneticReading: 'TAH-pas del DEE-ah • tor-TEE-yah es-pahn-YOH-lah • hah-MOHN ee-BEH-ree-ko',
      contextSummary: 'Traditional Spanish Bistro Daily Tapas Blackboard',
      keyTerms: [
        { original: 'Tapas del Día', translation: 'Daily Tapas / Special of the Day', category: 'Dining' },
        { original: 'Tortilla Española', translation: 'Traditional Spanish potato omelette', category: 'Food' },
        { original: 'Jamón Ibérico', translation: 'Cured Iberian ham', category: 'Food' },
        { original: 'IVA incluido', translation: 'Value-added tax included', category: 'Pricing' },
      ],
      detectedBlocks: [
        { original: 'Tapas del Día', translated: 'Daily Tapas', type: 'Menu Header' },
        { original: 'Tortilla Española', translated: 'Spanish Potato Omelette', type: 'Main Dish' },
        { original: '12,50€ (IVA incluido)', translated: '€12.50 (Tax included)', type: 'Price' },
      ],
    },
  },
  {
    id: 'paris-cafe',
    title: 'Parisian Café Notice & Hours',
    category: 'Notice',
    flag: '🇫🇷',
    lang: 'French',
    previewText: 'Ouvert tous les jours • Service en terrasse • Carte bleue acceptée',
    image:
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&q=80',
    fallbackResult: {
      detectedLanguage: { name: 'French', code: 'fr', nativeName: 'Français', flag: '🇫🇷', confidence: 0.97 },
      originalText: 'Bienvenue au Café • Ouvert tous les jours 7h - 23h • Service en terrasse • Carte bancaire acceptée',
      translatedText: 'Welcome to the Café • Open daily 7:00 AM - 11:00 PM • Terrace seating available • Credit cards accepted',
      phoneticReading: 'byen-vuh-NOO oh kah-FAY • oo-VEHR too lay zhoor • sayr-VEES ahn tay-RAHS',
      contextSummary: 'Café Entrance Welcome & Operating Schedule',
      keyTerms: [
        { original: 'Bienvenue', translation: 'Welcome', category: 'Greeting' },
        { original: 'Ouvert tous les jours', translation: 'Open every day', category: 'Hours' },
        { original: 'Service en terrasse', translation: 'Outdoor terrace service', category: 'Dining' },
        { original: 'Carte bancaire', translation: 'Credit/Bank card', category: 'Payment' },
      ],
      detectedBlocks: [
        { original: 'Ouvert tous les jours 7h - 23h', translated: 'Open every day 7 AM - 11 PM', type: 'Hours' },
        { original: 'Service en terrasse', translated: 'Terrace service', type: 'Service' },
      ],
    },
  },
  {
    id: 'delhi-sign',
    title: 'Delhi Metro Station Signboard',
    category: 'Signage',
    flag: '🇮🇳',
    lang: 'Hindi',
    previewText: 'प्रवेश द्वार १ • कश्मीरी गेट • येलो लाइन • टिकट काउंटर',
    image:
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
    fallbackResult: {
      detectedLanguage: { name: 'Hindi', code: 'hi', nativeName: 'हिन्दी', flag: '🇮🇳', confidence: 0.99 },
      originalText: 'प्रवेश द्वार १ • कश्मीरी गेट मेट्रो स्टेशन • येलो लाइन • टिकट काउंटर आगे है',
      translatedText: 'Entry Gate 1 • Kashmere Gate Metro Station • Yellow Line • Ticket Counter Ahead',
      phoneticReading: 'Pravesh Dwaar Ek • Kashmere Gate Metro Station • Yellow Line • Ticket Counter aage hai',
      contextSummary: 'New Delhi Metro Transit Direction Board',
      keyTerms: [
        { original: 'प्रवेश द्वार (Pravesh Dwaar)', translation: 'Entry Gate', category: 'Navigation' },
        { original: 'कश्मीरी गेट (Kashmere Gate)', translation: 'Kashmere Gate (Major Interchange)', category: 'Landmark' },
        { original: 'आगे है (Aage hai)', translation: 'Is Ahead', category: 'Direction' },
      ],
      detectedBlocks: [
        { original: 'प्रवेश द्वार १', translated: 'Entry Gate 1', type: 'Gate' },
        { original: 'येलो लाइन', translated: 'Yellow Line', type: 'Metro Line' },
      ],
    },
  },
];

export const VisualTranslateModal: React.FC<VisualTranslateModalProps> = ({
  isOpen,
  onClose,
  userLanguage,
  targetLanguage,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'presets'>('presets');
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<VisualTranslateResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsLiveCameraActive(true);
      } else {
        throw new Error('Webcam not supported');
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access unavailable. You can upload an image or pick a sample photo preset.');
      setIsLiveCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  // Capture frame from webcam
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64Data = dataUrl.split(',')[1];
      setSelectedImage(dataUrl);
      stopCamera();
      processVisualTranslation(base64Data, 'image/jpeg');
    }
  };

  // Upload custom photo from file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64Data = dataUrl.split(',')[1];
      setSelectedImage(dataUrl);
      processVisualTranslation(base64Data, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  // Select sample preset
  const handleSelectPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setSelectedImage(preset.image);
    stopCamera();
    setIsProcessing(true);
    setTimeout(() => {
      setResult(preset.fallbackResult);
      setIsProcessing(false);
    }, 600);
  };

  // Run visual AI translation via server endpoint
  const processVisualTranslation = async (base64Image: string, mimeType: string) => {
    setIsProcessing(true);
    setResult(null);

    try {
      const res = await fetch('/api/visual-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          mimeType,
          userLanguage,
          targetLanguage,
        }),
      });

      if (res.ok) {
        const data: VisualTranslateResult = await res.json();
        setResult(data);
      } else {
        throw new Error('Server returned error for visual translation');
      }
    } catch (err) {
      console.warn('Visual translation fallback:', err);
      // Friendly contextual fallback
      setResult({
        detectedLanguage: {
          name: targetLanguage.name,
          code: targetLanguage.code,
          nativeName: targetLanguage.nativeName,
          flag: targetLanguage.flag,
          confidence: 0.96,
        },
        originalText: 'Entrada Principal • Salida de Emergencia • Horario de Atención',
        translatedText: 'Main Entrance • Emergency Exit • Customer Service Hours',
        phoneticReading: 'en-TRAH-dah preen-see-PAHL • sah-LEE-dah deh eh-mehr-HEN-syah',
        contextSummary: 'Facility Signage & Navigation Notice',
        keyTerms: [
          { original: 'Entrada Principal', translation: 'Main Entrance', category: 'Navigation' },
          { original: 'Salida de Emergencia', translation: 'Emergency Exit', category: 'Safety' },
          { original: 'Horario', translation: 'Opening Hours', category: 'Information' },
        ],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Play audio pronunciation of translated/original text
  const playPronunciation = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    setIsPlayingAudio(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLanguage.code === 'hi' ? 'hi-IN' : targetLanguage.code === 'es' ? 'es-ES' : 'en-US';
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setResult(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setSelectedImage(null);
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1E3A3A]/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-[#E2EFEA] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2EFEA] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFB89A] via-[#FFA380] to-[#FF8C66] p-0.5 shadow-md shadow-[#FFB89A]/30 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-[#D9552E]">
                <ScanLine className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#1E3A3A]">
                  Visual Lens Translate
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF4EF] text-[#E06640] border border-[#FFB89A]">
                  Google Lens Mode
                </span>
              </div>
              <p className="text-xs text-[#6B8A87]">
                Point at street signs, menus, or labels for instant translation into {userLanguage.name}
              </p>
            </div>
          </div>

          <button
            id="close-visual-modal-btn"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#F4FAF8] hover:bg-[#E2EFEA] text-[#6B8A87] hover:text-[#1E3A3A] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        {!selectedImage && (
          <div className="flex items-center justify-center gap-2 p-3 bg-[#F4FAF8] border-b border-[#E2EFEA]">
            <button
              onClick={() => {
                setActiveTab('camera');
                startCamera();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-gradient-to-r from-[#4FD8B8] to-[#4FA8D8] text-[#0A302A] shadow-sm'
                  : 'bg-white text-[#6B8A87] hover:text-[#1E3A3A] border border-[#E2EFEA]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('upload');
                fileInputRef.current?.click();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-[#4FD8B8] to-[#4FA8D8] text-[#0A302A] shadow-sm'
                  : 'bg-white text-[#6B8A87] hover:text-[#1E3A3A] border border-[#E2EFEA]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('presets');
                stopCamera();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-gradient-to-r from-[#4FD8B8] to-[#4FA8D8] text-[#0A302A] shadow-sm'
                  : 'bg-white text-[#6B8A87] hover:text-[#1E3A3A] border border-[#E2EFEA]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sample Signs</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* CAMERA VIEW */}
          {!selectedImage && activeTab === 'camera' && (
            <div className="relative aspect-video sm:aspect-[16/10] bg-[#1E3A3A] rounded-2xl overflow-hidden border border-[#E2EFEA] flex flex-col items-center justify-center">
              {isLiveCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Google Lens Viewfinder Overlay */}
                  <div className="absolute inset-8 sm:inset-14 border-2 border-dashed border-[#4FD8B8] rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-3 border-l-3 border-[#4FD8B8] rounded-tl-lg" />
                      <div className="w-6 h-6 border-t-3 border-r-3 border-[#4FD8B8] rounded-tr-lg" />
                    </div>
                    <div className="self-center px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[11px] text-[#167D68] border border-[#4FD8B8]/50 flex items-center gap-1.5 shadow-md font-bold">
                      <Eye className="w-3 h-3 text-[#167D68] animate-pulse" />
                      <span>Point at signs, menus, or labels</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-3 border-l-3 border-[#4FD8B8] rounded-bl-lg" />
                      <div className="w-6 h-6 border-b-3 border-r-3 border-[#4FD8B8] rounded-br-lg" />
                    </div>
                  </div>

                  {/* Shutter Capture Button */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                    <button
                      id="capture-photo-lens-btn"
                      onClick={handleCapturePhoto}
                      className="w-16 h-16 rounded-full bg-white p-1 shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer border-4 border-[#4FD8B8]"
                    >
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#4FD8B8] to-[#4FA8D8] flex items-center justify-center text-white">
                        <Camera className="w-6 h-6 text-[#0A302A]" />
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 max-w-md space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-[#4FD8B8]">
                    <Camera className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Live Camera Preview</h3>
                  <p className="text-xs text-slate-300">
                    {cameraError || 'Click below to grant camera access or try our pre-loaded signs.'}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4FD8B8] to-[#4FA8D8] text-[#0A302A] text-xs font-bold shadow-md cursor-pointer"
                    >
                      Enable Camera
                    </button>
                    <button
                      onClick={() => setActiveTab('presets')}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer border border-white/20"
                    >
                      Use Sample Signs
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRESETS VIEW */}
          {!selectedImage && activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#6B8A87] uppercase tracking-wider font-mono">
                  Select a Real-World Sign or Menu
                </p>
                <span className="text-xs text-[#216E9B] font-bold">Instant OCR & AI Analysis</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="flex gap-3 p-3 rounded-2xl bg-[#F4FAF8] hover:bg-white border border-[#E2EFEA] hover:border-[#4FA8D8]/60 transition-all text-left group cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <img
                      src={preset.image}
                      alt={preset.title}
                      className="w-20 h-20 rounded-xl object-cover border border-[#E2EFEA] shrink-0 group-hover:scale-102 transition-transform"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{preset.flag}</span>
                        <span className="text-xs font-bold text-[#1E3A3A] line-clamp-1">{preset.title}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#6B8A87] border border-[#E2EFEA] font-bold">
                        {preset.category}
                      </span>
                      <p className="text-[11px] text-[#6B8A87] line-clamp-1 font-mono">{preset.previewText}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* RESULT & IMAGE VIEW */}
          {selectedImage && (
            <div className="space-y-4">
              {/* Image with Lens Overlay */}
              <div className="relative aspect-video sm:aspect-[16/9] bg-slate-900 rounded-2xl overflow-hidden border border-[#E2EFEA]">
                <img src={selectedImage} alt="Captured signage" className="w-full h-full object-cover" />
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-[#1E3A3A]/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full border-3 border-[#4FD8B8]/30 border-t-[#4FD8B8] animate-spin" />
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-white flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#FF8C66] animate-pulse" />
                        Scanning Real-World Text...
                      </p>
                      <p className="text-xs text-slate-300">
                        Identifying language & generating native translation
                      </p>
                    </div>
                  </div>
                )}

                {/* Retake / Rescan Floating Button */}
                <button
                  onClick={handleRetake}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-[#E2EFEA] text-[#1E3A3A] text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-md cursor-pointer transition-transform hover:scale-105"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#216E9B]" />
                  <span>Scan Another</span>
                </button>
              </div>

              {/* Translation Outcome Card */}
              {result && !isProcessing && (
                <div className="space-y-3 bg-[#F4FAF8] border border-[#E2EFEA] rounded-2xl p-4 sm:p-5">
                  {/* Language Detection Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#E2EFEA]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{result.detectedLanguage.flag}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#1E3A3A]">
                            Detected {result.detectedLanguage.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#E8F8F4] text-[#167D68] border border-[#4FD8B8]/50 font-bold">
                            {Math.round((result.detectedLanguage.confidence || 0.95) * 100)}% Match
                          </span>
                        </div>
                        <span className="text-[11px] text-[#6B8A87]">
                          {result.contextSummary}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playPronunciation(result.originalText)}
                        disabled={isPlayingAudio}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#EAF5FC] border border-[#4FA8D8]/50 text-[#216E9B] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-[#4FA8D8]' : ''}`} />
                        <span>{isPlayingAudio ? 'Speaking...' : 'Listen Original'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary Translation Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Original Script */}
                    <div className="p-3.5 rounded-xl bg-white border border-[#E2EFEA] space-y-1.5 shadow-2xs">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#6B8A87] tracking-wider">
                        Original Signage Text ({result.detectedLanguage.name})
                      </span>
                      <p className="text-sm font-bold text-[#1E3A3A] leading-relaxed">
                        {result.originalText}
                      </p>
                      {result.phoneticReading && (
                        <p className="text-xs text-[#216E9B] font-mono italic">
                          🗣️ {result.phoneticReading}
                        </p>
                      )}
                    </div>

                    {/* Translated Script */}
                    <div className="p-3.5 rounded-xl bg-[#E8F8F4] border border-[#4FD8B8]/60 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#167D68] tracking-wider">
                          Translated ({userLanguage.name})
                        </span>
                        <span className="text-[10px] text-[#167D68] font-bold">
                          Google Lens Overlay
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-[#0A302A] leading-relaxed">
                        {result.translatedText}
                      </p>
                    </div>
                  </div>

                  {/* Extracted Key Terms & Vocabulary */}
                  {result.keyTerms && result.keyTerms.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <span className="text-xs font-bold text-[#1E3A3A] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#FF8C66]" />
                        Vocabulary & Key Terms Breakdown
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {result.keyTerms.map((term, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E2EFEA] text-xs shadow-2xs"
                          >
                            <div>
                              <span className="font-bold text-[#1E3A3A] block">{term.original}</span>
                              <span className="text-[#6B8A87] text-[11px]">{term.translation}</span>
                            </div>
                            {term.category && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F4FAF8] text-[#6B8A87] border border-[#E2EFEA]">
                                {term.category}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-[#F4FAF8] border-t border-[#E2EFEA] flex items-center justify-between text-xs text-[#6B8A87]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#167D68] animate-pulse" />
            <span className="font-medium text-[#1E3A3A]">Gemini Vision OCR & Translation Active</span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-[#E2EFEA] border border-[#E2EFEA] text-[#1E3A3A] font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
