import { AppShell } from "@/components/layout/app-shell";
import { LocalGameScreen } from "@/components/game/local-game-screen";

export default function Page() {
  return (
    <AppShell view="play">
      <LocalGameScreen />
    </AppShell>
  );
}
