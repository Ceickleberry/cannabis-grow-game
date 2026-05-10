"use client";

import { useState, useCallback } from "react";
import { useGame } from "@/lib/gameState";
import {
  NUM_SLOTS,
  loadAllSlots,
  loadAutoSave,
  saveToSlot,
  deleteSlot,
  saveSummary,
  formatSaveDate,
  type SaveFile,
} from "@/lib/saveSystem";

type ConfirmAction =
  | { kind: "load"; slot: number }
  | { kind: "overwrite"; slot: number }
  | { kind: "delete"; slot: number };

export default function SavePanel() {
  const { state, dispatch } = useGame();

  const [slots, setSlots] = useState<(SaveFile | null)[]>(() => loadAllSlots());
  const [autosave, setAutosave] = useState<SaveFile | null>(() => loadAutoSave());
  const [confirming, setConfirming] = useState<ConfirmAction | null>(null);

  const refresh = useCallback(() => {
    setSlots(loadAllSlots());
    setAutosave(loadAutoSave());
  }, []);

  function handleSave(slot: number) {
    if (slots[slot]) {
      setConfirming({ kind: "overwrite", slot });
    } else {
      saveToSlot(slot, state);
      refresh();
    }
  }

  function handleLoad(slot: number) {
    setConfirming({ kind: "load", slot });
  }

  function handleDelete(slot: number) {
    setConfirming({ kind: "delete", slot });
  }

  function handleConfirm() {
    if (!confirming) return;
    if (confirming.kind === "load") {
      const file = slots[confirming.slot];
      if (file) dispatch({ type: "LOAD_STATE", state: file.state });
    } else if (confirming.kind === "overwrite") {
      saveToSlot(confirming.slot, state);
      refresh();
    } else if (confirming.kind === "delete") {
      deleteSlot(confirming.slot);
      refresh();
    }
    setConfirming(null);
  }

  const confirmLabel: Record<ConfirmAction["kind"], string> = {
    load: "Load this save? Current progress will be lost.",
    overwrite: "Overwrite this save slot?",
    delete: "Delete this save permanently?",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Autosave indicator */}
      <div className="bg-zinc-800 rounded-lg p-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Autosave</span>
          <span className="text-xs text-green-500">● Active</span>
        </div>
        {autosave ? (
          <p className="text-xs text-zinc-300">{saveSummary(autosave.state)}</p>
        ) : (
          <p className="text-xs text-zinc-600">No autosave yet</p>
        )}
        {autosave && (
          <p className="text-xs text-zinc-600">{formatSaveDate(autosave.savedAt)}</p>
        )}
      </div>

      {/* Confirmation dialog */}
      {confirming && (
        <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-3 flex flex-col gap-2">
          <p className="text-xs text-zinc-300">{confirmLabel[confirming.kind]}</p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="flex-1 py-1.5 rounded-md bg-green-700 hover:bg-green-600 text-white text-xs font-semibold transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(null)}
              className="flex-1 py-1.5 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Save slots */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Save Slots</h3>
        {Array.from({ length: NUM_SLOTS }, (_, i) => {
          const file = slots[i];
          return (
            <div
              key={i}
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Slot {i + 1}</span>
                {file && (
                  <span className="text-xs text-zinc-600">{formatSaveDate(file.savedAt)}</span>
                )}
              </div>

              {file ? (
                <>
                  <p className="text-xs text-zinc-200">{saveSummary(file.state)}</p>
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => handleLoad(i)}
                      className="flex-1 py-1 rounded-md bg-blue-900 hover:bg-blue-800 text-blue-300 border border-blue-700 text-xs transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleSave(i)}
                      className="flex-1 py-1 rounded-md bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs transition-colors"
                    >
                      Overwrite
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-red-950 text-red-500 hover:text-red-400 text-xs border border-zinc-700 hover:border-red-800 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-zinc-600 italic">Empty slot</p>
                  <button
                    onClick={() => handleSave(i)}
                    className="w-full py-1.5 rounded-md bg-green-900 hover:bg-green-800 text-green-300 border border-green-800 text-xs transition-colors"
                  >
                    💾 Save Here
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-600 text-center">
        Saves are stored in your browser. Clearing site data will erase them.
      </p>
    </div>
  );
}
