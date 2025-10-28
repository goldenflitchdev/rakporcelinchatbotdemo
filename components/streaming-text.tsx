'use client';

import { useState, useEffect, useRef } from 'react';

export interface StreamingTextProps {
  text: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
  isStreaming?: boolean; // For live streaming updates
  className?: string;
}

export function StreamingText({
  text,
  speed = 20,
  onComplete,
  isStreaming = false,
  className = '',
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const indexRef = useRef(0);
  const previousTextRef = useRef('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If text changed (new chunk arrived in streaming mode)
    if (text !== previousTextRef.current) {
      previousTextRef.current = text;

      // If we're in the middle of typing and new text arrives (streaming)
      if (isStreaming) {
        // Just update to show the new text immediately up to current index
        // and continue typing from where we were
        if (indexRef.current > text.length) {
          indexRef.current = text.length;
        }
      } else {
        // New message, start from beginning
        indexRef.current = 0;
        setDisplayedText('');
      }
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start typing animation
    if (indexRef.current < text.length) {
      setShowCursor(true);

      intervalRef.current = setInterval(() => {
        if (indexRef.current < text.length) {
          indexRef.current++;
          setDisplayedText(text.substring(0, indexRef.current));
        } else {
          // Typing complete
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          // Keep cursor blinking for a moment, then hide
          setTimeout(() => {
            setShowCursor(false);
            if (onComplete && !isStreaming) {
              onComplete();
            }
          }, 500);
        }
      }, speed);
    } else if (!isStreaming) {
      // Text is already fully displayed
      setDisplayedText(text);
      setShowCursor(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, onComplete, isStreaming]);

  return (
    <span className={`inline ${className}`}>
      {displayedText}
      {showCursor && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse align-middle">
          ▌
        </span>
      )}
    </span>
  );
}

export default StreamingText;

