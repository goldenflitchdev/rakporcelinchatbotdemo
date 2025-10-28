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
      intervalRef.current = setInterval(() => {
        if (indexRef.current < text.length) {
          indexRef.current++;
          setDisplayedText(text.substring(0, indexRef.current));
        } else {
          // Typing complete
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          if (onComplete && !isStreaming) {
            onComplete();
          }
        }
      }, speed);
    } else if (!isStreaming) {
      // Text is already fully displayed
      setDisplayedText(text);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [text, speed, onComplete, isStreaming]);

  return (
    <span className={`inline-block ${className}`} style={{ whiteSpace: 'pre-wrap' }}>
      {displayedText}
    </span>
  );
}

export default StreamingText;

