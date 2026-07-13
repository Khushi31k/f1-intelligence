import React from 'react';

interface ASCIIBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function ASCIIBox({ title, children, className = "", glow = true, ...props }: ASCIIBoxProps) {
  return (
    <div className={`relative border border-primary bg-background flex flex-col ${glow ? 'glow' : ''} ${className}`} {...props}>
      {title && (
        <div className="absolute -top-3 left-4 bg-background px-2 text-primary font-bold uppercase tracking-widest text-sm z-10 flex items-center gap-2">
          <span>[</span> {title} <span>]</span>
        </div>
      )}
      
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary -translate-x-[1px] -translate-y-[1px]" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary translate-x-[1px] -translate-y-[1px]" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary -translate-x-[1px] translate-y-[1px]" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary translate-x-[1px] translate-y-[1px]" />
      
      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
