"use client";

import { useRoomForm } from "@/hooks/use-room-form";
import { Icon } from "@/components/icons";
import { ConnectionNotice } from "./connection-notice";
import type { TranslationProps } from "@/lib/translations";
import { RoomLobby } from "./room-lobby";

export function RoomForm({ t }: TranslationProps) {
  const {
    mode,
    nickname,
    code,
    error,
    pending,
    membership,
    handleModeChange,
    handleNicknameChange,
    handleCodeChange,
    handleSubmit,
  } = useRoomForm();

  if (membership) return <RoomLobby membership={membership} t={t} />;

  return (
    <>
      <ConnectionNotice t={t} />
      <section className="panel p-6 sm:p-8">
        <div className="segmented grid grid-cols-2 gap-1 p-1 mb-8">
          {(["create", "join"] as const).map((value) => (
            <button
              key={value}
              aria-pressed={mode === value}
              className={mode === value ? "selected" : ""}
              value={value}
              disabled={pending}
              onClick={handleModeChange}
            >
              {t[value]}
            </button>
          ))}
        </div>
        <h2 className="text-2xl font-bold">{t[mode]}</h2>
        <p className="text-sm text-muted mt-2 mb-7">
          {mode === "create" ? t.createDesc : t.joinDesc}
        </p>
        <form noValidate onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-2" htmlFor="nickname">
            {t.nickname}
          </label>
          <input
            id="nickname"
            className="input"
            maxLength={20}
            disabled={pending}
            value={nickname}
            onChange={handleNicknameChange}
            placeholder={t.nicknamePlaceholder}
            autoComplete="nickname"
            aria-invalid={error === "invalidName"}
            aria-describedby={error === "invalidName" ? "room-error" : undefined}
          />
          {mode === "join" && (
            <div className="mt-5">
              <label className="block text-sm font-medium mb-2" htmlFor="room-code">
                {t.code}
              </label>
              <input
                id="room-code"
                className="input font-mono uppercase tracking-[3px]"
                maxLength={6}
                disabled={pending}
                value={code}
                onChange={handleCodeChange}
                placeholder={t.codePlaceholder}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={error === "invalidCode"}
                aria-describedby={error === "invalidCode" ? "room-error" : undefined}
              />
            </div>
          )}
          {error && (
            <p id="room-error" role="alert" className="form-alert mt-4">
              {t[error]}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="button-primary w-full mt-6"
          >
            {pending ? t.connecting : mode === "create" ? t.createButton : t.joinButton}
            <Icon name="arrow" />
          </button>
          <p className="text-center text-[11px] text-muted mt-4">{t.onlineNote}</p>
        </form>
      </section>
    </>
  );
}
