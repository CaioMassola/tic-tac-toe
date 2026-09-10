import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { SoundToggle } from "./sound-toggle";
import { translations } from "@/lib/translations";
import * as sounds from "@/lib/sounds";

it("renders on the server, toggles mute and removes gesture listeners", () => {
  const t = translations["pt-BR"];
  expect(renderToString(<SoundToggle t={t} />)).toContain(t.muteSounds);
  const unlock = vi.spyOn(sounds, "unlockSounds").mockImplementation(() => {});
  const { unmount } = render(<SoundToggle t={t} />);
  fireEvent.pointerDown(window);
  fireEvent.keyDown(window, { key: "Enter" });
  expect(unlock).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole("button", { name: t.muteSounds }));
  expect(screen.getByRole("button", { name: t.enableSounds })).toHaveAttribute(
    "title",
    t.enableSounds,
  );
  fireEvent.click(screen.getByRole("button", { name: t.enableSounds }));
  expect(screen.getByRole("button", { name: t.muteSounds })).toBeVisible();
  unmount();
  unlock.mockClear();
  fireEvent.pointerDown(window);
  fireEvent.keyDown(window, { key: "Enter" });
  expect(unlock).not.toHaveBeenCalled();
});
