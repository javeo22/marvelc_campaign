"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineStatus() {
  return navigator.onLine;
}

function getServerOnlineStatus() {
  return true;
}

export function PwaController() {
  const online = useSyncExternalStore(subscribeToOnlineStatus, getOnlineStatus, getServerOnlineStatus);
  const [ready, setReady] = useState(false);
  const cardImageLabel = process.env.NEXT_PUBLIC_CARD_IMAGE_MODE === "remote" ? "remote card images" : "card images off";

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => setReady(true))
        .catch(() => setReady(false));
    }
  }, []);

  return (
    <div className="status-banner" role="status" aria-live="polite">
      <strong>{online ? "Online" : "Offline"}</strong> · Campaign content and local saves stay available.
      <span className="small"> PWA {ready ? "ready" : "initializing"} · {cardImageLabel}</span>
    </div>
  );
}
