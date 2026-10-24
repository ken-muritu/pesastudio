"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CLISuccessClient() {
  const searchParams = useSearchParams();
  const projectName = searchParams.get("project") || "Demo Project";
  const deviceCode = searchParams.get("code") || "—";
  const authorizedAt = new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    const t = setTimeout(() => {
      card.style.transition = "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0f141b] flex items-center justify-center font-[family-name:var(--font-inter)] relative overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(rgba(222,226,236,0.07) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-[#1a7f40]/10 rounded-full blur-3xl" />
      </div>

      <main className="w-full max-w-md px-4 md:px-0 relative z-10">
        <div
          ref={cardRef}
          className="bg-[#171c23] border border-[#30353d] rounded-xl p-8 shadow-2xl"
          style={{ boxShadow: "0 0 40px rgba(26,127,64,0.12)" }}
        >
          {/* Icon */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#1a7f40]/10 mb-6 border border-[#7cda91]/20"
              style={{ filter: "drop-shadow(0 0 12px rgba(124,218,145,0.3))" }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="#7cda91"
                style={{ filter: "drop-shadow(0 0 8px rgba(124,218,145,0.4))" }}
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#dee2ec] mb-3 md:block hidden tracking-tight">
              Authorization Successful
            </h1>
            <h1 className="text-3xl font-bold text-[#dee2ec] mb-3 md:hidden tracking-tight">
              Authorized
            </h1>
            <p className="text-[#becabc] text-sm">
              Your terminal session has been successfully linked to Pesa Studio.
            </p>
          </div>

          {/* Terminal-style session details */}
          <div className="bg-[#1b2027] rounded-lg border border-[#30353d] overflow-hidden mb-8">
            <div className="bg-[#252a32] px-4 py-2 border-b border-[#30353d] flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#30353d]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#30353d]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#30353d]" />
              </div>
              <span className="font-mono text-[10px] text-[#becabc] ml-2 uppercase tracking-wider">
                Session Details
              </span>
            </div>
            <div className="p-4 space-y-3 font-mono text-sm">
              <div className="flex justify-between items-center border-b border-[#30353d]/50 pb-3">
                <span className="text-[10px] text-[#becabc] uppercase tracking-wider">Project</span>
                <span className="text-[#7cda91] text-xs">{projectName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#30353d]/50 pb-3">
                <span className="text-[10px] text-[#becabc] uppercase tracking-wider">Device Code</span>
                <span className="text-[#dee2ec] text-xs font-mono">{deviceCode}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#30353d]/50 pb-3">
                <span className="text-[10px] text-[#becabc] uppercase tracking-wider">Authorized</span>
                <span className="text-[#dee2ec] text-xs">{authorizedAt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#becabc] uppercase tracking-wider">Expiry</span>
                <span className="text-[#dee2ec] text-xs">24 Hours</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="text-center space-y-4">
            <p className="text-[#becabc] text-sm">
              You can now close this tab and return to your terminal to start building.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-[#3f493f] text-[#dee2ec] hover:bg-[#252a32] hover:border-[#889487] transition-all font-mono text-[11px] uppercase tracking-wider group"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="group-hover:text-[#7cda91] transition-colors">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
              Return to Dashboard
            </Link>
          </div>
        </div>

        {/* Brand */}
        <div className="text-center mt-8">
          <span className="text-2xl font-bold text-[#30353d] tracking-tight">Pesa Studio</span>
        </div>
      </main>
    </div>
  );
}
