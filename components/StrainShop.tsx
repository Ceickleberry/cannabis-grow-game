"use client";

import { STRAINS, getTotalGrowDays } from "@/lib/strains";
import { useGame } from "@/lib/gameState";

const DIFFICULTY_LABELS = {
  easy: { label: "Stable", color: "text-green-400" },
  medium: { label: "Moderate", color: "text-yellow-400" },
  hard: { label: "Sensitive", color: "text-red-400" },
};

export default function StrainShop() {
  const { state, dispatch, effects } = useGame();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Clone Room</h2>
      <p className="text-xs text-zinc-500">Select a cultivar, then click an empty bay to drop a clone.</p>
      <div className="flex flex-col gap-2">
        {STRAINS.map((strain) => {
          const isSelected = state.selectedStrainId === strain.id;
          const effectiveCost = Math.round(strain.cloneCost * effects.cloneCostMultiplier);
          const canAfford = state.money >= effectiveCost;
          const diff = DIFFICULTY_LABELS[strain.difficulty];
          return (
            <button
              key={strain.id}
              onClick={() => dispatch({ type: "SELECT_STRAIN", strainId: strain.id })}
              className={`text-left rounded-lg border p-3 transition-all ${
                isSelected
                  ? "border-green-500 bg-green-950"
                  : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-white">
                  {strain.emoji} {strain.name}
                </span>
                <span className={`text-xs font-mono ${canAfford ? "text-green-400" : "text-red-400"}`}>
                  ${effectiveCost}/clone
                  {effectiveCost < strain.cloneCost && (
                    <span className="text-zinc-600 line-through ml-1">${strain.cloneCost}</span>
                  )}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-2">{strain.description}</p>
              <div className="flex gap-3 text-xs flex-wrap">
                <span className="text-zinc-500">
                  THC <span className="text-white">{strain.thcPercent}%</span>
                </span>
                <span className="text-zinc-500">
                  Yield <span className="text-white">{strain.baseYieldGrams}g</span>
                </span>
                <span className="text-zinc-500">
                  Cycle <span className="text-white">{getTotalGrowDays(strain)}d</span>
                </span>
                <span className="text-zinc-500">
                  Wholesale <span className="text-white">${strain.pricePerGram}/g</span>
                </span>
                <span className={diff.color}>{diff.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
