import { cn } from "@/lib/utils";
import { type PlayerColor } from "@/types";
import { PawnPlace } from "./PawnPlace";
import { useAtomValue } from "jotai";
import { playerTurnAtom } from "@/utils/atoms";

interface InitialHomeProps {
  playerColor: PlayerColor;
}

export function InitialHome({ playerColor }: InitialHomeProps) {
  const playerTurn = useAtomValue(playerTurnAtom);
  const colors = {
    bg: {
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
    },
    ringActive: {
      red: "ring-red-500",
      blue: "ring-blue-500",
      green: "ring-green-500",
      yellow: "ring-yellow-500",
    },
  };

  return (
    <div
      className={cn(
        "relative size-72 border-none initial_home",
        colors.bg[playerColor],
        playerTurn === playerColor &&
          cn(colors.ringActive[playerColor], "rounded-lg ring-4 ring-offset-1"),
      )}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <PawnPlace
          key={i}
          bgColor={colors.bg[playerColor]}
          playerColor={playerColor}
          position={i}
        />
      ))}
    </div>
  );
}
