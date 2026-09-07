"use client";

import { Icon } from "@/components/icons";
import { PageIntro } from "@/components/shared/page-intro";
import { useTranslation } from "@/hooks/use-translation";
import { RoomForm } from "./room-form";
import { OnlineSteps } from "./online-steps";

export function OnlineScreen() {
  const t = useTranslation();

  return (
    <>
      <PageIntro
        t={t}
        label={t.onlineLabel}
        title={t.onlineHeading}
        subtitle={t.onlineSub}
      />
      <div className="connection-notice flex gap-3 mb-7">
        <Icon name="info" className="mt-0.5" />
        <div>
          <h2 className="font-semibold text-sm">{t.connectionTitle}</h2>
          <p className="text-sm text-muted leading-6 mt-1 max-w-3xl">
            {t.connectionDesc}
          </p>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_0.9fr] gap-7">
        <RoomForm t={t} />
        <OnlineSteps t={t} />
      </div>
    </>
  );
}
