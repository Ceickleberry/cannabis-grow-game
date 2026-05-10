"use client";

import { useGame } from "@/lib/gameState";

export default function ActivityLog() {
  const { state } = useGame();

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 flex flex-col gap-2">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Activity Log</h2>
      <div className="flex flex-col gap-1 overflow-y-auto max-h-40">
        {state.log.map((entry, i) => (
          <p
            key={i}
            className={`text-xs font-mono ${i === 0 ? "text-zinc-200" : "text-zinc-500"}`}
          >
            {entry}
          </p>
        ))}
      </div>
    </div>
  );
}
