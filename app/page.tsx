import { GameProvider } from "@/lib/gameState";
import HUD from "@/components/HUD";
import GameBoard from "@/components/GameBoard";

export default function Home() {
  return (
    <GameProvider>
      <div className="min-h-screen flex flex-col">
        <HUD />
        <GameBoard />
      </div>
    </GameProvider>
  );
}
