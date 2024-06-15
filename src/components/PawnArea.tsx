// area beside the initial home of the pawn

import { cn } from "@/lib/utils";
import { type PlayerColor } from "@/types";
import { Star } from "lucide-react";

interface PawnAreaProps {
  playerColor: PlayerColor;
}

// these are the boxes where pawns move
export function PawnArea({ playerColor }: PawnAreaProps) {
  const isHorizontal = playerColor === "red" || playerColor === "yellow";
  const colors = {
    bg: {
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
    },
    stroke: {
      red: "stroke-red-800",
      blue: "stroke-blue-800",
      green: "stroke-green-800",
      yellow: "stroke-yellow-800",
    },
  };

  return isHorizontal ? (
    <div className="flex flex-col">
      {/* horizontal boxes */}
      {Array.from({ length: 3 }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex">
          {Array.from({ length: 6 }).map((_, columnIndex) => {
            const isMiddleRow = rowIndex === 1;

            const redConditions = {
              isYellowWhiteBox: playerColor === "red" && columnIndex === 0,
              isRedFirstBox:
                playerColor === "red" && columnIndex === 1 && rowIndex === 0,
              isRedDoorBox:
                playerColor === "red" && columnIndex === 1 && rowIndex === 1,
              isRedSafeBox:
                playerColor === "red" && rowIndex === 2 && columnIndex === 2,
            };

            const yellowConditions = {
              isRedWhiteBox: playerColor === "yellow" && columnIndex === 5,
              isYellowFirstBox:
                playerColor === "yellow" && columnIndex === 4 && rowIndex === 2,
              isYellowDoorBox:
                playerColor === "yellow" && columnIndex === 4 && rowIndex === 1,
              isYellowSafeBox:
                playerColor === "yellow" && rowIndex === 0 && columnIndex === 3,
            };

            const isFirstBox =
              redConditions.isRedFirstBox || yellowConditions.isYellowFirstBox;
            const isDoor =
              redConditions.isRedDoorBox || yellowConditions.isYellowDoorBox;
            const isWhiteBox =
              redConditions.isYellowWhiteBox || yellowConditions.isRedWhiteBox;

            const isSafeBox =
              isFirstBox ||
              redConditions.isRedSafeBox ||
              yellowConditions.isYellowSafeBox;

            return (
              <div
                key={columnIndex}
                id={isDoor ? `door-${playerColor}` : undefined}
                className={cn(
                  "size-12 border border-gray-700 flex justify-center items-center box",
                  (isMiddleRow || isFirstBox) && colors.bg[playerColor],
                  isMiddleRow && isWhiteBox && "bg-transparent",
                  isSafeBox && "safe",
                )}
              >
                {isSafeBox && (
                  <Star
                    className={cn(
                      "stroke-1 size-[80%]",
                      colors.stroke[playerColor],
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  ) : (
    <div className="flex flex-col">
      {/* vertical boxes */}
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex">
          {Array.from({ length: 3 }).map((_, columnIndex) => {
            const isMiddleColumn = columnIndex === 1;
            const blueConditions = {
              isGreenWhiteBox: playerColor === "blue" && rowIndex === 5,
              isBlueFirstBox:
                playerColor === "blue" && rowIndex === 4 && columnIndex === 0,
              isBlueDoorBox:
                playerColor === "blue" && rowIndex === 4 && columnIndex === 1,
              isBlueSafeBox:
                playerColor === "blue" && columnIndex === 2 && rowIndex === 3,
            };

            const greenConditions = {
              isBlueWhiteBox: playerColor === "green" && rowIndex === 0,
              isGreenFirstBox:
                playerColor === "green" && rowIndex === 1 && columnIndex === 2,
              isGreenDoorBox:
                playerColor === "green" && rowIndex === 1 && columnIndex === 1,
              isGreenSafeBox:
                playerColor === "green" && columnIndex === 0 && rowIndex === 2,
            };

            const isFirstBox =
              blueConditions.isBlueFirstBox || greenConditions.isGreenFirstBox;
            const isDoor =
              blueConditions.isBlueDoorBox || greenConditions.isGreenDoorBox;
            const isWhiteBox =
              blueConditions.isGreenWhiteBox || greenConditions.isBlueWhiteBox;

            const isSafeBox =
              isFirstBox ||
              blueConditions.isBlueSafeBox ||
              greenConditions.isGreenSafeBox;

            return (
              <div
                key={columnIndex}
                id={isDoor ? `door-${playerColor}` : undefined}
                className={cn(
                  "size-12 border border-gray-700 flex justify-center items-center box",
                  (isMiddleColumn || isFirstBox) && colors.bg[playerColor],
                  isMiddleColumn && isWhiteBox && "bg-transparent",
                  isSafeBox && "safe",
                )}
              >
                {isSafeBox && (
                  <Star
                    className={cn(
                      "stroke-1 size-[80%]",
                      colors.stroke[playerColor],
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
