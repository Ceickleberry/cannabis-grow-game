import type { GrowthStage } from "./types";

export interface PestEvent {
  id: string;
  name: string;
  description: string;
  emoji: string;
  treatCost: number;
  healthDrainPerDay: number;
  treatLabel: string;
  stages: GrowthStage[];
}

export const PEST_EVENTS: PestEvent[] = [
  {
    id: "spider-mites",
    name: "Spider Mites",
    description: "Stippled leaf damage, fine webbing on undersides. Thrives in warm, dry conditions.",
    emoji: "🕷️",
    treatCost: 150,
    healthDrainPerDay: 8,
    treatLabel: "Apply Miticide (AzaMax)",
    stages: ["vegetative", "flowering"],
  },
  {
    id: "powdery-mildew",
    name: "Powdery Mildew",
    description: "White powdery fungal coating on leaves. Spreads rapidly in humid rooms.",
    emoji: "🍄",
    treatCost: 100,
    healthDrainPerDay: 6,
    treatLabel: "Apply Sulfur Fungicide",
    stages: ["vegetative", "flowering"],
  },
  {
    id: "fungus-gnats",
    name: "Fungus Gnats",
    description: "Larvae damage roots and stunt growth. Indicator of overwatered medium.",
    emoji: "🦟",
    treatCost: 80,
    healthDrainPerDay: 4,
    treatLabel: "Apply BTi Drench",
    stages: ["seedling", "vegetative"],
  },
  {
    id: "botrytis",
    name: "Botrytis (Bud Rot)",
    description: "Gray mold penetrating dense buds. Catastrophic in late flower — act immediately.",
    emoji: "🦠",
    treatCost: 200,
    healthDrainPerDay: 12,
    treatLabel: "Remove Tissue + Copper Spray",
    stages: ["flowering"],
  },
  {
    id: "thrips",
    name: "Thrips",
    description: "Silver streaks on leaves from feeding damage. Vector for viral disease.",
    emoji: "🐛",
    treatCost: 120,
    healthDrainPerDay: 7,
    treatLabel: "Apply Spinosad Spray",
    stages: ["vegetative", "flowering"],
  },
  {
    id: "root-rot",
    name: "Root Rot",
    description: "Pythium infection causing brown, slimy roots. Caused by poor drainage or overwatering.",
    emoji: "🪱",
    treatCost: 175,
    healthDrainPerDay: 10,
    treatLabel: "Flush + Apply Beneficial Bacteria",
    stages: ["seedling", "vegetative"],
  },
];

export function getPestEvent(id: string): PestEvent {
  const e = PEST_EVENTS.find((p) => p.id === id);
  if (!e) throw new Error(`Unknown pest event: ${id}`);
  return e;
}

export function randomEventForStage(stage: GrowthStage): PestEvent | null {
  const eligible = PEST_EVENTS.filter((e) => e.stages.includes(stage));
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

export function eventSeverity(daysActive: number): "Mild" | "Moderate" | "Severe" {
  if (daysActive >= 10) return "Severe";
  if (daysActive >= 5) return "Moderate";
  return "Mild";
}
