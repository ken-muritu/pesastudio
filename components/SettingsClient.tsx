"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Project } from "@/lib/db";
import BottomNav from "@/components/BottomNav";

interface Props {
  project: Project;
}

function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">{label}</label>
      <div className="relative flex items-center">
        <div className="flex-1 bg-[#090f15] border border-[#252a32] rounded-l px-3 py-2.5 font-mono text-sm text-[#dee2ec] truncate">
          {secret && !revealed ? "••••••••••••••••••••" : value}
        </div>
        {secret && (
          <button
            onClick={() => setRevealed(r => !r)}
            className="bg-[#090f15] border-t border-b border-[#252a32] px-2.5 py-2.5 text-[#becabc] hover:text-[#dee2ec] transition-colors"
            title={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            )}
          </button>
        )}
        <button
          onClick={copy}
          className={`border border-[#252a32] rounded-r px-3 py-2.5 transition-all active:scale-95 ${
            copied ? "bg-[#1a7f40]/20 text-[#7cda91]" : "bg-[#090f15] text-[#becabc] hover:text-[#7cda91]"
          }`}
        >
          {copied ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          )}
        </button>
      </div>
    </div>
  );
}

interface Stats {
  total: number;
  successful: number;
  failed: number;
  replays: number;
  deliveryRate: number;
  successRate: number;
  avgLatency: number | null;
  latencyHistory: number[];
}

