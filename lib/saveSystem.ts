import type { GameState } from "./types";

export const SAVE_VERSION = 1;

const AUTOSAVE_KEY = "growops-autosave";
const slotKey = (i: number) => `growops-save-${i}`;

export const NUM_SLOTS = 3;

export interface SaveFile {
  version: number;
  state: GameState;
  savedAt: number;
}

// ── Read / Write ──────────────────────────────────────────────────────────────

function readSave(key: string): SaveFile | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const file = JSON.parse(raw) as SaveFile;
    if (file.version !== SAVE_VERSION) return null;
    return file;
  } catch {
    return null;
  }
}

function writeSave(key: string, state: GameState): void {
  try {
    const file: SaveFile = { version: SAVE_VERSION, state, savedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(file));
  } catch {}
}

function deleteSave(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// ── Public API ────────────────────────────────────────────────────────────────

export function autoSave(state: GameState): void {
  writeSave(AUTOSAVE_KEY, state);
}

export function loadAutoSave(): SaveFile | null {
  return readSave(AUTOSAVE_KEY);
}

export function saveToSlot(slot: number, state: GameState): void {
  writeSave(slotKey(slot), state);
}

export function loadFromSlot(slot: number): SaveFile | null {
  return readSave(slotKey(slot));
}

export function deleteSlot(slot: number): void {
  deleteSave(slotKey(slot));
}

export function loadAllSlots(): (SaveFile | null)[] {
  return Array.from({ length: NUM_SLOTS }, (_, i) => loadFromSlot(i));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function saveSummary(state: GameState): string {
  return `Day ${state.day} · Run #${state.prestigeCount + 1} · $${state.money.toLocaleString()}`;
}

export function formatSaveDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Merge a saved (possibly older) state with defaults so new fields are populated. */
export function mergeWithDefaults(saved: Partial<GameState>, defaults: GameState): GameState {
  return { ...defaults, ...saved };
}
