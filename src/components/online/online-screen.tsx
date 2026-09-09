"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { useTranslation } from "@/hooks/use-translation";
import { RoomForm } from "./room-form";

export function OnlineScreen() {
  const t = useTranslation();

  return (
    <>
      <div className="pt-3 sm:pt-4 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted text-xs hover:text-foreground mb-9"
        >
          <Icon name="back" className="w-4 h-4" />
          {t.back}
        </Link>
        <h1 className="eyebrow">{t.onlineLabel}</h1>
      </div>
      <div className="w-full mx-auto">
        <RoomForm t={t} />
      </div>
    </>
  );
}
