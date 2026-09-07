import { AppShell } from "@/components/layout/app-shell";
import { OnlineScreen } from "@/components/online/online-screen";

export default function Page() {
  return (
    <AppShell view="online">
      <OnlineScreen />
    </AppShell>
  );
}