export default function SettingsClient({ project }: Props) {
  const [env, setEnv] = useState<"sandbox" | "production">("sandbox");
  const [localEndpoint, setLocalEndpoint] = useState(project.localEndpoint ?? "");
  const [savingEndpoint, setSavingEndpoint] = useState(false);
  const [endpointMsg, setEndpointMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}/stats`);
        if (res.ok) setStats(await res.json() as Stats);
      } catch { /* ignore */ }
    };
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [project.id]);

  const resetData = useCallback(async () => {
    if (!confirm("Delete ALL callbacks for this project? This cannot be undone.")) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/reset`, { method: "DELETE" });
      const d = await res.json() as { deleted?: number; error?: string };
      if (res.ok) {
        setResetMsg(`Deleted ${d.deleted} callbacks`);
        setStats(s => s ? { ...s, total: 0, successful: 0, failed: 0, replays: 0, deliveryRate: 100, successRate: 100, avgLatency: null, latencyHistory: [] } : s);
      } else {
        setResetMsg(d.error ?? "Error");
      }
    } catch {
      setResetMsg("Network error");
    } finally {
      setResetting(false);
      setTimeout(() => setResetMsg(null), 4000);
    }
  }, [project.id]);

  const saveEndpoint = useCallback(async () => {
    setSavingEndpoint(true);
    setEndpointMsg(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/endpoint`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localEndpoint: localEndpoint.trim() || null }),
      });
      if (res.ok) {
        setEndpointMsg("Saved ✓");
      } else {
        const d = await res.json() as { error?: string };
        setEndpointMsg(d.error ?? "Error");
      }
    } catch {
      setEndpointMsg("Network error");
    } finally {
      setSavingEndpoint(false);
      setTimeout(() => setEndpointMsg(null), 3000);
    }
  }, [localEndpoint, project.id]);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const callbackUrl = `${appUrl}/api/callback/${project.apiKey}`;

  return (
    <div className="min-h-screen bg-[#0f141b]">
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 h-14 bg-[#090f15] border-b border-[#3f493f]">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-[#becabc] hover:text-[#7cda91] transition-colors p-1 -ml-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
          </Link>
          <div className="w-6 h-6 bg-[#7cda91] rounded-sm flex items-center justify-center">
            <span className="text-[#003917] text-xs font-black leading-none">P</span>
          </div>
          <span className="font-bold text-[#dee2ec] tracking-tight">Pesa Studio</span>
        </div>
        <button className="text-[#becabc] hover:text-[#dee2ec] transition-colors p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </button>
      </header>

      <main className="pt-14 pb-20 md:pb-8 max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page header */}
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-[#dee2ec] tracking-tight">Project Settings</h1>
          <p className="text-[#becabc] text-sm mt-1">Manage your Daraja integration environment.</p>
        </div>

        {/* Environment toggle */}
        <div className="bg-[#171c23] border border-[#3f493f] p-1 rounded inline-flex">
          {(["sandbox", "production"] as const).map((e) => (
            <button
              key={e}
              onClick={() => setEnv(e)}
              className={`px-4 py-1.5 rounded font-mono text-[11px] font-bold uppercase tracking-wider transition-all ${
                env === e
                  ? "bg-[#30353d] text-[#dee2ec] shadow-sm"
                  : "text-[#becabc] hover:text-[#dee2ec]"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* API Credentials */}
        <section className="bg-[#1b2027] border border-[#3f493f] rounded-lg overflow-hidden">
          <div className="bg-[#252a32] border-b border-[#3f493f] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#becabc"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
              <span className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">API Credentials</span>
            </div>
            <span className="font-mono text-[10px] text-[#3f493f]">
              {env === "sandbox" ? "SANDBOX" : "PRODUCTION"}
            </span>
          </div>
          <div className="p-4 space-y-4">
            <CopyField
              label="Callback URL"
              value={callbackUrl}
            />
            <CopyField
              label="Project API Key"
              value={project.apiKey}
              secret
            />
            <div className="pt-2 border-t border-[#252a32] bg-[#252a32]/40 rounded p-3 space-y-1">
              <p className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">
                Daraja {env === "sandbox" ? "Sandbox" : "Production"} Credentials
              </p>
              <p className="text-xs text-[#becabc]">
                Add your Consumer Key, Consumer Secret and STK Passkey from
              </p>
              <a
                href="https://developer.safaricom.co.ke/MyApps"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#7cda91] hover:underline font-mono"
              >
                developer.safaricom.co.ke/MyApps
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
              </a>
            </div>
          </div>
        </section>

        {/* Webhook Health */}
        <section className="bg-[#1b2027] border border-[#3f493f] rounded-lg overflow-hidden">
          <div className="bg-[#252a32] border-b border-[#3f493f] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#becabc"><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z"/></svg>
              <span className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">Webhook Status</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1a7f40]/20 border border-[#7cda91]/30 px-2 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7cda91] pulse-glow" />
              <span className="font-mono text-[9px] font-bold text-[#7cda91] uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="bg-[#090f15] border border-[#252a32] rounded p-2.5 font-mono text-[11px] text-[#7cda91] break-all">
              {callbackUrl}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border-l-2 border-[#7cda91] pl-3 py-1">
                <p className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">Delivery Rate</p>
                <p className="text-xl font-bold font-mono text-[#dee2ec] mt-1">
                  {stats ? `${stats.deliveryRate}%` : "—"}
                </p>
              </div>
              <div className="border-l-2 border-[#44474b] pl-3 py-1">
                <p className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">Avg Latency</p>
                <p className="text-xl font-bold font-mono text-[#dee2ec] mt-1">
                  {stats?.avgLatency != null ? `${stats.avgLatency}ms` : "—"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="text-center">
                <p className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">Total</p>
                <p className="text-lg font-bold font-mono text-[#dee2ec]">{stats?.total ?? "—"}</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">Success</p>
                <p className="text-lg font-bold font-mono text-[#7cda91]">{stats?.successful ?? "—"}</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">Failed</p>
                <p className="text-lg font-bold font-mono text-[#ffb4ab]">{stats?.failed ?? "—"}</p>
              </div>
            </div>

            {/* Local endpoint config */}
            <div className="pt-2 border-t border-[#252a32] space-y-2">
              <label className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">
                Forward To (Local Endpoint)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={localEndpoint}
                  onChange={(e) => setLocalEndpoint(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEndpoint()}
                  placeholder="http://localhost:3000/webhook"
                  className="flex-1 bg-[#090f15] border border-[#252a32] rounded px-3 py-2 font-mono text-xs text-[#dee2ec] placeholder:text-[#3f493f] focus:outline-none focus:border-[#7cda91] transition-colors"
                />
                <button
                  onClick={saveEndpoint}
                  disabled={savingEndpoint}
                  className="text-xs font-mono px-3 py-2 rounded border border-[#3f493f] text-[#becabc] hover:border-[#7cda91] hover:text-[#7cda91] transition-all active:scale-95 disabled:opacity-50"
                >
                  {savingEndpoint ? "..." : "Save"}
                </button>
              </div>
              {endpointMsg && (
                <p className={`text-[11px] font-mono ${endpointMsg.includes("✓") ? "text-[#7cda91]" : "text-[#ffb4ab]"}`}>
                  {endpointMsg}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="bg-[#1b2027] border border-[#3f493f] rounded-lg overflow-hidden">
          <div className="bg-[#252a32] border-b border-[#3f493f] px-4 py-3">
            <span className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">Quick Links</span>
          </div>
          <div className="divide-y divide-[#252a32]">
            {[
              { label: "CLI Authorization", href: "/cli/auth", icon: "⌨️", desc: "Link your terminal to this project" },
              { label: "Dashboard", href: "/dashboard", icon: "📡", desc: "Back to live callback feed" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-[#1f2530] transition-colors group"
              >
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#dee2ec] group-hover:text-[#7cda91] transition-colors">{item.label}</p>
                  <p className="text-xs text-[#becabc] mt-0.5">{item.desc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#3f493f" className="group-hover:fill-[#7cda91] transition-colors">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="border border-[#93000a]/60 rounded-lg p-4 bg-[#171c23] relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #ffb4ab 0, #ffb4ab 1px, transparent 0, transparent 50%)", backgroundSize: "10px 10px" }}
          />
          <div className="relative z-10 space-y-2">
            <h2 className="font-semibold text-[#ffb4ab] flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffb4ab"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
              Danger Zone
            </h2>
            <p className="text-xs text-[#becabc]">Irreversible actions. Proceed with caution.</p>
            {resetMsg && (
              <p className={`text-xs font-mono ${resetMsg.includes("Deleted") ? "text-[#7cda91]" : "text-[#ffb4ab]"}`}>{resetMsg}</p>
            )}
            <button
              onClick={resetData}
              disabled={resetting}
              className="mt-3 w-full bg-[#93000a]/30 text-[#ffb4ab] hover:bg-[#93000a] hover:text-[#ffdad6] border border-[#ffb4ab]/30 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {resetting ? "Deleting..." : "Reset Project Data"}
            </button>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
