import React from 'react';
import { LiveTranscriptItem } from '../types';

interface LiveTranscriptViewProps {
  transcript: LiveTranscriptItem[];
  characterName: string;
}

export const LiveTranscriptView: React.FC<LiveTranscriptViewProps> = ({
  transcript,
  characterName,
}) => {
  // Take last 3-4 items to prevent clutter and keep floating caption feel
  const visibleItems = transcript.slice(-3);

  if (visibleItems.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-center px-4">
        <p className="text-sm font-normal text-slate-500/80 animate-pulse tracking-wide font-sans">
          Listening... Speak in target language or wait for {characterName}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-6 flex flex-col items-center justify-end min-h-[110px] space-y-2 pointer-events-none select-none">
      {visibleItems.map((item, idx) => {
        const isLatest = idx === visibleItems.length - 1;
        const isSecondLatest = idx === visibleItems.length - 2;

        // Opacity and vertical drift calculation
        const opacityClass = isLatest
          ? 'opacity-100 scale-100'
          : isSecondLatest
          ? 'opacity-50 scale-95 -translate-y-1'
          : 'opacity-25 scale-90 -translate-y-2';

        return (
          <div
            key={item.id}
            className={`transition-all duration-500 ease-out text-center ${opacityClass}`}
          >
            <p
              className={`text-base sm:text-lg leading-relaxed font-normal tracking-wide drop-shadow-md ${
                item.speaker === 'model'
                  ? 'text-slate-100 font-medium'
                  : 'text-sky-300 font-normal italic'
              }`}
            >
              {item.text}
            </p>
          </div>
        );
      })}
    </div>
  );
};
