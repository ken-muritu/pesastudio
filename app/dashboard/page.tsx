import { getDb, type Project, type Callback } from "@/lib/db";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const db = getDb();

  const demoProject = db
    .prepare("SELECT * FROM Project WHERE apiKey = ?")
    .get("ps_demo_abc123") as Project;

  const callbacks = db
    .prepare(
      "SELECT * FROM Callback WHERE projectId = ? ORDER BY receivedAt DESC LIMIT 50"
    )
    .all(demoProject.id) as Callback[];

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const callbackUrl = `${appUrl}/api/callback/${demoProject.apiKey}`;

  const initialCallbacks = callbacks.map((cb) => ({
    ...cb,
    payload: (() => {
      try {
        return JSON.parse(cb.payload);
      } catch {
        return cb.payload;
      }
    })(),
    resultDesc: null,
  }));

  return (
    <DashboardClient
      project={demoProject}
      callbackUrl={callbackUrl}
      initialCallbacks={initialCallbacks}
    />
  );
}
