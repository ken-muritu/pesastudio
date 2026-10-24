import { Suspense } from "react";
import CLIAuthClient from "@/components/CLIAuthClient";

export default function CLIAuthPage() {
  return (
    <Suspense>
      <CLIAuthClient />
    </Suspense>
  );
}
