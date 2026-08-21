/**
 * Audio utilities for 16kHz PCM recording and 24kHz PCM playback with Gemini Live API.
 */

// Convert Float32Array to 16-bit PCM ArrayBuffer
export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true); // true = little-endian
  }
  return buffer;
}

// Convert ArrayBuffer to base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert base64 to 16-bit PCM Float32Array (for 24kHz playback)
export function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 32768 : 32767);
  }
  return float32Array;
}

export class LiveAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private analyser: AnalyserNode | null = null;
  private onLevelUpdate?: (level: number) => void;
  private animFrameId: number | null = null;

  constructor(onLevelUpdate?: (level: number) => void) {
    this.onLevelUpdate = onLevelUpdate;
  }

  private initContext() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 24000 });
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.audioCtx.destination);
      this.nextStartTime = 0;
      this.startLevelLoop();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private startLevelLoop() {
    if (!this.analyser || !this.onLevelUpdate) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const update = () => {
      if (this.analyser && this.onLevelUpdate) {
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        this.onLevelUpdate(avg);
      }
      this.animFrameId = requestAnimationFrame(update);
    };
    this.animFrameId = requestAnimationFrame(update);
  }

  public playChunk(base64Audio: string) {
    try {
      this.initContext();
      if (!this.audioCtx || !this.analyser) return;

      const float32Data = base64ToFloat32Array(base64Audio);
      if (float32Data.length === 0) return;

      const audioBuffer = this.audioCtx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = this.audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);

      const currentTime = this.audioCtx.currentTime;
      // Gapless scheduling
      const startTime = Math.max(currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
      };
    } catch (err) {
      console.error('Error playing audio chunk:', err);
    }
  }

  public stopAndClear() {
    this.activeSources.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore already stopped sources
      }
    });
    this.activeSources = [];
    if (this.audioCtx) {
      this.nextStartTime = this.audioCtx.currentTime;
    }
    if (this.onLevelUpdate) {
      this.onLevelUpdate(0);
    }
  }

  public isPlaying(): boolean {
    return this.activeSources.length > 0;
  }

  public close() {
    this.stopAndClear();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

export class LiveAudioRecorder {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private onAudioData: (base64Pcm16k: string) => void;
  private onLevelUpdate?: (level: number) => void;
  private isRecording: boolean = false;
  private animFrameId: number | null = null;

  constructor(
    onAudioData: (base64Pcm16k: string) => void,
    onLevelUpdate?: (level: number) => void
  ) {
    this.onAudioData = onAudioData;
    this.onLevelUpdate = onLevelUpdate;
  }

  public async start(): Promise<void> {
    if (this.isRecording) return;

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioCtxClass({ sampleRate: 16000 });

    this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 256;

    // 4096 buffer size at 16kHz is ~256ms chunk
    this.processorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);

    this.processorNode.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16Buffer = floatTo16BitPCM(inputData);
      const base64 = arrayBufferToBase64(pcm16Buffer);
      this.onAudioData(base64);
    };

    this.sourceNode.connect(this.analyserNode);
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(this.audioCtx.destination);

    this.isRecording = true;
    this.startLevelLoop();
  }

  private startLevelLoop() {
    if (!this.analyserNode || !this.onLevelUpdate) return;
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const update = () => {
      if (this.analyserNode && this.onLevelUpdate && this.isRecording) {
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        this.onLevelUpdate(avg);
      }
      if (this.isRecording) {
        this.animFrameId = requestAnimationFrame(update);
      }
    };
    this.animFrameId = requestAnimationFrame(update);
  }

  public stop(): void {
    this.isRecording = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.onLevelUpdate) {
      this.onLevelUpdate(0);
    }
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  public get recording(): boolean {
    return this.isRecording;
  }
}

/**
 * Dedicated Voice Clip Recorder for Push-to-Talk / Voice Messaging
 * Captures a clean audio clip with live amplitude metering and returns base64 audio data.
 */
export class VoiceClipRecorder {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioCtx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private onLevelUpdate?: (level: number) => void;
  private isRecording: boolean = false;
  private mimeType: string = 'audio/webm';

  constructor(onLevelUpdate?: (level: number) => void) {
    this.onLevelUpdate = onLevelUpdate;
  }

  public async start(): Promise<void> {
    if (this.isRecording) return;
    this.audioChunks = [];

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Detect supported mimeType
    let selectedMime = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(selectedMime)) {
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        selectedMime = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        selectedMime = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        selectedMime = 'audio/ogg';
      } else {
        selectedMime = '';
      }
    }
    this.mimeType = selectedMime || 'audio/webm';

    this.mediaRecorder = selectedMime
      ? new MediaRecorder(this.mediaStream, { mimeType: selectedMime })
      : new MediaRecorder(this.mediaStream);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    };

    // Metering AudioContext
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioCtxClass();
    this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.sourceNode.connect(this.analyserNode);

    this.mediaRecorder.start(100);
    this.isRecording = true;
    this.startLevelLoop();
  }

  private startLevelLoop() {
    if (!this.analyserNode || !this.onLevelUpdate) return;
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const update = () => {
      if (this.analyserNode && this.onLevelUpdate && this.isRecording) {
        this.analyserNode.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        this.onLevelUpdate(avg);
      }
      if (this.isRecording) {
        this.animFrameId = requestAnimationFrame(update);
      }
    };
    this.animFrameId = requestAnimationFrame(update);
  }

  public async stop(): Promise<{ base64: string; mimeType: string; blob: Blob } | null> {
    if (!this.isRecording || !this.mediaRecorder) {
      this.cleanup();
      return null;
    }

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mimeType || 'audio/webm',
        });
        this.cleanup();

        if (audioBlob.size < 100) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1] || '';
          resolve({
            base64: base64Data,
            mimeType: this.mimeType || 'audio/webm',
            blob: audioBlob,
          });
        };
        reader.readAsDataURL(audioBlob);
      };

      try {
        this.mediaRecorder!.stop();
      } catch (e) {
        this.cleanup();
        resolve(null);
      }
    });
  }

  public cancel(): void {
    this.cleanup();
  }

  private cleanup(): void {
    this.isRecording = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.onLevelUpdate) {
      this.onLevelUpdate(0);
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    this.audioChunks = [];
  }

  public get recording(): boolean {
    return this.isRecording;
  }
}

