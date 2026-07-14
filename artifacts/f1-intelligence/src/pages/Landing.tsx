import React from 'react';
import { Link } from 'wouter';
import { TerminalText } from '../components/TerminalText';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-10 pb-20 relative">
      {/* Background Matrix Rain (Subtle) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10 flex justify-center opacity-mask">
        <div
          className="text-xs break-all font-mono leading-none flex text-primary/40 whitespace-pre-wrap select-none w-full max-w-7xl"
          aria-hidden
        >
          {Array.from({ length: 150 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col animate-[rain_10s_linear_infinite]"
              style={{
                animationDelay: `-${(i * 0.067) % 10}s`,
                animationDuration: `${5 + (i % 10)}s`,
              }}
            >
              {Array.from({ length: 40 }).map((_, j) => (
                <span key={j}>{(i + j) % 2 === 0 ? '1' : '0'}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center text-center z-10 w-full max-w-4xl relative px-4">
        {/* Track SVG animation */}
        <div className="relative w-64 h-64 mb-8 mx-auto opacity-80">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_15px_rgba(0,255,65,0.4)]"
          >
            <path
              id="track"
              d="M 20 50 C 20 20, 50 10, 80 30 C 90 40, 90 60, 70 80 C 40 100, 20 80, 20 50 Z"
              fill="none"
              stroke="rgba(0,255,65,0.2)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <path
              d="M 20 50 C 20 20, 50 10, 80 30 C 90 40, 90 60, 70 80 C 40 100, 20 80, 20 50 Z"
              fill="none"
              stroke="#00ff41"
              strokeWidth="2"
              strokeDasharray="100 200"
              className="animate-[dash_4s_linear_infinite]"
            />
            <circle
              r="3"
              fill="#00ff41"
              className="animate-[trace_4s_linear_infinite]"
              style={{
                offsetPath:
                  'path("M 20 50 C 20 20, 50 10, 80 30 C 90 40, 90 60, 70 80 C 40 100, 20 80, 20 50 Z")',
              } as React.CSSProperties}
            />
            <circle
              r="2"
              fill="#ff3131"
              className="animate-[trace_4.2s_linear_infinite]"
              style={{
                offsetPath:
                  'path("M 20 50 C 20 20, 50 10, 80 30 C 90 40, 90 60, 70 80 C 40 100, 20 80, 20 50 Z")',
              } as React.CSSProperties}
            />
            <circle
              r="2"
              fill="#ffb700"
              className="animate-[trace_4.5s_linear_infinite]"
              style={{
                offsetPath:
                  'path("M 20 50 C 20 20, 50 10, 80 30 C 90 40, 90 60, 70 80 C 40 100, 20 80, 20 50 Z")',
              } as React.CSSProperties}
            />
          </svg>
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes trace { 0% { offset-distance: 0%; } 100% { offset-distance: 100%; } }
            @keyframes dash { to { stroke-dashoffset: -300; } }
            @keyframes rain { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
            .opacity-mask { mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent); }
          `,
            }}
          />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-primary glow-text mb-4 uppercase">
          F1 INTELLIGENCE
        </h1>

        <div className="h-8 mb-10 text-lg md:text-xl text-primary/80 tracking-widest uppercase">
          <TerminalText
            text="AI-POWERED FORMULA ONE PREDICTION & ANALYTICS"
            speed={30}
            delay={500}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <Link
            href="/dashboard"
            className="border border-primary bg-primary/10 text-primary px-8 py-4 text-xl font-bold uppercase tracking-widest hover:bg-primary hover:text-background transition-all glow hover:shadow-[0_0_20px_rgba(0,255,65,0.6)] group"
          >
            GET STARTED{' '}
            <span className="inline-block group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
          <Link
            href="/how-it-works"
            className="text-primary/60 hover:text-primary hover:glow-text transition-colors uppercase tracking-widest text-sm border-b border-transparent hover:border-primary pb-1"
          >
            HOW IT WORKS
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl text-left border-t border-primary/20 pt-12">
          <div className="flex flex-col gap-2 p-4 border border-primary/10 bg-background/50 hover:border-primary/50 transition-colors">
            <span className="text-xs opacity-50">[01]</span>
            <h3 className="text-primary font-bold uppercase tracking-wider">
              Predictive Models
            </h3>
            <p className="text-sm opacity-70">
              Utilizing XGBoost algorithms trained on historical race data to
              predict podium finishes.
            </p>
          </div>
          <div className="flex flex-col gap-2 p-4 border border-primary/10 bg-background/50 hover:border-primary/50 transition-colors">
            <span className="text-xs opacity-50">[02]</span>
            <h3 className="text-primary font-bold uppercase tracking-wider">
              Deep Analytics
            </h3>
            <p className="text-sm opacity-70">
              Interactive data visualizations exploring driver performance,
              constructor points, and circuit statistics.
            </p>
          </div>
          <div className="flex flex-col gap-2 p-4 border border-primary/10 bg-background/50 hover:border-primary/50 transition-colors">
            <span className="text-xs opacity-50">[03]</span>
            <h3 className="text-primary font-bold uppercase tracking-wider">
              Feature Insights
            </h3>
            <p className="text-sm opacity-70">
              Understand why the model makes its decisions through feature
              importance tracking and strategy notes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
