"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { GameState, GameAction, Plant, GrowthStage } from "./types";
import { isActiveStage } from "./types";
import { getStrain } from "./strains";
import { UPGRADES, computeEffects, effectiveStageDuration, type GrowEffects } from "./upgrades";
import { getPestEvent, randomEventForStage } from "./events";
import {
  PRESTIGE_UPGRADES,
  PRESTIGE_THRESHOLD,
  prestigePointsAvailable,
  computeStartingMoney,
} from "./prestige";
import { autoSave, loadAutoSave, mergeWithDefaults } from "./saveSystem";

const MAX_LOG = 20;

const STAGE_ORDER: GrowthStage[] = [
  "germination",
  "seedling",
  "vegetative",
  "flowering",
  "ready",
];

const EVENT_ELIGIBLE_STAGES: GrowthStage[] = ["seedling", "vegetative", "flowering"];

function nextStage(stage: GrowthStage): GrowthStage {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : stage;
}

function advancePlant(plant: Plant, day: number, effects: GrowEffects): Plant {
  if (plant.stage === "dead" || plant.stage === "ready") return plant;

  const strain = getStrain(plant.strainId);
  let health = plant.health;

  // Dehydration drain
  if (day - plant.lastWateredDay > effects.waterInterval) {
    health = Math.max(0, health - effects.healthDropPerDay);
  }

  // Pest/disease drain — severity compounds over time
  let updatedEvent = plant.event;
  if (plant.event) {
    const eventDef = getPestEvent(plant.event.type);
    const newDaysActive = plant.event.daysActive + 1;
    const severityMult = newDaysActive >= 10 ? 2 : newDaysActive >= 5 ? 1.5 : 1;
    health = Math.max(0, health - Math.ceil(eventDef.healthDrainPerDay * severityMult));
    updatedEvent = { ...plant.event, daysActive: newDaysActive };
  }

  if (health === 0) return { ...plant, health: 0, stage: "dead", event: undefined };

  const newDaysInStage = plant.daysInCurrentStage + 1;
  const newTotalDays = plant.totalDays + 1;

  if (isActiveStage(plant.stage)) {
    const duration = effectiveStageDuration(
      plant.stage,
      strain.stageDurations[plant.stage],
      effects
    );
    if (newDaysInStage >= duration) {
      return {
        ...plant,
        health,
        event: updatedEvent,
        stage: nextStage(plant.stage),
        daysInCurrentStage: 0,
        totalDays: newTotalDays,
      };
    }
  }

  return { ...plant, health, event: updatedEvent, daysInCurrentStage: newDaysInStage, totalDays: newTotalDays };
}

