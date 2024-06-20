import { cn } from "@/lib/utils";
import { PlayerColor } from "@/types";
import { colorsAtom, playerTurnAtom } from "@/utils/atoms";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Choice() {
  const [selectedColor, setSelectedColor] = useState<PlayerColor>("red");
  const [numberOfPlayers, setNumberOfPlayers] = useState(4);
  const setColors = useSetAtom(colorsAtom);
  const setPlayerTurn = useSetAtom(playerTurnAtom);
  const navigate = useNavigate();

  function chooseColor(color: PlayerColor) {
    setSelectedColor(color);
  }
  function chooseNumberOfPlayers(number: number) {
    setNumberOfPlayers(number);
  }

  function startGame() {
    let colors: PlayerColor[] = [];

    if (numberOfPlayers === 2) {
      if (selectedColor === "red" || selectedColor === "yellow") {
        colors = ["red", "yellow"];
      }
      else {
        colors = ["green", "blue"];
      }
    }
    else if (numberOfPlayers === 3) {
      if (selectedColor === "red") {
        colors = ["red", "green", "yellow"];
      }
      else if (selectedColor === "green") {
        colors = ["green", "yellow", "blue"];
      }
      else if (selectedColor === "yellow") {
        colors = ["yellow", "blue", "red"];
      }
      else {
        colors = ["blue", "red", "green"];
      }
    }
    else {
      colors = ["red", "green", "yellow", "blue"];
    }
    setColors(colors);
    setPlayerTurn(pickRandomColor(colors));
  }

  function pickRandomColor(colors: PlayerColor[]) {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen gap-5">
      <div className="flex justify-between gap-12 text-center">
        <div>
          <h2 className="mb-5 text-3xl font-bold">Choose number of players</h2>
          <div className="grid grid-cols-2 gap-4 place-items-center *:transition-colors">
            <button
              onClick={() => chooseNumberOfPlayers(2)}
              className={cn(
                "text-xl border rounded-lg size-40 border-gray-950 hover:bg-gray-200",
                numberOfPlayers === 2 && "bg-gray-200",
              )}
            >
              2 Players
            </button>
            <button
              onClick={() => chooseNumberOfPlayers(3)}
              className={cn(
                "text-xl border rounded-lg size-40 border-gray-950 hover:bg-gray-200",
                numberOfPlayers === 3 && "bg-gray-200",
              )}
            >
              3 Players
            </button>
            <button
              onClick={() => chooseNumberOfPlayers(4)}
              className={cn(
                "col-span-2 text-xl border rounded-lg size-40 border-gray-950 hover:bg-gray-200",
                numberOfPlayers === 4 && "bg-gray-200",
              )}
            >
              4 Players
            </button>
          </div>
        </div>
        <div>
          <h2 className="mb-5 text-3xl font-bold">Choose color</h2>
          <div className="grid grid-cols-2 gap-4 place-items-center *:transition-colors">
            <button
              onClick={() => chooseColor("red")}
              className={cn(
                "text-xl border border-red-700 rounded-lg size-40 hover:bg-red-200",
                selectedColor === "red" && "bg-red-200",
              )}
            >
              Red
            </button>
            <button
              onClick={() => chooseColor("green")}
              className={cn(
                "text-xl border border-green-700 rounded-lg size-40 hover:bg-green-200",
                selectedColor === "green" && "bg-green-200",
              )}
            >
              Green
            </button>
            <button
              onClick={() => chooseColor("blue")}
              className={cn(
                "text-xl border border-blue-700 rounded-lg size-40 hover:bg-blue-200",
                selectedColor === "blue" && "bg-blue-200",
              )}
            >
              Blue
            </button>
            <button
              onClick={() => chooseColor("yellow")}
              className={cn(
                "text-xl border border-yellow-700 rounded-lg size-40 hover:bg-yellow-200",
                selectedColor === "yellow" && "bg-yellow-200",
              )}
            >
              Yellow
            </button>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          startGame();
          navigate("/game");
        }}
        className="px-4 py-2 text-xl font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Start Game
      </button>
    </main>
  );
}
