import { getDb, type Project } from "@/lib/db";
import SettingsClient from "@/components/SettingsClient";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const db = getDb();
  const project = db
    .prepare("SELECT * FROM Project WHERE apiKey = ?")
    .get("ps_demo_abc123") as Project;

  return <SettingsClient project={project} />;
}
