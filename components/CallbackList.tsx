"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface CallbackItem {
  id: string;
  projectId: string;
  payload: unknown;
  mpesaReceipt: string | null;
  resultCode: number | null;
  resultDesc: string | null;
  transactionType: string;
  amount: number | null;
  phoneNumber: string | null;
  status: string;
  replayCount: number;
  receivedAt: number;
  forwardedAt: number | null;
  forwardedResponse: string | null;
}

interface Props {
  projectId: string;
  initialCallbacks: CallbackItem[];
  localEndpoint: string | null;
  onCallbacksChange?: (callbacks: CallbackItem[]) => void;
}

function statusColor(status: string): string {
  switch (status) {
    case "received":
      return "text-[#7cda91] bg-[#7cda91]/10 border-[#7cda91]/30";
    case "forwarded":
      return "text-[#7cda91] bg-[#1a7f40]/20 border-[#1a7f40]/50";
    case "failed":
      return "text-[#ffb4ab] bg-[#93000a]/20 border-[#ffb4ab]/30";
    case "replayed":
      return "text-[#d2bbff] bg-[#8545f6]/20 border-[#d2bbff]/30";
    default:
      return "text-[#becabc] bg-[#30353d]/40 border-[#3f493f]";
  }
}

function statusBorderColor(status: string): string {
  switch (status) {
    case "received":
      return "border-l-[#7cda91]";
    case "forwarded":
      return "border-l-[#1a7f40]";
    case "failed":
      return "border-l-[#ffb4ab]";
    case "replayed":
      return "border-l-[#d2bbff]";
    default:
      return "border-l-[#3f493f]";
  }
}

function resultCodeBadge(code: number | null): { text: string; color: string } {
  if (code === null) return { text: "—", color: "text-[#becabc]" };
  if (code === 0) return { text: `${code} ✓`, color: "text-[#7cda91]" };
  return { text: `${code} ✗`, color: "text-[#ffb4ab]" };
}

