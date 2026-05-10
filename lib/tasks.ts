import type { GrowthStage } from "./types";

export interface PlantTask {
  id: string;
  label: string;
  emoji: string;
  description: string;
  stage: GrowthStage;
  windowDays: number;
  yieldBonus: number;
  healthBonus: number;
}

export const PLANT_TASKS: PlantTask[] = [
  {
    id: "pruning",
    label: "Pruning",
    emoji: "✂️",
    description: "Remove lower shoots to direct energy to top colas.",
    stage: "seedling",
    windowDays: 5,
    yieldBonus: 0.10,
    healthBonus: 0,
  },
  {
    id: "defoliation",
    label: "Defoliation",
    emoji: "🍃",
    description: "Strip fan leaves to improve light penetration and airflow.",
    stage: "vegetative",
    windowDays: 12,
    yieldBonus: 0.15,
    healthBonus: 5,
  },
  {
    id: "trellising",
    label: "SCROG Net",
    emoji: "🕸️",
    description: "Net the canopy to maximize and even out flower sites.",
    stage: "flowering",
    windowDays: 7,
    yieldBonus: 0.20,
    healthBonus: 0,
  },
];

export function getPlantTask(id: string): PlantTask | undefined {
  return PLANT_TASKS.find((t) => t.id === id);
}

export function availableTasksForPlant(
  stage: GrowthStage,
  daysInStage: number,
  completedTasks: string[]
): PlantTask[] {
  return PLANT_TASKS.filter(
    (t) =>
      t.stage === stage &&
      daysInStage < t.windowDays &&
      !completedTasks.includes(t.id)
  );
}

export function taskYieldBonus(completedTasks: string[]): number {
  return completedTasks.reduce((total, id) => {
    const task = getPlantTask(id);
    return total + (task?.yieldBonus ?? 0);
  }, 0);
}
