import type { ActiveStage } from "./types";
import { prestigeLevel } from "./prestige";

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  emoji: string;
  prereq?: string;
}

export const UPGRADES: Upgrade[] = [
  {
    id: "led-lights",
    name: "Commercial LED Bars",
    description: "Full-spectrum LED light bars cut flowering time by 20% and reduce heat load.",
    cost: 500,
    emoji: "💡",
  },
  {
    id: "nutrients",
    name: "Custom Feed Program",
    description: "Strain-specific nutrient schedule increases harvest weight by 25%.",
    cost: 400,
    emoji: "🧪",
  },
  {
    id: "auto-water",
    name: "Automated Fertigation",
    description: "Timed drip lines extend the irrigation interval from 3 to 6 days.",
    cost: 600,
    emoji: "💧",
  },
  {
    id: "co2-injector",
    name: "CO₂ Enrichment System",
    description: "Elevated CO₂ to 1200 ppm accelerates vegetative growth by 20%.",
    cost: 700,
    emoji: "🌬️",
  },
  {
    id: "climate-ctrl",
    name: "HVAC & Dehumidification",
    description: "Precise environmental control halves plant stress and reduces pest risk.",
    cost: 900,
    emoji: "🌡️",
  },
  {
    id: "extra-slots-1",
    name: "Additional Cultivation Bay",
    description: "Expand the flower room to add 3 more plant sites (6 → 9).",
    cost: 800,
    emoji: "🏗️",
  },
  {
    id: "extra-slots-2",
    name: "Second Flower Room",
    description: "Full room build-out adds 3 more sites (9 → 12). Requires Additional Cultivation Bay.",
    cost: 2500,
    emoji: "🏭",
    prereq: "extra-slots-1",
  },
  {
    id: "canopy-training",
    name: "Canopy Training Protocol",
    description: "Trained crew automatically handles pruning, defoliation, and trellising on every plant the moment the window opens.",
    cost: 1200,
    emoji: "🌳",
    prereq: "nutrients",
  },
];

export interface GrowEffects {
  waterInterval: number;
  healthDropPerDay: number;
  yieldMultiplier: number;
  priceMultiplier: number;
  cloneCostMultiplier: number;
  floweringSpeedMult: number;
  vegetativeSpeedMult: number;
  numSlots: number;
  eventSpawnChance: number;
  autoTasks: boolean;
}

export function computeEffects(
  purchased: string[],
  prestigeUpgrades: Record<string, number>
): GrowEffects {
  const has = (id: string) => purchased.includes(id);
  const pl = (id: string) => prestigeLevel(id, prestigeUpgrades);

  return {
    waterInterval: has("auto-water") ? 6 : 3,
    healthDropPerDay: has("climate-ctrl") ? 7 : 15,
    yieldMultiplier: (has("nutrients") ? 1.25 : 1) * (1 + pl("veteran-staff") * 0.05),
    priceMultiplier: 1 + pl("facility-reputation") * 0.1,
    cloneCostMultiplier: Math.max(0.5, 1 - pl("seed-bank") * 0.1),
    floweringSpeedMult: has("led-lights") ? 0.8 : 1,
    vegetativeSpeedMult: has("co2-injector") ? 0.8 : 1,
    numSlots: 6 + (has("extra-slots-1") ? 3 : 0) + (has("extra-slots-2") ? 3 : 0),
    eventSpawnChance: Math.max(
      0.005,
      ((has("climate-ctrl") ? 15 : 30) - pl("ipm-protocol") * 5) / 1000
    ),
    autoTasks: has("canopy-training"),
  };
}

export function effectiveStageDuration(
  stage: ActiveStage,
  baseDuration: number,
  effects: GrowEffects
): number {
  if (stage === "flowering") return Math.ceil(baseDuration * effects.floweringSpeedMult);
  if (stage === "vegetative") return Math.ceil(baseDuration * effects.vegetativeSpeedMult);
  return baseDuration;
}
