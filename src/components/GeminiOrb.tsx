import React, { useEffect, useRef } from 'react';
import { ConversationVisualState } from '../types';

interface GeminiOrbProps {
  visualState: ConversationVisualState;
  audioInputLevel: number;   // 0.0 to 1.0 (from microphone)
  audioOutputLevel: number;  // 0.0 to 1.0 (from AI speech)
  isMuted?: boolean;
}

export const GeminiOrb: React.FC<GeminiOrbProps> = ({
  visualState,
  audioInputLevel,
  audioOutputLevel,
  isMuted = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Organic blob physics parameters
  const timeRef = useRef<number>(0);
  const smoothedLevelRef = useRef<number>(0);
  const colorPhaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      timeRef.current += 0.02;

      // Target amplitude based on current state
      let targetLevel = 0;
      if (visualState === 'listening') {
        targetLevel = Math.max(0.12, Math.min(1.0, audioInputLevel * 2.8));
      } else if (visualState === 'speaking') {
        targetLevel = Math.max(0.2, Math.min(1.0, audioOutputLevel * 2.5));
      } else if (visualState === 'thinking') {
        targetLevel = 0.25 + 0.15 * Math.sin(timeRef.current * 3.5);
      } else if (visualState === 'connecting') {
        targetLevel = 0.15 + 0.1 * Math.sin(timeRef.current * 2);
      } else if (isMuted) {
        targetLevel = 0.05;
      } else {
        // Idle
        targetLevel = 0.08 + 0.05 * Math.sin(timeRef.current * 1.5);
      }

      // Smooth interpolation for spring-like physics
      smoothedLevelRef.current += (targetLevel - smoothedLevelRef.current) * 0.14;
      const amp = smoothedLevelRef.current;

      // Color phase advancement
      if (visualState === 'speaking') {
        colorPhaseRef.current += 0.025; // Faster rainbow shift when AI speaks
      } else if (visualState === 'listening') {
        colorPhaseRef.current += 0.015;
      } else {
        colorPhaseRef.current += 0.006;
      }

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.22;
      const dynamicRadius = baseRadius * (1 + amp * 0.45);

      // Color palettes based on Gemini Live states
      // State 1: Speaking (Gemini Aurora signature: Violet, Cyan, Amber, Magenta)
      // State 2: Listening (Electric Cyan, Cobalt Blue, White core)
      // State 3: Thinking (Shimmering Purple & Teal)
      // State 4: Connecting / Idle (Deep Indigo, Soft Blue)
      // State 5: Muted (Dim Slate Violet)

      let g1 = '#4f46e5'; // Indigo
      let g2 = '#06b6d4'; // Cyan
      let g3 = '#ec4899'; // Pink
      let g4 = '#8b5cf6'; // Violet

      if (visualState === 'speaking') {
        const p = colorPhaseRef.current;
        const r1 = Math.sin(p) * 0.5 + 0.5;
        const r2 = Math.cos(p * 0.8) * 0.5 + 0.5;
        g1 = `hsl(${260 + r1 * 40}, 90%, 65%)`; // Purple-Violet
        g2 = `hsl(${185 + r2 * 30}, 95%, 60%)`; // Vivid Cyan
        g3 = `hsl(${340 + r1 * 30}, 90%, 62%)`; // Rose/Coral
        g4 = `hsl(${45 + r2 * 25}, 95%, 60%)`;  // Amber Gold
      } else if (visualState === 'listening') {
        g1 = '#0284c7'; // Sky Blue
        g2 = '#06b6d4'; // Cyan
        g3 = '#3b82f6'; // Royal Blue
        g4 = '#67e8f9'; // Bright Cyan
      } else if (visualState === 'thinking') {
        g1 = '#9333ea'; // Purple
        g2 = '#0d9488'; // Teal
        g3 = '#6366f1'; // Indigo
        g4 = '#c084fc'; // Light Purple
      } else if (isMuted) {
        g1 = '#334155';
        g2 = '#1e293b';
        g3 = '#475569';
        g4 = '#0f172a';
      }

      // Layer 1: Ambient soft bloom aura
      const auraRadius = dynamicRadius * (1.8 + amp * 0.6);
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        dynamicRadius * 0.3,
        centerX,
        centerY,
        auraRadius
      );
      auraGradient.addColorStop(0, visualState === 'speaking' ? 'rgba(139, 92, 246, 0.35)' : 'rgba(6, 182, 212, 0.28)');
      auraGradient.addColorStop(0.5, visualState === 'speaking' ? 'rgba(236, 72, 153, 0.18)' : 'rgba(59, 130, 246, 0.15)');
      auraGradient.addColorStop(1, 'rgba(11, 12, 15, 0)');

      ctx.save();
      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Layer 2: Organic Morphing Blob Outer Shape
      const numPoints = 12;
      const angleStep = (Math.PI * 2) / numPoints;
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < numPoints; i++) {
        const angle = i * angleStep;
        // Wavy organic harmonics
        const freq1 = Math.sin(angle * 3 + timeRef.current * 2) * (15 + amp * 35);
        const freq2 = Math.cos(angle * 2 - timeRef.current * 1.6) * (10 + amp * 25);
        const freq3 = Math.sin(angle * 4 + timeRef.current * 3) * (6 + amp * 18);
        const r = dynamicRadius + freq1 + freq2 + freq3;

        points.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r,
        });
      }

      // Draw smooth cardinal curve around points
      ctx.save();
      ctx.beginPath();
      ctx.moveTo((points[0].x + points[points.length - 1].x) / 2, (points[0].y + points[points.length - 1].y) / 2);

      for (let i = 0; i < points.length; i++) {
        const nextIdx = (i + 1) % points.length;
        const midX = (points[i].x + points[nextIdx].x) / 2;
        const midY = (points[i].y + points[nextIdx].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }
      ctx.closePath();

      // Create rich fluid multi-stop gradient fill
      const blobGrad = ctx.createLinearGradient(
        centerX - dynamicRadius,
        centerY - dynamicRadius,
        centerX + dynamicRadius,
        centerY + dynamicRadius
      );
      blobGrad.addColorStop(0, g1);
      blobGrad.addColorStop(0.35, g2);
      blobGrad.addColorStop(0.7, g3);
      blobGrad.addColorStop(1, g4);

      ctx.fillStyle = blobGrad;
      ctx.shadowColor = g2;
      ctx.shadowBlur = 40 + amp * 60;
      ctx.fill();
      ctx.restore();

      // Layer 3: Inner Core Glow & Shimmer Highlight
      const coreRadius = dynamicRadius * (0.65 + amp * 0.2);
      const coreGradient = ctx.createRadialGradient(
        centerX - dynamicRadius * 0.25,
        centerY - dynamicRadius * 0.25,
        0,
        centerX,
        centerY,
        coreRadius
      );
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      coreGradient.addColorStop(0.3, visualState === 'speaking' ? 'rgba(244, 114, 182, 0.6)' : 'rgba(125, 211, 252, 0.65)');
      coreGradient.addColorStop(0.8, visualState === 'speaking' ? 'rgba(167, 139, 250, 0.3)' : 'rgba(56, 189, 248, 0.25)');
      coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.save();
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX - dynamicRadius * 0.1, centerY - dynamicRadius * 0.1, coreRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Layer 4: Voice Activity Particle Sparks (when speaking or listening)
      if (amp > 0.15) {
        const sparkCount = Math.floor(amp * 16);
        ctx.save();
        for (let s = 0; s < sparkCount; s++) {
          const sparkAngle = (s / sparkCount) * Math.PI * 2 + timeRef.current * 1.5;
          const sparkDistance = dynamicRadius * (1.05 + Math.sin(timeRef.current * 4 + s) * 0.25 * amp);
          const sx = centerX + Math.cos(sparkAngle) * sparkDistance;
          const sy = centerY + Math.sin(sparkAngle) * sparkDistance;
          const sparkSize = 2 + Math.random() * 3 * amp;

          ctx.fillStyle = s % 2 === 0 ? 'rgba(255, 255, 255, 0.75)' : g2;
          ctx.beginPath();
          ctx.arc(sx, sy, sparkSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [visualState, audioInputLevel, audioOutputLevel, isMuted]);

  return (
    <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center select-none pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full filter drop-shadow-[0_0_50px_rgba(59,130,246,0.35)]"
      />
    </div>
  );
};
