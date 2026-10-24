"use client";

import Link from "next/link";

interface Props {
  title?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
}

export default function TopBar({ title, showBack, rightSlot }: Props) {
  return (
    <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 h-14 bg-[#090f15] border-b border-[#3f493f]">
      <div className="flex items-center gap-3">
        {showBack ? (
          <Link
            href="/dashboard"
            className="text-[#becabc] hover:text-[#7cda91] transition-colors p-1 -ml-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#7cda91] rounded-sm flex items-center justify-center">
              <span className="text-[#003917] text-xs font-black leading-none">P</span>
            </div>
            <span className="font-bold text-[#dee2ec] tracking-tight">Pesa Studio</span>
          </Link>
        )}
        {title && (
          <span className="text-[#dee2ec] font-semibold text-sm">{title}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {rightSlot ?? (
          <span className="bg-[#1a7f40]/20 border border-[#7cda91]/30 text-[#7cda91] font-mono text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            v0.1
          </span>
        )}
      </div>
    </header>
  );
}
