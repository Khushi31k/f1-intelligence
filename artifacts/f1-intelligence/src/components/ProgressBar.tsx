import React, { useState, useEffect } from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  totalBlocks?: number;
  char?: string;
  emptyChar?: string;
  label?: string;
  className?: string;
}

export function ProgressBar({ 
  value, 
  totalBlocks = 20, 
  char = "█", 
  emptyChar = "░",
  label,
  className = ""
}: ProgressBarProps) {
  const filledBlocks = Math.round((Math.max(0, Math.min(100, value)) / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  
  const filledStr = Array(filledBlocks).fill(char).join("");
  const emptyStr = Array(emptyBlocks).fill(emptyChar).join("");

  return (
    <div className={`font-mono text-primary flex items-center gap-2 ${className}`}>
      {label && <span className="uppercase text-xs tracking-wider min-w-[100px]">{label}</span>}
      <span>[</span>
      <span className="tracking-tight">{filledStr}{emptyStr}</span>
      <span>]</span>
      <span className="text-xs min-w-[4ch] text-right">{Math.round(value)}%</span>
    </div>
  );
}
