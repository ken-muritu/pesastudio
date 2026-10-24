"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Project { id: string; name: string; apiKey: string; }

function generateDeviceCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part(4)}-${part(4)}`;
}

export default function CLIAuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [authorizing, setAuthorizing] = useState(false);
  const [deviceCode] = useState(generateDeviceCode);
  const [userAgent, setUserAgent] = useState("");
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then((d: { projects: Project[] }) => {
        setProjects(d.projects);
        const preselect = searchParams.get("project");
        setSelectedProject(preselect ?? d.projects[0]?.id ?? "");
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    const ua = navigator.userAgent;
    const platform = /Mac/.test(ua) ? "macOS" : /Win/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Unknown";
    setUserAgent(platform);
  }, []);

  useEffect(() => {
    let pos = 0;
    let rafId: number;
    const animate = () => {
      pos -= 0.15;
      if (bgRef.current) {
        bgRef.current.style.backgroundPosition = `${pos}px ${pos}px`;
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleAuthorize = useCallback(() => {
    if (!selectedProject) return;
    setAuthorizing(true);
    const project = projects.find(p => p.id === selectedProject);
    setTimeout(() => {
      router.push(`/cli/success?project=${encodeURIComponent(project?.name ?? "")}&code=${deviceCode}`);
    }, 1200);
  }, [selectedProject, projects, deviceCode, router]);

  return (
    <div
      ref={bgRef}
      className="min-h-screen bg-[#0f141b] flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(rgba(222,226,236,0.07) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1a7f40]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#30353d]/20 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-lg z-10">
        <div className="bg-[#1b2027] border border-[#3f493f] rounded-xl overflow-hidden shadow-2xl relative">
          {/* Top accent line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-[#30353d] via-[#7cda91] to-[#30353d]" />

          <div className="p-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div
                className="w-16 h-16 bg-[#252a32] rounded-full flex items-center justify-center border border-[#3f493f] mb-4"
                style={{ boxShadow: "0 0 20px rgba(26,127,64,0.3)" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#7cda91">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-[#7cda91] mb-2 tracking-tight">Authenticate CLI</h1>
              <p className="text-[#becabc] text-sm max-w-sm">
                A terminal session is requesting access to your Pesa Studio account.
              </p>
            </div>

            {/* Device code */}
            <div className="mb-8">
              <div className="bg-[#090f15] border border-[#252a32] rounded-lg p-6 text-center relative group">
                <div className="absolute top-2 left-3 text-[10px] font-mono text-[#becabc] uppercase tracking-wider">
                  Device Code
                </div>
                <div className="font-mono text-3xl font-bold tracking-[0.2em] text-[#7cda91] flex justify-center items-center gap-2 mt-2">
                  <span>{deviceCode.split("-")[0]}</span>
                  <span className="text-[#3f493f]">-</span>
                  <span>{deviceCode.split("-")[1]}</span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-[#becabc] text-xs">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                  Verify this code matches your terminal
                </div>
              </div>
            </div>

            {/* Session details */}
            <div className="bg-[#252a32] rounded-lg p-4 mb-8 border border-[#3f493f]">
              <h2 className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                Session Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-[#3f493f]/50 pb-2.5">
                  <span className="text-[#becabc]">Machine</span>
                  <span className="font-mono text-[#dee2ec] text-xs">{userAgent || "Browser"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#3f493f]/50 pb-2.5">
                  <span className="text-[#becabc]">IP Address</span>
                  <span className="font-mono text-[#dee2ec] text-xs">{typeof window !== "undefined" ? window.location.hostname : "localhost"}</span>
                </div>
                <div className="flex flex-col gap-2 border-b border-[#3f493f]/50 pb-2.5">
                  <label className="text-[#becabc]">Target Project</label>
                  <div className="relative">
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full bg-[#090f15] border border-[#3f493f] text-[#dee2ec] rounded-lg appearance-none pl-3 pr-8 py-2.5 font-mono text-xs focus:outline-none focus:border-[#7cda91] transition-colors cursor-pointer"
                    >
                      {projects.length === 0 && (
                        <option value="">Loading projects...</option>
                      )}
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-[#7cda91]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                    </div>
                  </div>
                  <p className="text-[10px] font-mono text-[#becabc]/70 italic">
                    This terminal session will be scoped to the selected project.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-0.5">
                  <span className="text-[#becabc]">Requested Permissions</span>
                  <div className="flex gap-2">
                    <span className="bg-[#090f15] border border-[#3f493f] text-[#7cda91] px-2 py-1 rounded font-mono text-[10px]">
                      read:logs
                    </span>
                    <span className="bg-[#090f15] border border-[#3f493f] text-[#7cda91] px-2 py-1 rounded font-mono text-[10px]">
                      write:config
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAuthorize}
                disabled={authorizing}
                className="w-full bg-[#7cda91] text-[#003917] py-3 px-6 rounded-lg font-bold text-sm hover:bg-[#98f7ab] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 relative overflow-hidden"
                style={{ boxShadow: authorizing ? "none" : "0 0 20px rgba(124,218,145,0.25)" }}
              >
                {authorizing ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="animate-spin">
                      <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                    </svg>
                    Authorizing...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="transition-transform group-hover:scale-110">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                    Confirm and Authorize
                  </>
                )}
              </button>
              <Link
                href="/dashboard"
                className="w-full bg-transparent border border-[#3f493f] text-[#becabc] py-3 px-6 rounded-lg font-semibold text-sm hover:text-[#dee2ec] hover:border-[#889487] transition-all text-center"
              >
                Cancel Request
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#090f15] p-4 border-t border-[#3f493f] text-center">
            <p className="font-mono text-[10px] text-[#becabc] flex items-center justify-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#7cda91"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              Once authorized, return to your terminal to start building.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
