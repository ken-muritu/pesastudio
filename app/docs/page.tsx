import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0f141b]">
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 h-14 bg-[#090f15] border-b border-[#3f493f]">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#7cda91] rounded-sm flex items-center justify-center">
              <span className="text-[#003917] text-xs font-black leading-none">P</span>
            </div>
            <span className="font-bold text-[#dee2ec] tracking-tight">Pesa Studio</span>
          </Link>
        </div>
      </header>

      <main className="pt-14 pb-20 md:pb-8 max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="pt-2 mb-8">
          <h1 className="text-2xl font-bold text-[#dee2ec] tracking-tight">Documentation</h1>
          <p className="text-[#becabc] text-sm mt-1">Quick reference for Pesa Studio MVP.</p>
        </div>

        <div className="space-y-4">
          {[
            {
              title: "Callback URL",
              content: "Use your project callback URL in any M-Pesa Daraja API request as the CallBackURL parameter. All POSTs to this URL are captured, stored, and forwarded in real-time.",
              code: `POST https://yourdomain.com/api/callback/ps_demo_abc123`,
            },
            {
              title: "Local Forwarding",
              content: "Set a local endpoint in Settings or the Dashboard. Every incoming callback is immediately forwarded there via a fire-and-forget POST.",
              code: `http://localhost:3000/webhook`,
            },
            {
              title: "Replay",
              content: "Click ↻ on any callback row to replay the exact original payload to your current local endpoint. Great for debugging missed callbacks.",
              code: `POST /api/projects/{id}/callbacks/{cid}/replay`,
            },
            {
              title: "Simulator",
              content: "Use the STK Push Simulator to fire synthetic callbacks without real money. Supports ResultCode 0 (success), 1032 (cancelled), 1037 (timeout), 1 (insufficient funds).",
              code: `POST /api/simulate/stk\n{ "targetUrl": "...", "resultCode": 1032, "amount": 100 }`,
            },
            {
              title: "CLI Auth",
              content: "Authenticate your terminal session to scope API access to a specific project.",
              code: `pesa auth login\n# Opens /cli/auth in your browser`,
            },
          ].map((section) => (
            <section key={section.title} className="bg-[#1b2027] border border-[#3f493f] rounded-lg p-4 space-y-2">
              <h2 className="font-semibold text-[#dee2ec]">{section.title}</h2>
              <p className="text-sm text-[#becabc]">{section.content}</p>
              <pre className="bg-[#090f15] border border-[#252a32] rounded p-3 text-[11px] font-mono text-[#7cda91] overflow-x-auto whitespace-pre-wrap">
                {section.code}
              </pre>
            </section>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