function addLog(log: string[], entry: string): string[] {
  return [entry, ...log].slice(0, MAX_LOG);
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ADVANCE_DAY": {
      const newDay = state.day + 1;
      const effects = computeEffects(state.purchasedUpgrades, state.prestigeUpgrades);
      let newPlants = state.plants.map((p) => advancePlant(p, newDay, effects));
      let log = state.log;

      // Log stage transitions
      newPlants.forEach((plant, i) => {
        const prev = state.plants[i];
        if (plant.stage === "ready" && prev.stage !== "ready") {
          const strain = getStrain(plant.strainId);
          log = addLog(log, `Day ${newDay}: ${strain.name} (bay ${plant.slot + 1}) ready for harvest. 🌟`);
        }
        if (plant.stage === "dead" && prev.stage !== "dead") {
          const strain = getStrain(plant.strainId);
          log = addLog(log, `Day ${newDay}: ${strain.name} (bay ${plant.slot + 1}) lost — dehydration stress. 💀`);
        }
      });

      // Spawn pest events on eligible plants without one
      newPlants = newPlants.map((p) => {
        if (!EVENT_ELIGIBLE_STAGES.includes(p.stage) || p.event) return p;
        if (Math.random() < effects.eventSpawnChance) {
          const eventDef = randomEventForStage(p.stage);
          if (!eventDef) return p;
          log = addLog(log, `Day ${newDay}: ${eventDef.name} detected in bay ${p.slot + 1}. Treat ASAP! ${eventDef.emoji}`);
          return { ...p, event: { type: eventDef.id, daysActive: 0 } };
        }
        return p;
      });

      // Spread from untreated events 5+ days old
      const spreading = newPlants.filter((p) => p.event && p.event.daysActive >= 5 && p.stage !== "dead");
      if (spreading.length > 0) {
        newPlants = newPlants.map((p) => {
          if (!EVENT_ELIGIBLE_STAGES.includes(p.stage) || p.event) return p;
          if (Math.random() < 0.1) {
            const source = spreading[Math.floor(Math.random() * spreading.length)];
            const eventDef = getPestEvent(source.event!.type);
            log = addLog(log, `Day ${newDay}: ${eventDef.name} spread to bay ${p.slot + 1}! ${eventDef.emoji}`);
            return { ...p, event: { type: source.event!.type, daysActive: 0 } };
          }
          return p;
        });
      }

      return { ...state, day: newDay, plants: newPlants, log };
    }

    case "PLANT_SEED": {
      const strain = getStrain(state.selectedStrainId);
      const effects = computeEffects(state.purchasedUpgrades, state.prestigeUpgrades);
      const effectiveCost = Math.round(strain.cloneCost * effects.cloneCostMultiplier);
      if (state.money < effectiveCost) return state;
      if (state.plants.some((p) => p.slot === action.slot && p.stage !== "dead")) return state;

      const newPlant: Plant = {
        id: `${Date.now()}-${action.slot}`,
        strainId: state.selectedStrainId,
        stage: "germination",
        health: 100,
        daysInCurrentStage: 0,
        totalDays: 0,
        lastWateredDay: state.day,
        slot: action.slot,
      };

      const plants = [...state.plants.filter((p) => p.slot !== action.slot), newPlant];
      const log = addLog(state.log, `Day ${state.day}: Clone dropped — ${strain.name} in bay ${action.slot + 1}. 🌱`);
      return { ...state, money: state.money - effectiveCost, plants, log };
    }

    case "WATER_PLANT": {
      const plants = state.plants.map((p) =>
        p.id === action.plantId
          ? { ...p, lastWateredDay: state.day, health: Math.min(100, p.health + 20) }
          : p
      );
      return { ...state, plants };
    }

    case "HARVEST_PLANT": {
      const plant = state.plants.find((p) => p.id === action.plantId);
      if (!plant || plant.stage !== "ready") return state;

      const strain = getStrain(plant.strainId);
      const effects = computeEffects(state.purchasedUpgrades, state.prestigeUpgrades);
      const yieldGrams = Math.round(strain.baseYieldGrams * (plant.health / 100) * effects.yieldMultiplier);
      const earnings = Math.round(yieldGrams * strain.pricePerGram * effects.priceMultiplier);

      const plants = state.plants.filter((p) => p.id !== action.plantId);
      const log = addLog(
        state.log,
        `Day ${state.day}: Batch harvested — ${strain.name} ${yieldGrams}g → $${earnings.toLocaleString()} 💰`
      );
      return {
        ...state,
        money: state.money + earnings,
        lifetimeEarnings: state.lifetimeEarnings + earnings,
        plants,
        log,
      };
    }

    case "TREAT_EVENT": {
      const plant = state.plants.find((p) => p.id === action.plantId);
      if (!plant || !plant.event) return state;
      const eventDef = getPestEvent(plant.event.type);
      if (state.money < eventDef.treatCost) return state;

      const plants = state.plants.map((p) =>
        p.id === action.plantId ? { ...p, event: undefined } : p
      );
      const log = addLog(
        state.log,
        `Day ${state.day}: ${eventDef.name} cleared in bay ${plant.slot + 1}. ${eventDef.emoji}`
      );
      return { ...state, money: state.money - eventDef.treatCost, plants, log };
    }

    case "PRESTIGE": {
      if (state.lifetimeEarnings < PRESTIGE_THRESHOLD) return state;

      const pointsEarned = prestigePointsAvailable(state.lifetimeEarnings);
      const startingMoney = computeStartingMoney(state.prestigeUpgrades);
      const newPrestigeCount = state.prestigeCount + 1;

      const log = [
        `Run ${newPrestigeCount} started. +${pointsEarned} prestige pt${pointsEarned !== 1 ? "s" : ""} earned. Facility reset. 🏆`,
      ];

      return {
        ...state,
        money: startingMoney,
        day: 1,
        plants: [],
        purchasedUpgrades: [],
        lifetimeEarnings: 0,
        log,
        prestigeCount: newPrestigeCount,
        prestigePoints: state.prestigePoints + pointsEarned,
      };
    }

    case "BUY_PRESTIGE_UPGRADE": {
      const upgrade = PRESTIGE_UPGRADES.find((u) => u.id === action.upgradeId);
      if (!upgrade) return state;
      const currentLevel = state.prestigeUpgrades[action.upgradeId] ?? 0;
      if (currentLevel >= upgrade.maxLevel) return state;
      if (state.prestigePoints < upgrade.costPerLevel) return state;

      const log = addLog(
        state.log,
        `Prestige upgrade: ${upgrade.name} → Lv.${currentLevel + 1}. ${upgrade.emoji}`
      );
      return {
        ...state,
        prestigePoints: state.prestigePoints - upgrade.costPerLevel,
        prestigeUpgrades: { ...state.prestigeUpgrades, [action.upgradeId]: currentLevel + 1 },
        log,
      };
    }

    case "SELECT_STRAIN":
      return { ...state, selectedStrainId: action.strainId };

    case "SET_SPEED":
      return { ...state, gameSpeed: action.speed };

    case "TOGGLE_PAUSE":
      return { ...state, isPaused: !state.isPaused };

    case "BUY_UPGRADE": {
      const upgrade = UPGRADES.find((u) => u.id === action.upgradeId);
      if (!upgrade) return state;
      if (state.money < upgrade.cost) return state;
      if (state.purchasedUpgrades.includes(action.upgradeId)) return state;
      if (upgrade.prereq && !state.purchasedUpgrades.includes(upgrade.prereq)) return state;

      const log = addLog(state.log, `Purchased ${upgrade.name}! ${upgrade.emoji}`);
      return {
        ...state,
        money: state.money - upgrade.cost,
        purchasedUpgrades: [...state.purchasedUpgrades, action.upgradeId],
        log,
      };
    }

    case "LOAD_STATE":
      return action.state;

    default:
      return state;
  }
}

const initialState: GameState = {
  money: 2000,
  day: 1,
  plants: [],
  selectedStrainId: "lemon-cherry-gelato",
  gameSpeed: 2000,
  isPaused: false,
  log: ["Facility online. Drop clones to begin your first production run. 🌿"],
  purchasedUpgrades: [],
  lifetimeEarnings: 0,
  prestigeCount: 0,
  prestigePoints: 0,
  prestigeUpgrades: {},
};

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  effects: GrowEffects;
  numSlots: number;
  plantInSlot: (slot: number) => Plant | undefined;
}

const GameContext = createContext<GameContextValue | null>(null);

function getInitialState(): GameState {
  if (typeof window === "undefined") return initialState;
  const saved = loadAutoSave();
  if (!saved) return initialState;
  return mergeWithDefaults(saved.state, initialState);
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState);
  const effects = computeEffects(state.purchasedUpgrades, state.prestigeUpgrades);

  // Autosave on every state change
  useEffect(() => {
    autoSave(state);
  }, [state]);

  const plantInSlot = useCallback(
    (slot: number) => state.plants.find((p) => p.slot === slot),
    [state.plants]
  );

  return (
    <GameContext.Provider value={{ state, dispatch, effects, numSlots: effects.numSlots, plantInSlot }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
