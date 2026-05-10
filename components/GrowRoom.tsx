"use client";

import { useGame } from "@/lib/gameState";
import GrowSlot from "./GrowSlot";

export default function GrowRoom() {
  const { numSlots } = useGame();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        Flower Room — {numSlots} Bays
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: numSlots }, (_, i) => (
          <GrowSlot key={i} slot={i} />
        ))}
      </div>
    </div>
  );
}
