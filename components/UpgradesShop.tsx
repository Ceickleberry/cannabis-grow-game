"use client";

import { UPGRADES } from "@/lib/upgrades";
import { useGame } from "@/lib/gameState";

export default function UpgradesShop() {
  const { state, dispatch } = useGame();
  const { purchasedUpgrades, money } = state;

  return (
    <div className="flex flex-col gap-2">
      {UPGRADES.map((upgrade) => {
        const purchased = purchasedUpgrades.includes(upgrade.id);
        const prereqMet = !upgrade.prereq || purchasedUpgrades.includes(upgrade.prereq);
        const canAfford = money >= upgrade.cost;
        const available = !purchased && prereqMet;

        let statusClass = "";
        let statusLabel = "";
        if (purchased) {
          statusClass = "border-green-700 bg-green-950/40";
          statusLabel = "Owned";
        } else if (!prereqMet) {
          statusClass = "border-zinc-800 opacity-50";
          statusLabel = "Locked";
        } else if (!canAfford) {
          statusClass = "border-zinc-700 bg-zinc-800/40";
          statusLabel = `$${upgrade.cost.toLocaleString()}`;
        } else {
          statusClass = "border-zinc-600 bg-zinc-800/40 hover:border-green-600 hover:bg-green-950/20 cursor-pointer";
          statusLabel = `$${upgrade.cost.toLocaleString()}`;
        }

        return (
          <button
            key={upgrade.id}
            disabled={!available || !canAfford}
            onClick={() => dispatch({ type: "BUY_UPGRADE", upgradeId: upgrade.id })}
            className={`text-left rounded-lg border p-3 transition-all ${statusClass}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-white">
                {upgrade.emoji} {upgrade.name}
              </span>
              <span
                className={`text-xs font-mono ${
                  purchased
                    ? "text-green-400"
                    : canAfford && available
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {purchased ? "✓ Owned" : statusLabel}
              </span>
            </div>
            <p className="text-xs text-zinc-400">{upgrade.description}</p>
            {!prereqMet && upgrade.prereq && (
              <p className="text-xs text-zinc-600 mt-1">
                Requires: {UPGRADES.find((u) => u.id === upgrade.prereq)?.name}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
