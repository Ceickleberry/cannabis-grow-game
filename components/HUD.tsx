"use client";

import { useGame } from "@/lib/gameState";

const SPEEDS = [
  { label: "1x", ms: 3000 },
  { label: "2x", ms: 1500 },
  { label: "5x", ms: 500 },
];

export default function HUD() {
  const { state, dispatch } = useGame();

  return (
    <header className="flex items-center justify-between bg-zinc-900 border-b border-zinc-700 px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">🌿</span>
        <h1 className="text-lg font-bold text-green-400 tracking-tight">GrowOps</h1>
      </div>

      <div className="flex items-center gap-6 text-sm">
        {state.prestigeCount > 0 && (
          <div className="text-zinc-300">
            <span className="text-zinc-500 mr-1">Run</span>
            <span className="font-mono font-bold text-yellow-400">#{state.prestigeCount + 1}</span>
          </div>
        )}
        <div className="text-zinc-300">
          <span className="text-zinc-500 mr-1">Day</span>
          <span className="font-mono font-bold text-white">{state.day}</span>
        </div>

        <div className="text-zinc-300">
          <span className="text-zinc-500 mr-1">Revenue</span>
          <span className="font-mono font-bold text-green-400">${state.money.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1">
          {SPEEDS.map(({ label, ms }) => (
            <button
              key={label}
              onClick={() => dispatch({ type: "SET_SPEED", speed: ms })}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                state.gameSpeed === ms && !state.isPaused
                  ? "bg-green-600 text-white"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => dispatch({ type: "TOGGLE_PAUSE" })}
            className={`px-2 py-1 rounded text-xs font-mono transition-colors ml-1 ${
              state.isPaused
                ? "bg-yellow-600 text-white"
                : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
            }`}
          >
            {state.isPaused ? "▶ Resume" : "⏸ Pause"}
          </button>
        </div>
      </div>
    </header>
  );
}
