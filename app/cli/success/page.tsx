import { Suspense } from "react";
import CLISuccessClient from "@/components/CLISuccessClient";

export default function CLISuccessPage() {
  return (
    <Suspense>
      <CLISuccessClient />
    </Suspense>
  );
}
