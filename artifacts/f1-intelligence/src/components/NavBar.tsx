import React from 'react';
import { Link, useLocation } from 'wouter';

export function NavBar() {
  const [location] = useLocation();

  const links = [
    { href: '/dashboard', label: 'DASHBOARD' },
    { href: '/insights', label: 'ML_INSIGHTS' },
    { href: '/dataset', label: 'DATASET' },
    { href: '/how-it-works', label: 'HOW_IT_WORKS' },
  ];

  return (
    <nav className="w-full border-b border-primary/50 bg-background/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
        <div className="flex items-center gap-6 h-full font-mono text-sm tracking-widest">
          {links.map((link) => {
            const isActive =
              location === link.href ||
              (link.href !== '/' && location.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`h-full flex items-center border-b-2 transition-colors uppercase ${
                  isActive
                    ? 'border-primary text-primary glow-text font-bold'
                    : 'border-transparent text-primary/60 hover:text-primary hover:border-primary/50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Exit button — right-aligned, returns to landing */}
        <Link
          href="/"
          className="ml-auto flex items-center gap-1.5 border border-primary/40 text-primary/50 hover:border-primary hover:text-primary px-3 py-1 text-xs uppercase tracking-widest transition-colors font-mono"
        >
          <span>◀</span> EXIT
        </Link>
      </div>
    </nav>
  );
}
