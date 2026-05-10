"use client";

import { useState } from "react";
import { useGame } from "@/lib/gameState";
import {
  PRESTIGE_UPGRADES,
  PRESTIGE_THRESHOLD,
  prestigePointsAvailable,
  computeStartingMoney,
} from "@/lib/prestige";

export default function PrestigePanel() {
  const { state, dispatch } = useGame();
  const [confirming, setConfirming] = useState(false);

  const { lifetimeEarnings, prestigeCount, prestigePoints, prestigeUpgrades } = state;
  const eligible = lifetimeEarnings >= PRESTIGE_THRESHOLD;
  const pointsIfPrestige = prestigePointsAvailable(lifetimeEarnings);
  const progressPct = Math.min(100, (lifetimeEarnings / PRESTIGE_THRESHOLD) * 100);
  const nextStartingMoney = computeStartingMoney(prestigeUpgrades);

  function handlePrestige() {
    dispatch({ type: "PRESTIGE" });
    setConfirming(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Run stats */}
      <div className="bg-zinc-800 rounded-lg p-3 flex flex-col gap-2">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Run</span>
          <span className="text-white font-mono font-bold">#{prestigeCount + 1}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Prestige points</span>
          <span className="text-yellow-400 font-mono font-bold">{prestigePoints} pt</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">This-run revenue</span>
          <span className="text-green-400 font-mono">${lifetimeEarnings.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Prestige threshold</span>
          <span className="text-zinc-400 font-mono">${PRESTIGE_THRESHOLD.toLocaleString()}</span>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1 mt-1">
          <div className="w-full bg-zinc-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${eligible ? "bg-yellow-400" : "bg-zinc-500"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {!eligible && (
            <p className="text-xs text-zinc-600">
              ${(PRESTIGE_THRESHOLD - lifetimeEarnings).toLocaleString()} more revenue to unlock prestige
            </p>
          )}
        </div>
      </div>

      {/* Prestige action */}
      {eligible && !confirming && (
        <button
          onClick={() => setConfirming(true)}
          className="w-full py-2.5 rounded-lg bg-yellow-700 hover:bg-yellow-600 text-white text-sm font-semibold border border-yellow-500 transition-colors"
        >
          🏆 New Facility Run (+{pointsIfPrestige} pt{pointsIfPrestige !== 1 ? "s" : ""})
        </button>
      )}

      {confirming && (
        <div className="bg-yellow-950 border border-yellow-700 rounded-lg p-3 flex flex-col gap-2">
          <p className="text-xs text-yellow-300 font-semibold">⚠️ Confirm facility reset?</p>
          <p className="text-xs text-zinc-400">
            All plants, upgrades, and current funds will be lost. You'll start with{" "}
            <span className="text-white">${nextStartingMoney.toLocaleString()}</span> and earn{" "}
            <span className="text-yellow-400 font-bold">+{pointsIfPrestige} prestige pt{pointsIfPrestige !== 1 ? "s" : ""}</span>.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrestige}
              className="flex-1 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold transition-colors"
            >
              Confirm Reset
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Prestige upgrades shop */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Permanent Upgrades
        </h3>
        {PRESTIGE_UPGRADES.map((upgrade) => {
          const currentLevel = prestigeUpgrades[upgrade.id] ?? 0;
          const maxed = currentLevel >= upgrade.maxLevel;
          const canAfford = prestigePoints >= upgrade.costPerLevel && !maxed;

          return (
            <div
              key={upgrade.id}
              className={`rounded-lg border p-3 transition-all ${
                maxed
                  ? "border-yellow-800 bg-yellow-950/30"
                  : canAfford
                  ? "border-zinc-600 bg-zinc-800"
                  : "border-zinc-700 bg-zinc-800/50 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-white">
                  {upgrade.emoji} {upgrade.name}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Lv.{currentLevel}/{upgrade.maxLevel}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-2">{upgrade.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-yellow-400">
                  {currentLevel > 0 ? upgrade.effectLabel(currentLevel) : "Not purchased"}
                </span>
                {!maxed ? (
                  <button
                    onClick={() => dispatch({ type: "BUY_PRESTIGE_UPGRADE", upgradeId: upgrade.id })}
                    disabled={!canAfford}
                    className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                      canAfford
                        ? "bg-yellow-700 hover:bg-yellow-600 text-white border-yellow-600"
                        : "bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed"
                    }`}
                  >
                    {upgrade.costPerLevel} pt → Lv.{currentLevel + 1}
                  </button>
                ) : (
                  <span className="text-xs text-yellow-500 font-semibold">Maxed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
