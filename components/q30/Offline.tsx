"use client";

// "Save for offline": registers a service worker scoped to the course and asks it to fetch every booklet.
import { useEffect, useState } from "react";
import { load, save } from "@/components/games/daily";

const KEY = "q30:offline";

export function Offline({ urls }: { urls: string[] }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (load(KEY, false)) setState("saved");
  }, []);

  async function start() {
    if (!("serviceWorker" in navigator)) return setState("failed");
    setState("saving");
    try {
      await navigator.serviceWorker.register("/q30-sw.js", { scope: "/quran-in-30-days" });
      const reg = await navigator.serviceWorker.ready;
      navigator.serviceWorker.onmessage = (e) => {
        if (e.data?.type === "progress") setCount(e.data.done);
        if (e.data?.type === "done") {
          save(KEY, true);
          setState("saved");
        }
      };
      reg.active?.postMessage({ type: "cache", urls });
    } catch {
      setState("failed");
    }
  }

  if (state === "saved") return <span className="sh-offline is-saved">Saved for offline</span>;
  return (
    <button type="button" className="sh-offline" onClick={start} disabled={state === "saving"}>
      {state === "saving" ? `Saving… ${count}/${urls.length}` : state === "failed" ? "Offline not available here" : "Save for offline"}
    </button>
  );
}
