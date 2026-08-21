import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ConversationVisualState,
  InteractionMode,
  Language,
  LiveTranscriptItem,
  LiveVoiceStatus,
  ProficiencyLevel,
  Scenario,
  SilentCorrection,
  KeyPhraseAchievement,
} from '../types';
import { LiveAudioPlayer, LiveAudioRecorder, VoiceClipRecorder } from '../utils/audio';

interface UseLiveVoiceProps {
  scenario: Scenario;
  language: Language;
  level: ProficiencyLevel;
  interactionMode?: InteractionMode;
}

export function useLiveVoice({
  scenario,
  language,
  level,
  interactionMode = 'speech-to-speech',
}: UseLiveVoiceProps) {
  const [status, setStatus] = useState<LiveVoiceStatus>({
    isConnected: false,
    isConnecting: false,
    isRecording: false,
    isAiSpeaking: false,
    isMuted: false,
    isThinking: false,
    visualState: 'idle',
    audioInputLevel: 0,
    audioOutputLevel: 0,
    error: null,
  });

  const [currentMode, setCurrentMode] = useState<InteractionMode>(interactionMode);
  const [transcript, setTranscript] = useState<LiveTranscriptItem[]>([]);
  const [corrections, setCorrections] = useState<SilentCorrection[]>([]);
  const [keyPhrasesAchieved, setKeyPhrasesAchieved] = useState<KeyPhraseAchievement[]>([]);

  // Push-to-record voice message state for speech-to-text mode
  const [isRecordingVoiceClip, setIsRecordingVoiceClip] = useState<boolean>(false);
  const [recordingDurationSeconds, setRecordingDurationSeconds] = useState<number>(0);
  const recordingTimerRef = useRef<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<LiveAudioRecorder | null>(null);
  const voiceClipRecorderRef = useRef<VoiceClipRecorder | null>(null);
  const playerRef = useRef<LiveAudioPlayer | null>(null);
  const currentModeRef = useRef<InteractionMode>(interactionMode);

  // Sync mode ref
  useEffect(() => {
    currentModeRef.current = currentMode;
  }, [currentMode]);

  useEffect(() => {
    setCurrentMode(interactionMode);
    currentModeRef.current = interactionMode;
  }, [interactionMode]);

  const currentAiMsgRef = useRef<string>('');
  const currentUserMsgRef = useRef<string>('');

  // Audio player level callback
  const handleOutputLevel = useCallback((levelVal: number) => {
    setStatus((prev) => {
      const isAiSpeaking = levelVal > 0.03;
      let nextVisualState: ConversationVisualState = prev.visualState;

      if (isAiSpeaking) {
        nextVisualState = 'speaking';
      } else if (prev.isMuted) {
        nextVisualState = 'muted';
      } else if (prev.isRecording && currentModeRef.current === 'speech-to-speech') {
        nextVisualState = 'listening';
      }

      return {
        ...prev,
        audioOutputLevel: levelVal,
        isAiSpeaking,
        visualState: nextVisualState,
      };
    });
  }, []);

  // Audio recorder input level callback
  const handleInputLevel = useCallback((levelVal: number) => {
    setStatus((prev) => {
      if (prev.isAiSpeaking) return prev; // AI speech takes visual priority

      let nextVisualState: ConversationVisualState = prev.visualState;
      if (prev.isMuted) {
        nextVisualState = 'muted';
      } else if (prev.isConnected || isRecordingVoiceClip) {
        nextVisualState = 'listening';
      }

      return {
        ...prev,
        audioInputLevel: levelVal,
        visualState: nextVisualState,
      };
    });
  }, [isRecordingVoiceClip]);

  // Start live session
  const startSession = useCallback(async (overrideMode?: InteractionMode) => {
    const activeMode = overrideMode || currentModeRef.current;
    setCurrentMode(activeMode);
    currentModeRef.current = activeMode;

    setStatus((prev) => ({
      ...prev,
      isConnecting: true,
      visualState: 'connecting',
      error: null,
    }));
    setTranscript([]);
    setCorrections([]);
    setKeyPhrasesAchieved([]);
    currentAiMsgRef.current = '';
    currentUserMsgRef.current = '';

    // Initialize Audio Player
    if (!playerRef.current) {
      playerRef.current = new LiveAudioPlayer(handleOutputLevel);
    } else {
      playerRef.current.stopAndClear();
    }

    // Initialize Voice Clip Recorder for speech-to-text recording mode
    if (!voiceClipRecorderRef.current) {
      voiceClipRecorderRef.current = new VoiceClipRecorder(handleInputLevel);
    }

    // For Speech-to-Speech mode, connect to full-duplex live WebSocket
    if (activeMode === 'speech-to-speech') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('Connected to /live speech server with mode:', activeMode);
        setStatus((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          visualState: 'listening',
          error: null,
        }));

        ws.send(
          JSON.stringify({
            type: 'start_session',
            scenario,
            language,
            level,
            voice: scenario.audioProfile.voice || language.defaultVoice,
            interactionMode: activeMode,
          })
        );

        try {
          if (!recorderRef.current) {
            recorderRef.current = new LiveAudioRecorder((base64Pcm) => {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({
                    type: 'audio_chunk',
                    audio: base64Pcm,
                  })
                );
              }
            }, handleInputLevel);
          }
          await recorderRef.current.start();
          setStatus((prev) => ({
            ...prev,
            isRecording: true,
            visualState: 'listening',
          }));
        } catch (micErr: any) {
          console.warn('Microphone permission not granted:', micErr);
          setStatus((prev) => ({
            ...prev,
            error: 'Microphone permission required for Speech-to-Speech live mode.',
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ai_audio' && data.audio) {
            playerRef.current?.playChunk(data.audio);
          }

          if (data.type === 'ai_text_chunk' && data.text) {
            currentAiMsgRef.current += data.text;
            const fullText = currentAiMsgRef.current;
            setTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'model' && !last.isFinal) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: fullText, timestamp: Date.now() },
                ];
              }
              return [
                ...prev,
                {
                  id: 'ai-' + Date.now(),
                  speaker: 'model',
                  text: fullText,
                  isFinal: false,
                  timestamp: Date.now(),
                },
              ];
            });
          }

          if (data.type === 'ai_turn_complete') {
            const finalAiText = currentAiMsgRef.current;
            currentAiMsgRef.current = '';
            setTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'model') {
                return [...prev.slice(0, -1), { ...last, text: finalAiText, isFinal: true }];
              }
              return prev;
            });
          }

          if (data.type === 'user_text_chunk' && data.text) {
            currentUserMsgRef.current += data.text;
            const fullUserText = currentUserMsgRef.current;
            setTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'user' && !last.isFinal) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: fullUserText, timestamp: Date.now() },
                ];
              }
              return [
                ...prev,
                {
                  id: 'user-' + Date.now(),
                  speaker: 'user',
                  text: fullUserText,
                  isFinal: false,
                  timestamp: Date.now(),
                },
              ];
            });
          }

          if (data.type === 'user_turn_complete') {
            const finalUserText = currentUserMsgRef.current;
            currentUserMsgRef.current = '';
            setTranscript((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.speaker === 'user') {
                return [...prev.slice(0, -1), { ...last, text: finalUserText, isFinal: true }];
              }
              return prev;
            });
          }

          if (data.type === 'silent_correction' && data.correction) {
            setCorrections((prev) => {
              if (prev.some((c) => c.correction === data.correction.correction)) {
                return prev;
              }
              return [data.correction, ...prev];
            });
          }

          if (data.type === 'key_phrase_achievement' && data.phrase) {
            setKeyPhrasesAchieved((prev) => {
              if (prev.some((k) => k.phrase.toLowerCase() === data.phrase.toLowerCase())) {
                return prev;
              }
              return [...prev, { phrase: data.phrase, timestamp: Date.now() }];
            });
          }

          if (data.type === 'error') {
            setStatus((prev) => ({
              ...prev,
              error: data.error || 'Live speech error occurred',
              visualState: 'error',
            }));
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        setStatus((prev) => ({
          ...prev,
          isConnecting: false,
          visualState: 'error',
          error: 'Failed to connect to speech server. Please try again.',
        }));
      };

      ws.onclose = () => {
        setStatus((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          isRecording: false,
          isAiSpeaking: false,
          visualState: 'idle',
        }));
        recorderRef.current?.stop();
      };
    } else {
      // For Speech-to-Text (Recording), Text-to-Speech, and Text-to-Text modes:
      // Ready immediately for turn-based interaction without open continuous call!
      setStatus((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        isRecording: false,
        isAiSpeaking: false,
        visualState: 'idle',
        error: null,
      }));

      // Add character's opening line or welcoming prompt
      const sampleGreeting = language.sampleGreeting || 'Hello';
      const initialOpening: LiveTranscriptItem = {
        id: 'ai-init-' + Date.now(),
        speaker: 'model',
        text: `${sampleGreeting}! I'm ${scenario.audioProfile.name}. Welcome to ${scenario.title}.`,
        translation: `Hello! I'm ${scenario.audioProfile.name}. Welcome to ${scenario.title}.`,
        isFinal: true,
        timestamp: Date.now(),
      };
      setTranscript([initialOpening]);

      // If text-to-speech mode, speak initial opening line
      if (activeMode === 'text-to-speech') {
        try {
          const ttsRes = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: initialOpening.text,
              voice: scenario.audioProfile.voice || language.defaultVoice,
            }),
          });
          if (ttsRes.ok) {
            const { audio } = await ttsRes.json();
            if (audio) {
              playerRef.current?.playChunk(audio);
            }
          }
        } catch (e) {
          // ignore tts error
        }
      }
    }
  }, [scenario, language, level, handleInputLevel, handleOutputLevel]);

  // Stop session
  const stopSession = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_session' }));
      wsRef.current.close();
    }
    recorderRef.current?.stop();
    voiceClipRecorderRef.current?.cancel();
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVoiceClip(false);
    setRecordingDurationSeconds(0);
    playerRef.current?.stopAndClear();
    setStatus((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      isRecording: false,
      isAiSpeaking: false,
      visualState: 'idle',
      audioInputLevel: 0,
      audioOutputLevel: 0,
    }));
  }, []);

  // ----------------------------------------------------
  // Speech-to-Text: Push-to-Talk Voice Clip Recording Flow
  // ----------------------------------------------------
  const startRecordingVoiceClip = useCallback(async () => {
    try {
      if (!voiceClipRecorderRef.current) {
        voiceClipRecorderRef.current = new VoiceClipRecorder(handleInputLevel);
      }
      await voiceClipRecorderRef.current.start();
      setIsRecordingVoiceClip(true);
      setRecordingDurationSeconds(0);
      setStatus((prev) => ({
        ...prev,
        isRecording: true,
        visualState: 'listening',
        error: null,
      }));

      // Start duration timer
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDurationSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone recording error:', err);
      setStatus((prev) => ({
        ...prev,
        error: 'Microphone permission denied. Please allow microphone access to record voice messages.',
      }));
    }
  }, [handleInputLevel]);

  const stopAndSendVoiceClip = useCallback(async () => {
    if (!voiceClipRecorderRef.current || !isRecordingVoiceClip) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVoiceClip(false);
    setStatus((prev) => ({
      ...prev,
      isRecording: false,
      isThinking: true,
      visualState: 'thinking',
    }));

    const result = await voiceClipRecorderRef.current.stop();
    if (!result || !result.base64) {
      setStatus((prev) => ({ ...prev, isThinking: false, visualState: 'idle' }));
      return;
    }

    // Temporary placeholder while AI processes voice
    const tempUserId = 'user-temp-' + Date.now();
    setTranscript((prev) => [
      ...prev,
      {
        id: tempUserId,
        speaker: 'user',
        text: '🎤 Transcribing your speech...',
        isFinal: false,
        timestamp: Date.now(),
      },
    ]);

    try {
      const res = await fetch('/api/voice-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: result.base64,
          mimeType: result.mimeType,
          scenario,
          language,
          level,
          history: transcript.map((t) => ({ speaker: t.speaker, text: t.text })),
        }),
      });

      if (!res.ok) throw new Error('Voice recognition error');
      const data = await res.json();

      // Replace temporary user transcript with actual transcription
      setTranscript((prev) => {
        const withoutTemp = prev.filter((p) => p.id !== tempUserId);
        return [
          ...withoutTemp,
          {
            id: 'user-' + Date.now(),
            speaker: 'user',
            text: data.userTranscription || 'Voice message',
            translation: data.userTranslation,
            isFinal: true,
            timestamp: Date.now(),
          },
          {
            id: 'ai-' + (Date.now() + 1),
            speaker: 'model',
            text: data.aiResponse || 'Response received.',
            translation: data.aiTranslation,
            isFinal: true,
            timestamp: Date.now() + 1,
          },
        ];
      });

      // Append silent corrections
      if (data.silentCorrections && Array.isArray(data.silentCorrections)) {
        setCorrections((prev) => {
          const newOnes = data.silentCorrections.map((c: any) => ({
            id: 'corr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
            timestamp: Date.now(),
            userSaid: c.userSaid,
            issue: c.issue,
            correction: c.correction,
            tip: c.tip,
          }));
          return [...newOnes, ...prev];
        });
      }

      // Append key phrases
      if (data.keyPhrasesAchieved && Array.isArray(data.keyPhrasesAchieved)) {
        setKeyPhrasesAchieved((prev) => {
          const existing = new Set(prev.map((k) => k.phrase.toLowerCase()));
          const added = data.keyPhrasesAchieved
            .filter((p: string) => !existing.has(p.toLowerCase()))
            .map((phrase: string) => ({ phrase, timestamp: Date.now() }));
          return [...prev, ...added];
        });
      }
    } catch (e: any) {
      console.error('Voice turn processing failed:', e);
      setTranscript((prev) =>
        prev.map((p) =>
          p.id === tempUserId
            ? {
                ...p,
                text: 'Speech recorded (analyzed in coaching report)',
                isFinal: true,
              }
            : p
        )
      );
    } finally {
      setStatus((prev) => ({
        ...prev,
        isThinking: false,
        visualState: 'idle',
      }));
    }
  }, [isRecordingVoiceClip, scenario, language, level, transcript]);

  const cancelRecordingVoiceClip = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    voiceClipRecorderRef.current?.cancel();
    setIsRecordingVoiceClip(false);
    setRecordingDurationSeconds(0);
    setStatus((prev) => ({
      ...prev,
      isRecording: false,
      visualState: 'idle',
    }));
  }, []);

  // ----------------------------------------------------
  // Text message sender (Text-to-Speech, Text-to-Text & Cheat Sheet)
  // ----------------------------------------------------
  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userText = text.trim();
      const userItem: LiveTranscriptItem = {
        id: 'user-' + Date.now(),
        speaker: 'user',
        text: userText,
        isFinal: true,
        timestamp: Date.now(),
      };

      setTranscript((prev) => [...prev, userItem]);

      // If connected via live WebSocket (e.g. Speech-to-Speech)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'send_text', text: userText }));
        return;
      }

      // Otherwise, turn-based REST chat turn
      setStatus((prev) => ({ ...prev, isThinking: true, visualState: 'thinking' }));

      try {
        const res = await fetch('/api/chat-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: userText,
            scenario,
            language,
            level,
            history: transcript.map((t) => ({ speaker: t.speaker, text: t.text })),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const aiItem: LiveTranscriptItem = {
            id: 'ai-' + Date.now(),
            speaker: 'model',
            text: data.aiResponse || 'Response received.',
            translation: data.aiTranslation,
            isFinal: true,
            timestamp: Date.now(),
          };

          setTranscript((prev) => [...prev, aiItem]);

          // In Text-to-Speech mode, play audio of response
          if (currentModeRef.current === 'text-to-speech') {
            try {
              const ttsRes = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: data.aiResponse,
                  voice: scenario.audioProfile.voice || language.defaultVoice,
                }),
              });
              if (ttsRes.ok) {
                const { audio } = await ttsRes.json();
                if (audio) {
                  playerRef.current?.playChunk(audio);
                }
              }
            } catch (e) {
              // ignore tts error
            }
          }

          // Append silent corrections
          if (data.silentCorrections && Array.isArray(data.silentCorrections)) {
            setCorrections((prev) => {
              const newOnes = data.silentCorrections.map((c: any) => ({
                id: 'corr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                timestamp: Date.now(),
                userSaid: c.userSaid,
                issue: c.issue,
                correction: c.correction,
                tip: c.tip,
              }));
              return [...newOnes, ...prev];
            });
          }

          // Append key phrases
          if (data.keyPhrasesAchieved && Array.isArray(data.keyPhrasesAchieved)) {
            setKeyPhrasesAchieved((prev) => {
              const existing = new Set(prev.map((k) => k.phrase.toLowerCase()));
              const added = data.keyPhrasesAchieved
                .filter((p: string) => !existing.has(p.toLowerCase()))
                .map((phrase: string) => ({ phrase, timestamp: Date.now() }));
              return [...prev, ...added];
            });
          }
        }
      } catch (e) {
        console.error('Chat turn error:', e);
      } finally {
        setStatus((prev) => ({ ...prev, isThinking: false, visualState: 'idle' }));
      }
    },
    [scenario, language, level, transcript]
  );

  // Toggle Mute (for Live Speech-to-Speech mode)
  const toggleMute = useCallback(() => {
    setStatus((prev) => {
      const nextMuted = !prev.isMuted;
      if (nextMuted) {
        recorderRef.current?.stop();
      } else {
        recorderRef.current?.start();
      }
      return {
        ...prev,
        isMuted: nextMuted,
        isRecording: !nextMuted,
        visualState: nextMuted ? 'muted' : 'listening',
      };
    });
  }, []);

  // Change mode dynamically
  const switchInteractionMode = useCallback(
    async (newMode: InteractionMode) => {
      setCurrentMode(newMode);
      currentModeRef.current = newMode;

      if (newMode !== 'speech-to-speech') {
        // Stop live recorder if running
        recorderRef.current?.stop();
        setStatus((prev) => ({ ...prev, isRecording: false }));
      }

      if (newMode === 'speech-to-text' || newMode === 'text-to-text') {
        playerRef.current?.stopAndClear();
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'change_mode', mode: newMode }));
      }
    },
    []
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      voiceClipRecorderRef.current?.cancel();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      playerRef.current?.close();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    status,
    currentMode,
    transcript,
    corrections,
    keyPhrasesAchieved,
    isRecordingVoiceClip,
    recordingDurationSeconds,
    startRecordingVoiceClip,
    stopAndSendVoiceClip,
    cancelRecordingVoiceClip,
    startSession,
    stopSession,
    sendTextMessage,
    toggleMute,
    switchInteractionMode,
  };
}
