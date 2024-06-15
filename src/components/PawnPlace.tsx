import { cn } from "@/lib/utils";
import { type PlayerColor } from "@/types";

interface PawnPlaceProps {
  playerColor: PlayerColor;
  bgColor: string;
  position: number;
}

export function PawnPlace({ bgColor, position }: PawnPlaceProps) {
  const positions: Record<number, string> = {
    0: "top-0 left-0",
    1: "top-0 right-0",
    2: "bottom-0 left-0",
    3: "bottom-0 right-0",
  };

  return (
    <div className={cn("absolute size-1/2 p-1", positions[position])}>
      <div className="flex items-center justify-center w-full h-full bg-white">
        <div
          className={cn(
            "size-16 rounded-full flex items-center justify-center",
            bgColor,
          )}
        />
      </div>
    </div>
  );
}
