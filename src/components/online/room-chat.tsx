"use client";

import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { Symbol, Icon } from "@/components/icons";
import { useRoomChat } from "@/hooks/use-room-chat";
import type { Membership, Room } from "@/lib/rooms";
import type { TranslationProps } from "@/lib/translations";

export function RoomChat({
  membership,
  players,
  disabled,
  t,
}: TranslationProps & {
  membership: Membership;
  players: Room["players"];
  disabled: boolean;
}) {
  const { chat, connected, expired, pending, error, send, typing } = useRoomChat(
    membership.token,
  );
  const [draft, setDraft] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const unread = collapsed
    ? chat.messages.filter(
        (message) => message.mark !== membership.mark && !readIds.includes(message.id),
      ).length
    : 0;
  const [now, setNow] = useState(() => Date.now());
  const log = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const blocked = disabled || !connected || expired;
  const opponent = players.find((player) => player.mark !== membership.mark)!;
  const typingUntil = chat.typing[opponent.mark];
  const opponentTyping = !blocked && typingUntil && Date.parse(typingUntil) > now;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (nearBottom.current && log.current)
      log.current.scrollTop = log.current.scrollHeight;
  }, [chat.messages, collapsed]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (blocked || pending || !draft.trim()) return;
    if (await send(draft)) {
      setDraft("");
      nearBottom.current = true;
      typing(false);
    }
  }

  function toggleChat() {
    setReadIds(chat.messages.map((message) => message.id));
    setCollapsed(!collapsed);
    typing(false);
  }

  function trackScroll() {
    const element = log.current!;
    nearBottom.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 60;
  }

  function changeDraft(event: ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
    typing(event.target.value.trim().length > 0);
  }

  function stopTyping() {
    typing(false);
  }

  return (
    <aside
      className={`panel room-chat ${collapsed ? "room-chat-collapsed" : ""}`}
      aria-label={t.chatTitle}
    >
      <header className="p-5 border-b border-line">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{t.chatTitle}</h2>
          <span
            className={`text-[11px] flex items-center gap-2 ${blocked ? "text-muted" : "text-accent"}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {expired ? t.sessionExpired : blocked ? t.reconnecting : t.chatLive}
          </span>
          <button
            type="button"
            className="chat-toggle"
            aria-label={collapsed ? t.chatExpand : t.chatCollapse}
            aria-expanded={!collapsed}
            aria-controls="room-chat-content"
            onClick={toggleChat}
          >
            {unread > 0 && (
              <span className="chat-unread" aria-label={`${unread} ${t.chatUnread}`}>
                {unread}
              </span>
            )}
            <span aria-hidden="true">{collapsed ? "+" : "−"}</span>
          </button>
        </div>
        <p className="text-xs text-muted mt-1">{t.chatSubtitle}</p>
        <div className="flex gap-4 mt-5" hidden={collapsed}>
          {players.map((player) => (
            <div key={player.mark} className="flex items-center gap-2 min-w-0 flex-1">
              <span className={`chat-avatar chat-avatar-${player.mark}`}>
                <Symbol mark={player.mark} className="w-6 h-6" />
              </span>
              <span className="text-xs truncate">
                <strong className="block truncate">{player.nickname}</strong>
                <span className="text-muted">
                  {player.mark}
                  {player.mark === membership.mark && ` · ${t.chatYou}`}
                </span>
              </span>
            </div>
          ))}
        </div>
      </header>
      <div id="room-chat-content" hidden={collapsed} className="chat-content">
        <div
          ref={log}
          role="log"
          aria-label={t.chatTitle}
          aria-live="polite"
          aria-relevant="additions"
          className="chat-messages"
          onScroll={trackScroll}
        >
          {chat.messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-muted px-4">
              <Icon name="users" className="w-8 h-8 text-accent" />
              <p className="text-sm">{t.chatEmpty}</p>
              <p className="text-xs">{t.chatSession}</p>
            </div>
          )}
          {chat.messages.map((message) => {
            const own = message.mark === membership.mark;
            const player = players.find((player) => player.mark === message.mark)!;

            return (
              <div
                key={`${message.mark}-${message.id}`}
                className={`chat-message ${own ? "chat-message-own" : ""}`}
              >
                <span className={`chat-avatar chat-avatar-${message.mark}`}>
                  <Symbol mark={message.mark} className="w-5 h-5" />
                </span>
                <div className="min-w-0 max-w-[80%]">
                  <div className="flex items-center gap-2 mb-1 text-[10px] text-muted">
                    <strong className="truncate">{player.nickname}</strong>
                    <time dateTime={message.sentAt}>
                      {new Date(message.sentAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p className="chat-bubble">{message.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div aria-live="polite" className="h-7 px-5 text-xs text-muted">
          {opponentTyping && (
            <span className="flex items-center gap-2">
              <span className="typing-dots" aria-hidden="true">
                •••
              </span>
              {t.chatTyping.replace("{name}", () => opponent.nickname)}
            </span>
          )}
        </div>
        <form onSubmit={submit} className="p-4 pt-2 border-t border-line">
          {error && (
            <p role="alert" className="text-xs text-danger my-2">
              {t.chatFailed}
            </p>
          )}
          <label htmlFor="chat-message" className="sr-only">
            {t.chatMessage}
          </label>
          <div className="flex gap-2 mt-2">
            <input
              id="chat-message"
              className="input min-w-0"
              value={draft}
              maxLength={500}
              autoComplete="off"
              placeholder={t.chatPlaceholder}
              disabled={blocked || pending}
              onChange={changeDraft}
              onBlur={stopTyping}
            />
            <button
              type="submit"
              className="button-primary !px-3"
              disabled={blocked || pending || !draft.trim()}
              aria-label={pending ? t.chatSending : t.chatSend}
            >
              <Icon name="arrow" />
            </button>
          </div>
          <p className="text-[10px] text-muted text-right mt-2">{draft.length}/500</p>
        </form>
      </div>
    </aside>
  );
}
