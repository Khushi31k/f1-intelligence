import React, { useState, useEffect } from 'react';

interface TerminalTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  delay?: number;
  showCursor?: boolean;
  cursorChar?: string;
}

export function TerminalText({ 
  text, 
  speed = 30, 
  onComplete, 
  className = "", 
  delay = 0,
  showCursor = true,
  cursorChar = "█"
}: TerminalTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (!started) {
      timeout = setTimeout(() => {
        setStarted(true);
        setIsTyping(true);
      }, delay);
      return () => clearTimeout(timeout);
    }

    if (isTyping && displayedText.length < text.length) {
      timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed + (Math.random() * 20)); // slight randomization for realism
      return () => clearTimeout(timeout);
    } else if (isTyping && displayedText.length === text.length) {
      setIsTyping(false);
      if (onComplete) onComplete();
    }
  }, [displayedText, isTyping, text, speed, onComplete, started, delay]);

  return (
    <span className={className}>
      {displayedText}
      {(isTyping || showCursor) && (
        <span className={`${!isTyping ? 'blink' : ''} ml-1 inline-block w-2 bg-primary/80`}>{cursorChar}</span>
      )}
    </span>
  );
}
