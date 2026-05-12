"use client";

import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Badge, Panel } from "@meme-foundry/ui";

type RealtimeMessage = {
  type: string;
  title: string;
  detail: string;
};

export function RealtimeStatus({
  tokenId,
  seasonId,
  userId
}: {
  tokenId?: string;
  seasonId?: string | null;
  userId?: string;
}) {
  const [state, setState] = useState<"connecting" | "live" | "degraded">(
    "connecting"
  );
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const url = useMemo(() => {
    if (process.env.NEXT_PUBLIC_REALTIME_URL) {
      return process.env.NEXT_PUBLIC_REALTIME_URL;
    }
    return typeof window === "undefined" ? undefined : window.location.origin;
  }, []);

  useEffect(() => {
    const socket: Socket = io(url, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      timeout: 2500,
      transports: ["websocket", "polling"]
    });

    function push(message: RealtimeMessage) {
      setMessages((current) => [message, ...current].slice(0, 4));
    }

    socket.on("connect", () => {
      setState("live");
      if (tokenId) socket.emit("subscribe:token", { tokenId });
      if (seasonId) {
        socket.emit("subscribe:season", { seasonId });
        socket.emit("subscribe:leaderboard", { seasonId });
      }
      if (userId) socket.emit("subscribe:user", { userId });
    });
    socket.on("disconnect", () => setState("degraded"));
    socket.io.on("reconnect_attempt", () => setState("connecting"));
    socket.io.on("reconnect_failed", () => setState("degraded"));
    socket.on("connect_error", () => setState("degraded"));

    socket.on("TOKEN_TICK", (event) => {
      push({
        type: "TOKEN_TICK",
        title: "Live tick received",
        detail: `Market cap ${Math.round(event.marketCap).toLocaleString()} · holders ${event.holders}`
      });
    });
    socket.on("TOKEN_EVENT", (event) => {
      push({
        type: "TOKEN_EVENT",
        title: event.event.title,
        detail: event.event.description
      });
    });
    socket.on("SUPPORT_ACTION", (event) => {
      push({
        type: "SUPPORT_ACTION",
        title: `${event.user.username} supported this launch`,
        detail: `${event.actionType} changed ${Object.keys(event.effects).join(", ")}`
      });
    });
    socket.on("CREW_ACTION", (event) => {
      push({
        type: "CREW_ACTION",
        title: "Crew support landed",
        detail: `${event.actionType} changed ${Object.keys(event.effects).join(", ")}`
      });
    });
    socket.on("GRADUATION_ALERT", (event) => {
      push({
        type: "GRADUATION_ALERT",
        title: "Graduation alert",
        detail: `${event.graduationType} at ${Math.round(event.marketCap).toLocaleString()} market cap`
      });
    });
    socket.on("LEADERBOARD_UPDATE", (event) => {
      push({
        type: "LEADERBOARD_UPDATE",
        title: "Leaderboard updated",
        detail: `${event.category} rankings refreshed`
      });
    });
    socket.on("NARRATIVE_UPDATE", (event) => {
      push({
        type: "NARRATIVE_UPDATE",
        title: "Narrative moved",
        detail: `${event.slug}: heat ${event.heat}, saturation ${event.saturation}`
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [seasonId, tokenId, url, userId]);

  return (
    <Panel data-testid="realtime-status-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Realtime
          </p>
          <h2 className="mt-1 font-black text-white">
            {state === "live"
              ? "Live updates connected"
              : state === "connecting"
                ? "Connecting live updates"
                : "Realtime degraded"}
          </h2>
          <p className="mt-2 text-sm leading-5 text-slate-400">
            {state === "degraded"
              ? "The game still works. Refresh or keep playing while the app reconnects."
              : "Token ticks, events, leaderboard changes, and alerts appear here without a page refresh."}
          </p>
        </div>
        <Badge
          tone={
            state === "live"
              ? "good"
              : state === "degraded"
                ? "warn"
                : "neutral"
          }
        >
          {state}
        </Badge>
      </div>
      <div className="mt-4 grid gap-2" data-testid="realtime-message-feed">
        {messages.length ? (
          messages.map((message, index) => (
            <div
              className="rounded-md bg-slate-950/55 p-3"
              key={`${message.type}-${index}`}
            >
              <p className="font-black text-white">{message.title}</p>
              <p className="mt-1 text-sm leading-5 text-slate-400">
                {message.detail}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-md bg-slate-950/45 p-3 text-sm text-slate-400">
            Waiting for the next live update.
          </p>
        )}
      </div>
    </Panel>
  );
}
