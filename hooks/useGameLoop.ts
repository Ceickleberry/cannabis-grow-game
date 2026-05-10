"use client";

import { useEffect } from "react";
import { useGame } from "@/lib/gameState";

export function useGameLoop() {
  const { state, dispatch } = useGame();

  useEffect(() => {
    if (state.isPaused) return;

    const id = setInterval(() => {
      dispatch({ type: "ADVANCE_DAY" });
    }, state.gameSpeed);

    return () => clearInterval(id);
  }, [state.isPaused, state.gameSpeed, dispatch]);
}
