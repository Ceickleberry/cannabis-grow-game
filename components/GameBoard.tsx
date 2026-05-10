"use client";

import { useGameLoop } from "@/hooks/useGameLoop";
import GrowRoom from "./GrowRoom";
import Sidebar from "./Sidebar";

export default function GameBoard() {
  useGameLoop();

  return (
    <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start">
      <div className="flex-1 min-w-0">
        <GrowRoom />
      </div>
      <Sidebar />
    </div>
  );
}
