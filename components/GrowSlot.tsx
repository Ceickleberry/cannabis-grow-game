"use client";

import { useGame } from "@/lib/gameState";
import { getStrain } from "@/lib/strains";
import { isActiveStage } from "@/lib/types";
import type { Plant } from "@/lib/types";
import { effectiveStageDuration } from "@/lib/upgrades";
import type { GrowEffects } from "@/lib/upgrades";
import { getPestEvent, eventSeverity } from "@/lib/events";

const STAGE_LABELS: Record<string, string> = {
  germination: "Germinating",
  seedling: "Seedling",
  vegetative: "Vegetative",
  flowering: "Flowering",
  ready: "Ready!",
  dead: "Lost",
};

const STAGE_COLORS: Record<string, string> = {
  germination: "bg-yellow-900 text-yellow-300 border-yellow-700",
  seedling: "bg-lime-900 text-lime-300 border-lime-700",
  vegetative: "bg-green-900 text-green-300 border-green-700",
  flowering: "bg-purple-900 text-purple-300 border-purple-700",
  ready: "bg-emerald-900 text-emerald-300 border-emerald-500",
  dead: "bg-zinc-800 text-zinc-500 border-zinc-600",
};

const PLANT_EMOJI: Record<string, string> = {
  germination: "🌰",
  seedling: "🌱",
  vegetative: "🌿",
  flowering: "🌸",
  ready: "🌟",
  dead: "💀",
};

const SEVERITY_COLORS = {
  Mild: "border-yellow-600 bg-yellow-950/60 text-yellow-300",
  Moderate: "border-orange-600 bg-orange-950/60 text-orange-300",
  Severe: "border-red-600 bg-red-950/60 text-red-300",
};

function HealthBar({ health }: { health: number }) {
  const color =
    health > 60 ? "bg-green-500" : health > 30 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full bg-zinc-700 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${health}%` }}
      />
    </div>
  );
}

function StageProgress({ plant, effects }: { plant: Plant; effects: GrowEffects }) {
  if (!isActiveStage(plant.stage)) return null;
  const strain = getStrain(plant.strainId);
  const duration = effectiveStageDuration(plant.stage, strain.stageDurations[plant.stage], effects);
  const pct = Math.min(100, (plant.daysInCurrentStage / duration) * 100);
  return (
    <div className="w-full bg-zinc-700 rounded-full h-1">
      <div
        className="h-1 rounded-full bg-purple-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface GrowSlotProps {
  slot: number;
}

export default function GrowSlot({ slot }: GrowSlotProps) {
  const { state, dispatch, plantInSlot, effects } = useGame();
  const plant = plantInSlot(slot);
  const selectedStrain = getStrain(state.selectedStrainId);
  const effectiveCloneCost = Math.round(selectedStrain.cloneCost * effects.cloneCostMultiplier);
  const canAfford = state.money >= effectiveCloneCost;

  if (!plant || plant.stage === "dead") {
    return (
      <button
        onClick={() => dispatch({ type: "PLANT_SEED", slot })}
        disabled={!canAfford}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-all min-h-[180px] ${
          canAfford
            ? "border-zinc-600 hover:border-green-600 hover:bg-green-950 cursor-pointer"
            : "border-zinc-700 opacity-40 cursor-not-allowed"
        }`}
      >
        <span className="text-3xl">🌱</span>
        <span className="text-xs text-zinc-400">Bay {slot + 1}</span>
        <span className="text-xs text-zinc-500">
          Drop clone — {selectedStrain.emoji} {selectedStrain.name}
        </span>
        <span className={`text-xs font-mono ${canAfford ? "text-green-400" : "text-red-400"}`}>
          ${effectiveCloneCost} / clone
        </span>
      </button>
    );
  }

  const strain = getStrain(plant.strainId);
  const stageDuration = isActiveStage(plant.stage)
    ? effectiveStageDuration(plant.stage, strain.stageDurations[plant.stage], effects)
    : null;

  const activeEvent = plant.event ? getPestEvent(plant.event.type) : null;
  const severity = plant.event ? eventSeverity(plant.event.daysActive) : null;
  const canAffordTreat = activeEvent ? state.money >= activeEvent.treatCost : false;

  const cardBorder =
    plant.stage === "ready"
      ? "border-emerald-500 bg-emerald-950/30"
      : activeEvent
      ? severity === "Severe"
        ? "border-red-600 bg-red-950/20"
        : severity === "Moderate"
        ? "border-orange-600 bg-orange-950/10"
        : "border-yellow-600 bg-yellow-950/10"
      : "border-zinc-700 bg-zinc-800/50";

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 min-h-[180px] ${cardBorder}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{PLANT_EMOJI[plant.stage]}</span>
          <div>
            <p className="text-sm font-semibold text-white">{strain.name}</p>
            <p className="text-xs text-zinc-500">Bay {slot + 1}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STAGE_COLORS[plant.stage]}`}>
          {STAGE_LABELS[plant.stage]}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Health</span>
          <span className={plant.health > 60 ? "text-green-400" : plant.health > 30 ? "text-yellow-400" : "text-red-400"}>
            {plant.health}%
          </span>
        </div>
        <HealthBar health={plant.health} />
      </div>

      {stageDuration && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Stage progress</span>
            <span>{plant.daysInCurrentStage}/{stageDuration}d</span>
          </div>
          <StageProgress plant={plant} effects={effects} />
        </div>
      )}

      {activeEvent && severity && (
        <div className={`rounded-lg border p-2 flex flex-col gap-1.5 ${SEVERITY_COLORS[severity]}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">
              {activeEvent.emoji} {activeEvent.name}
            </span>
            <span className="text-xs opacity-75">
              {severity} · Day {plant.event!.daysActive + 1}
            </span>
          </div>
          <p className="text-xs opacity-70">{activeEvent.treatLabel}</p>
        </div>
      )}

      <div className="flex gap-2 mt-auto flex-wrap">
        {plant.stage !== "ready" && (
          <button
            onClick={() => dispatch({ type: "WATER_PLANT", plantId: plant.id })}
            className="flex-1 text-xs py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-blue-300 border border-blue-700 transition-colors"
          >
            💧 Irrigate
          </button>
        )}
        {activeEvent && (
          <button
            onClick={() => dispatch({ type: "TREAT_EVENT", plantId: plant.id })}
            disabled={!canAffordTreat}
            className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
              canAffordTreat
                ? "bg-orange-900 hover:bg-orange-800 text-orange-200 border-orange-700"
                : "bg-zinc-800 text-zinc-500 border-zinc-700 opacity-50 cursor-not-allowed"
            }`}
          >
            🧴 Treat ${activeEvent.treatCost}
          </button>
        )}
        {plant.stage === "ready" && (
          <button
            onClick={() => dispatch({ type: "HARVEST_PLANT", plantId: plant.id })}
            className="flex-1 text-xs py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 transition-colors font-semibold"
          >
            ✂️ Harvest Batch
          </button>
        )}
      </div>
    </div>
  );
}
