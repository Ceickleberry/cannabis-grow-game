export type GrowthStage =
  | "germination"
  | "seedling"
  | "vegetative"
  | "flowering"
  | "ready"
  | "dead";

export const ACTIVE_STAGES = [
  "germination",
  "seedling",
  "vegetative",
  "flowering",
] as const;

export type ActiveStage = (typeof ACTIVE_STAGES)[number];

export function isActiveStage(stage: GrowthStage): stage is ActiveStage {
  return (ACTIVE_STAGES as readonly string[]).includes(stage);
}

export interface StageDurations {
  germination: number;
  seedling: number;
  vegetative: number;
  flowering: number;
}

export interface Strain {
  id: string;
  name: string;
  description: string;
  cloneCost: number;
  baseYieldGrams: number;
  pricePerGram: number;
  stageDurations: StageDurations;
  difficulty: "easy" | "medium" | "hard";
  emoji: string;
  thcPercent: number;
}

export interface PlantEvent {
  type: string;
  daysActive: number;
}

export interface Plant {
  id: string;
  strainId: string;
  stage: GrowthStage;
  health: number;
  daysInCurrentStage: number;
  totalDays: number;
  lastWateredDay: number;
  slot: number;
  event?: PlantEvent;
  completedTasks: string[];
}

export interface StrainStat {
  harvests: number;
  grams: number;
  earnings: number;
}

export interface GameState {
  money: number;
  day: number;
  plants: Plant[];
  selectedStrainId: string;
  gameSpeed: number;
  isPaused: boolean;
  log: string[];
  purchasedUpgrades: string[];
  // prestige — persists across resets
  lifetimeEarnings: number;
  prestigeCount: number;
  prestigePoints: number;
  prestigeUpgrades: Record<string, number>;
  // stats — run-scoped (reset on prestige)
  runHarvests: number;
  runGrams: number;
  runBestBatch: number;
  // stats — all-time (persist across prestiges)
  allTimeEarnings: number;
  allTimeHarvests: number;
  allTimeGrams: number;
  allTimeBestBatch: number;
  strainStats: Record<string, StrainStat>;
}

export type GameAction =
  | { type: "ADVANCE_DAY" }
  | { type: "PLANT_SEED"; slot: number }
  | { type: "WATER_PLANT"; plantId: string }
  | { type: "HARVEST_PLANT"; plantId: string }
  | { type: "SELECT_STRAIN"; strainId: string }
  | { type: "SET_SPEED"; speed: number }
  | { type: "TOGGLE_PAUSE" }
  | { type: "BUY_UPGRADE"; upgradeId: string }
  | { type: "TREAT_EVENT"; plantId: string }
  | { type: "PERFORM_TASK"; plantId: string; taskId: string }
  | { type: "PRESTIGE" }
  | { type: "BUY_PRESTIGE_UPGRADE"; upgradeId: string }
  | { type: "LOAD_STATE"; state: GameState };
