"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Project } from "@/lib/db";
import CallbackList, { type CallbackItem } from "@/components/CallbackList";
import BottomNav from "@/components/BottomNav";

interface Props {
  project: Project;
  callbackUrl: string;
  initialCallbacks: CallbackItem[];
}

const STK_SCENARIOS = [
  { label: "✅ Success", resultCode: 0, color: "border-[#1a7f40] text-[#7cda91] hover:bg-[#1a7f40]/20" },
  { label: "❌ Cancelled", resultCode: 1032, color: "border-[#3f493f] text-[#ffb4ab] hover:bg-[#93000a]/20" },
  { label: "⏱ Timeout", resultCode: 1037, color: "border-[#3f493f] text-[#c5c6cb] hover:bg-[#30353d]" },
  { label: "💰 Insuf. Funds", resultCode: 1, color: "border-[#3f493f] text-[#d2bbff] hover:bg-[#8545f6]/10" },
];

interface StatsData { avgLatency: number | null; latencyHistory: number[]; }

function StatCard({
  label,
  value,
  sub,
  accent = false,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  trend?: "up" | "stable" | "down";
}) {
  return (
    <div className="bg-[#1b2027] border border-[#3f493f] rounded-lg p-4 group hover:bg-[#1f2530] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">{label}</span>
        {trend && (
          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
            trend === "up" ? "text-[#7cda91] border-[#7cda91]/30 bg-[#7cda91]/5" :
            trend === "down" ? "text-[#ffb4ab] border-[#ffb4ab]/30 bg-[#ffb4ab]/5" :
            "text-[#becabc] border-[#3f493f] bg-[#252a32]"
          }`}>
            <span>{trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}</span>
            <span>{trend === "stable" ? "Stable" : trend === "up" ? "Good" : "Check"}</span>
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold font-mono ${accent ? "text-[#7cda91]" : "text-[#dee2ec]"}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-[#becabc] mt-1 font-mono">{sub}</div>}
    </div>
  );
}

export default function DashboardClient({ project, callbackUrl, initialCallbacks }: Props) {
  const [copied, setCopied] = useState(false);
  const [localEndpoint, setLocalEndpoint] = useState(project.localEndpoint ?? "");
  const [savedEndpoint, setSavedEndpoint] = useState(project.localEndpoint);
  const [savingEndpoint, setSavingEndpoint] = useState(false);
  const [endpointMsg, setEndpointMsg] = useState<string | null>(null);

  const [simAmount, setSimAmount] = useState("100");
  const [simPhone, setSimPhone] = useState("254708374149");
  const [simulating, setSimulating] = useState<number | null>(null);
  const [simResult, setSimResult] = useState<string | null>(null);

  const [callbacks, setCallbacks] = useState<CallbackItem[]>(initialCallbacks);
  const [totalReceived, setTotalReceived] = useState(initialCallbacks.length);
  const [statsData, setStatsData] = useState<StatsData>({ avgLatency: null, latencyHistory: [] });

  useEffect(() => {
    setTotalReceived(callbacks.length);
  }, [callbacks.length]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${project.id}/stats`);
        if (res.ok) {
          const d = await res.json() as StatsData;
          setStatsData(d);
        }
      } catch { /* ignore */ }
    };
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [project.id]);

  const successRate = callbacks.length > 0
    ? Math.round((callbacks.filter(c => c.resultCode === 0).length / callbacks.length) * 100)
    : 100;

  const copyUrl = useCallback(() => {
    navigator.clipboard.writeText(callbackUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [callbackUrl]);

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
        setSavedEndpoint(localEndpoint.trim() || null);
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

  const simulate = useCallback(async (resultCode: number) => {
    setSimulating(resultCode);
    setSimResult(null);
    try {
      const res = await fetch("/api/simulate/stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: callbackUrl,
          resultCode,
          amount: parseInt(simAmount, 10) || 100,
          phoneNumber: simPhone.trim() || "254708374149",
        }),
      });
      const data = await res.json() as { simulated?: boolean; responseStatus?: number; error?: string };
      if (data.simulated) {
        setSimResult(`Sent → HTTP ${data.responseStatus}`);
      } else {
        setSimResult(`Failed: ${data.error}`);
      }
    } catch {
      setSimResult("Network error");
    } finally {
      setSimulating(null);
      setTimeout(() => setSimResult(null), 5000);
    }
  }, [callbackUrl, simAmount, simPhone]);

  return (
    <div className="min-h-screen bg-[#0f141b]">
      {/* Top bar */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 h-14 bg-[#090f15] border-b border-[#3f493f]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#7cda91] rounded-sm flex items-center justify-center shrink-0">
            <span className="text-[#003917] text-xs font-black leading-none">P</span>
          </div>
          <span className="font-bold text-[#dee2ec] tracking-tight">Pesa Studio</span>
          <span className="hidden sm:inline text-[#3f493f] font-mono text-[11px]">/ Daraja OS Engine</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#becabc] font-mono text-[11px] hidden sm:inline">Demo Mode</span>
          <Link href="/settings" className="text-[#becabc] hover:text-[#dee2ec] transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
            </svg>
          </Link>
          <div className="flex items-center gap-1.5 bg-[#1a7f40]/20 border border-[#7cda91]/30 px-2 py-1 rounded">
            <div className="w-1.5 h-1.5 rounded-full bg-[#7cda91] pulse-glow" />
            <span className="text-[#7cda91] font-mono text-[10px] font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
      </header>

      <main className="pt-14 pb-20 md:pb-8 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Stats row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-6">
          <StatCard
            label="Total Callbacks"
            value={totalReceived.toString()}
            sub="This session"
            accent
            trend="stable"
          />
          <StatCard
            label="Success Rate"
            value={`${successRate}%`}
            sub={`${callbacks.filter(c => c.resultCode === 0).length} successful`}
            trend={successRate >= 90 ? "up" : successRate >= 70 ? "stable" : "down"}
          />
          <StatCard
            label="Replays"
            value={callbacks.reduce((acc, c) => acc + c.replayCount, 0).toString()}
            sub="Total replays"
            trend="stable"
          />
          {/* Latency card spans 2 on mobile */}
          <div className="col-span-2 lg:col-span-1 bg-[#1b2027] border border-[#3f493f] rounded-lg p-4 group hover:bg-[#1f2530] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">Avg Latency</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#becabc" className="opacity-70 group-hover:opacity-100 transition-opacity">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
              </svg>
            </div>
            <div className="flex items-end gap-4">
              <div className="text-2xl font-bold font-mono text-[#dee2ec]">
                {statsData.avgLatency != null
                  ? <>{statsData.avgLatency}<span className="text-sm text-[#becabc] ml-1 font-normal">ms</span></>
                  : <span className="text-[#3f493f]">—</span>
                }
              </div>
              {statsData.latencyHistory.length > 0 ? (
                <div className="flex-1 flex items-end gap-[3px] h-8 pb-0.5">
                  {(() => {
                    const max = Math.max(...statsData.latencyHistory, 1);
                    return statsData.latencyHistory.map((v, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-[#7cda91]/50 group-hover:bg-[#7cda91]/70 transition-colors"
                        style={{ height: `${Math.round((v / max) * 100)}%` }}
                      />
                    ));
                  })()}
                </div>
              ) : (
                <div className="flex-1 flex items-end gap-[3px] h-8 pb-0.5">
                  {[20, 30, 20, 40, 20, 30].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm bg-[#3f493f]/50" style={{ height: `${h}%` }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Two-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column — controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Callback URL */}
            <section className="bg-[#1b2027] border border-[#3f493f] rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-[#7cda91]" />
                <span className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">Callback URL</span>
              </div>
              <div className="bg-[#090f15] border border-[#252a32] rounded p-2.5 font-mono text-[11px] text-[#7cda91] break-all leading-relaxed">
                {callbackUrl}
              </div>
              <button
                onClick={copyUrl}
                className={`w-full text-xs font-mono py-2 rounded border transition-all active:scale-95 relative overflow-hidden shimmer-btn ${
                  copied
                    ? "border-[#1a7f40] text-[#7cda91] bg-[#1a7f40]/20"
                    : "border-[#3f493f] text-[#becabc] hover:border-[#7cda91] hover:text-[#7cda91]"
                }`}
              >
                <span className="relative z-10">{copied ? "✓ Copied!" : "📋 Copy URL"}</span>
              </button>
            </section>

            {/* Local Endpoint */}
            <section className="bg-[#1b2027] border border-[#3f493f] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${savedEndpoint ? "bg-[#7cda91] pulse-glow" : "bg-[#3f493f]"}`} />
                  <span className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">Local Endpoint</span>
                </div>
                {savedEndpoint && (
                  <span className="text-[9px] font-mono text-[#7cda91] bg-[#1a7f40]/20 border border-[#7cda91]/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Active
                  </span>
                )}
              </div>
              <input
                type="url"
                value={localEndpoint}
                onChange={(e) => setLocalEndpoint(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEndpoint()}
                placeholder="http://localhost:3000/webhook"
                className="w-full bg-[#090f15] border border-[#252a32] rounded px-3 py-2 font-mono text-xs text-[#dee2ec] placeholder:text-[#3f493f] focus:outline-none focus:border-[#7cda91] transition-colors"
              />
              <button
                onClick={saveEndpoint}
                disabled={savingEndpoint}
                className="w-full text-xs font-mono py-2 rounded border border-[#3f493f] text-[#becabc] hover:border-[#7cda91] hover:text-[#7cda91] transition-all active:scale-95 disabled:opacity-50"
              >
                {savingEndpoint ? "Saving..." : endpointMsg ?? "💾 Save Endpoint"}
              </button>
            </section>

            {/* STK Simulator */}
            <section className="bg-[#1b2027] border border-[#3f493f] rounded-lg overflow-hidden">
              <div className="bg-[#252a32] border-b border-[#3f493f] px-4 py-2.5 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#7cda91">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1z"/><path d="M6.5 10h-2v7h2v-7zm4 0h-2v7h2v-7zm4 0h-2v7h2v-7zm4 0h-2v7h2v-7z"/>
                </svg>
                <span className="font-mono text-[10px] text-[#becabc] uppercase tracking-wider">Daraja Simulator</span>
                <span className="ml-auto text-[9px] font-mono text-[#3f493f] bg-[#090f15] border border-[#3f493f] px-1.5 py-0.5 rounded">STK Push</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="border border-[#252a32] rounded bg-[#090f15] focus-within:border-[#7cda91] transition-colors">
                    <input
                      type="tel"
                      value={simPhone}
                      onChange={(e) => setSimPhone(e.target.value)}
                      placeholder="Phone Number (254...)"
                      className="w-full bg-transparent border-none text-[#dee2ec] placeholder:text-[#3f493f] focus:ring-0 text-sm px-3 py-2 font-mono outline-none"
                    />
                  </div>
                  <div className="border border-[#252a32] rounded bg-[#090f15] focus-within:border-[#7cda91] transition-colors">
                    <input
                      type="number"
                      value={simAmount}
                      onChange={(e) => setSimAmount(e.target.value)}
                      placeholder="Amount (KES)"
                      className="w-full bg-transparent border-none text-[#dee2ec] placeholder:text-[#3f493f] focus:ring-0 text-sm px-3 py-2 font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {STK_SCENARIOS.map((s) => (
                    <button
                      key={s.resultCode}
                      onClick={() => simulate(s.resultCode)}
                      disabled={simulating !== null}
                      className={`text-[11px] font-mono font-semibold px-2 py-2 rounded border transition-all active:scale-95 disabled:opacity-50 ${s.color}`}
                    >
                      {simulating === s.resultCode ? "Sending..." : s.label}
                    </button>
                  ))}
                </div>

                {simResult && (
                  <div className={`text-[11px] font-mono p-2 rounded border ${
                    simResult.startsWith("Failed") || simResult.startsWith("Network")
                      ? "border-[#ffb4ab]/30 text-[#ffb4ab] bg-[#93000a]/10"
                      : "border-[#7cda91]/30 text-[#7cda91] bg-[#1a7f40]/10"
                  }`}>
                    {simResult}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right column — live feed */}
          <div className="lg:col-span-2">
            <section className="bg-[#1b2027] border border-[#3f493f] rounded-lg overflow-hidden">
              <CallbackList
                projectId={project.id}
                initialCallbacks={initialCallbacks}
                localEndpoint={savedEndpoint}
                onCallbacksChange={setCallbacks}
              />
            </section>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
