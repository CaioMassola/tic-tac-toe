import { AppShell } from "@/components/layout/app-shell";
import { RulesScreen } from "@/components/rules/rules-screen";

export default function Page() {
  return (
    <AppShell view="rules">
      <RulesScreen />
    </AppShell>
  );
}
