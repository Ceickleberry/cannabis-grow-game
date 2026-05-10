"use client";

import { useState } from "react";
import { useGame } from "@/lib/gameState";
import StrainShop from "./StrainShop";
import UpgradesShop from "./UpgradesShop";
import PrestigePanel from "./PrestigePanel";
import SavePanel from "./SavePanel";
import ActivityLog from "./ActivityLog";

type Tab = "seeds" | "upgrades" | "prestige" | "save";

const TABS: { id: Tab; label: string }[] = [
  { id: "seeds", label: "🌱 Seeds" },
  { id: "upgrades", label: "⬆️ Upgrades" },
  { id: "prestige", label: "🏆 Prestige" },
  { id: "save", label: "💾 Save" },
];

export default function Sidebar() {
  const [tab, setTab] = useState<Tab>("seeds");
  const { state } = useGame();
  const { prestigePoints, prestigeCount } = state;

  return (
    <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
        <div className="flex border-b border-zinc-700">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                tab === t.id
                  ? "bg-zinc-800 text-white border-b-2 border-green-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
              {t.id === "prestige" && prestigePoints > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-yellow-500 text-black text-xs rounded-full flex items-center justify-center font-bold leading-none">
                  {prestigePoints}
                </span>
              )}
              {t.id === "prestige" && prestigeCount > 0 && prestigePoints === 0 && (
                <span className="absolute top-1 right-1 text-xs text-yellow-600">✦</span>
              )}
            </button>
          ))}
        </div>
        <div className="p-3 max-h-[70vh] overflow-y-auto">
          {tab === "seeds" && <StrainShop />}
          {tab === "upgrades" && <UpgradesShop />}
          {tab === "prestige" && <PrestigePanel />}
          {tab === "save" && <SavePanel />}
        </div>
      </div>
      <ActivityLog />
    </div>
  );
}