function resultCodeDesc(code: number | null): string {
  const map: Record<number, string> = {
    0: "Success",
    1: "Insufficient funds",
    1032: "Cancelled by user",
    1037: "Timeout",
    2001: "Invalid initiator",
  };
  return code !== null ? (map[code] ?? `ResultCode ${code}`) : "";
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function maskPhone(phone: string | null): string {
  if (!phone) return "—";
  if (phone.length >= 9) {
    return phone.slice(0, 5) + "****" + phone.slice(-3);
  }
  return phone;
}

interface CallbackRowProps {
  cb: CallbackItem;
  projectId: string;
  hasEndpoint: boolean;
  onReplay: (id: string) => void;
  replayingId: string | null;
  isNew: boolean;
}

function CallbackRow({ cb, projectId: _pid, hasEndpoint, onReplay, replayingId, isNew }: CallbackRowProps) {
  const [expanded, setExpanded] = useState(false);
  const badge = resultCodeBadge(cb.resultCode);
  const isReplaying = replayingId === cb.id;

  return (
    <div
      className={`border-l-4 ${statusBorderColor(cb.status)} bg-[#1b2027] hover:bg-[#1f2530] transition-colors cursor-pointer ${isNew ? "animate-slide-in" : ""}`}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[#becabc] font-mono text-[11px] shrink-0">
            {formatTime(cb.receivedAt)}
          </span>

          <span
            className={`shrink-0 text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${statusColor(cb.status)}`}
          >
            {cb.status}
          </span>

          <span className="text-[#becabc] text-xs font-mono shrink-0 hidden sm:inline">
            {cb.transactionType.replace("_", " ").toUpperCase()}
          </span>

          {cb.amount !== null && (
            <span className="text-[#dee2ec] text-xs font-semibold shrink-0">
              KES {cb.amount.toLocaleString()}
            </span>
          )}

          {cb.mpesaReceipt && (
            <span className="text-[#7cda91] text-xs font-mono truncate hidden md:inline">
              {cb.mpesaReceipt}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs font-mono font-bold ${badge.color}`}>
            {badge.text}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onReplay(cb.id);
            }}
            disabled={!hasEndpoint || isReplaying}
            title={hasEndpoint ? "Replay to local endpoint" : "Set a local endpoint first"}
            className={`text-xs px-2 py-1 rounded border font-mono transition-all ${
              hasEndpoint
                ? "border-[#3f493f] text-[#becabc] hover:border-[#7cda91] hover:text-[#7cda91] active:scale-95"
                : "border-[#3f493f]/50 text-[#becabc]/30 cursor-not-allowed"
            } ${isReplaying ? "opacity-50" : ""}`}
          >
            {isReplaying ? "..." : "↻"}
          </button>

          <span className="text-[#3f493f] text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-[#252a32]">
          <div className="flex flex-wrap gap-x-6 gap-y-1 py-2 text-xs font-mono">
            <span>
              <span className="text-[#becabc]">receipt </span>
              <span className="text-[#dee2ec]">{cb.mpesaReceipt ?? "—"}</span>
            </span>
            <span>
              <span className="text-[#becabc]">phone </span>
              <span className="text-[#dee2ec]">{maskPhone(cb.phoneNumber)}</span>
            </span>
            <span>
              <span className="text-[#becabc]">code </span>
              <span className={badge.color}>{cb.resultCode ?? "—"}</span>
            </span>
            <span>
              <span className="text-[#becabc]">desc </span>
              <span className="text-[#dee2ec]">{resultCodeDesc(cb.resultCode)}</span>
            </span>
            {cb.replayCount > 0 && (
              <span>
                <span className="text-[#becabc]">replays </span>
                <span className="text-[#d2bbff]">{cb.replayCount}</span>
              </span>
            )}
          </div>

          <pre className="bg-[#090f15] border border-[#252a32] rounded p-3 text-[11px] font-mono text-[#becabc] overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(cb.payload, null, 2)}
          </pre>

          {cb.forwardedResponse && (() => {
            let parsed: { status?: number; body?: string } | null = null;
            try { parsed = JSON.parse(cb.forwardedResponse); } catch { /* ignore */ }
            return parsed ? (
              <div className="text-xs font-mono text-[#becabc]">
                <span className="text-[#3f493f]">→ </span>
                <span>local responded </span>
                <span className={parsed.status && parsed.status < 300 ? "text-[#7cda91]" : "text-[#ffb4ab]"}>
                  {parsed.status}
                </span>
                {parsed.body && (
                  <span className="ml-2 text-[#888]">{parsed.body.slice(0, 80)}</span>
                )}
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}

export default function CallbackList({ projectId, initialCallbacks, localEndpoint, onCallbacksChange }: Props) {
  const [callbacks, setCallbacks] = useState<CallbackItem[]>(initialCallbacks);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [replayResult, setReplayResult] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource(`/api/projects/${projectId}/stream`);
    esRef.current = es;

    es.onopen = () => setIsLive(true);
    es.onerror = () => setIsLive(false);

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as {
          type: string;
          data: CallbackItem & { id: string; status: string; replayCount?: number; forwardedAt?: number };
        };

        if (msg.type === "new-callback") {
          setCallbacks((prev) => {
            const next = [msg.data as CallbackItem, ...prev.slice(0, 199)];
            onCallbacksChange?.(next);
            return next;
          });
          setNewIds((prev) => new Set([...prev, msg.data.id]));
          setTimeout(() => {
            setNewIds((prev) => {
              const next = new Set(prev);
              next.delete(msg.data.id);
              return next;
            });
          }, 1500);
        } else if (msg.type === "reset") {
          setCallbacks([]);
          onCallbacksChange?.([]);
        } else if (msg.type === "callback-updated") {
          setCallbacks((prev) =>
            prev.map((cb) =>
              cb.id === msg.data.id
                ? {
                    ...cb,
                    status: msg.data.status,
                    replayCount: msg.data.replayCount ?? cb.replayCount,
                    forwardedAt: msg.data.forwardedAt ?? cb.forwardedAt,
                  }
                : cb
            )
          );
        }
      } catch { /* ignore malformed */ }
    };

    return () => {
      es.close();
      setIsLive(false);
    };
  }, [projectId]);

  const handleReplay = useCallback(
    async (callbackId: string) => {
      setReplayingId(callbackId);
      setReplayResult(null);
      try {
        const res = await fetch(
          `/api/projects/${projectId}/callbacks/${callbackId}/replay`,
          { method: "POST" }
        );
        const data = await res.json() as { replayed?: boolean; responseStatus?: number; error?: string };
        if (data.replayed) {
          setReplayResult(`↻ Replayed → ${data.responseStatus}`);
        } else {
          setReplayResult(`✗ ${data.error ?? "Replay failed"}`);
        }
      } catch {
        setReplayResult("✗ Network error");
      } finally {
        setReplayingId(null);
        setTimeout(() => setReplayResult(null), 4000);
      }
    },
    [projectId]
  );

  const hasEndpoint = Boolean(localEndpoint);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 bg-[#252a32] border-b border-[#3f493f]">
        <div className="flex items-center gap-2">
          <span className="text-[#becabc] font-mono text-xs uppercase tracking-wider">
            Live Callbacks
          </span>
          <span className="text-[#3f493f] font-mono text-xs">
            ({callbacks.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {replayResult && (
            <span
              className={`text-xs font-mono ${replayResult.startsWith("✗") ? "text-[#ffb4ab]" : "text-[#7cda91]"}`}
            >
              {replayResult}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${isLive ? "bg-[#7cda91] pulse-glow" : "bg-[#ffb4ab]"}`}
            />
            <span
              className={`text-[10px] font-mono font-bold uppercase ${isLive ? "text-[#7cda91]" : "text-[#ffb4ab]"}`}
            >
              {isLive ? "live" : "offline"}
            </span>
          </div>
        </div>
      </div>

      {callbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#becabc]">
          <div className="text-4xl opacity-30">📡</div>
          <p className="font-mono text-sm">Waiting for callbacks...</p>
          <p className="font-mono text-xs text-[#3f493f]">
            Send an M-Pesa request to your callback URL or use the simulator below
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#252a32] overflow-y-auto">
          {callbacks.map((cb) => (
            <CallbackRow
              key={cb.id}
              cb={cb}
              projectId={projectId}
              hasEndpoint={hasEndpoint}
              onReplay={handleReplay}
              replayingId={replayingId}
              isNew={newIds.has(cb.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
