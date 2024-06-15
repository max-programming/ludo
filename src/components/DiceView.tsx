import { cn } from "@/lib/utils";
import { PlayerColor } from "@/types";
import {
  bluePawnsAtom,
  colors,
  diceValueAtom,
  disabledDiceAtom,
  greenPawnsAtom,
  moveLogsAtom,
  playerTurnAtom,
  redPawnsAtom,
  yellowPawnsAtom,
} from "@/utils/atoms";
import { Pawn } from "@/utils/pawn-controller";
import { PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import Dice from "react-dice-roll";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";

const faces = [1, 2, 3, 4, 5, 6].map((face) => `/dice-faces/dice-${face}.png`);

const colorAtom: Record<PlayerColor, PrimitiveAtom<Pawn[]>> = {
  red: redPawnsAtom,
  green: greenPawnsAtom,
  yellow: yellowPawnsAtom,
  blue: bluePawnsAtom,
};
const bgColors = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
};
const textColors = {
  red: "text-white",
  green: "text-white",
  yellow: "text-black",
  blue: "text-white",
};
const borderColors = {
  red: "border-red-500",
  blue: "border-blue-500",
  green: "border-green-500",
  yellow: "border-yellow-500",
};

type CheatNumber = 1 | 2 | 3 | 4 | 5 | 6 | undefined;
export function DiceView() {
  const [isCheatMode, setIsCheatMode] = useState(
    import.meta.env.MODE === "development",
  );
  const [cheatNumber, setCheatNumber] = useState<CheatNumber>();

  const [disabledDice, setDisabledDice] = useAtom(disabledDiceAtom);
  const setDiceValue = useSetAtom(diceValueAtom);
  const [playerTurn, setPlayerTurn] = useAtom(playerTurnAtom);
  const [, setMoveLogs] = useAtom(moveLogsAtom);
  const pawns = useAtomValue(colorAtom[playerTurn]);

  function handleRoll(value: number) {
    setDiceValue(value);
    setDisabledDice(true);

    moveOnlyAvailablePawn(value);

    changePlayerTurnOnEmptyTurn(value);
  }

  function changePlayerTurnOnEmptyTurn(value: number) {
    // if all pawns are in the initial home and the dice value is not 6, change the player turn
    if (pawns.every((c) => !c.isPawnOut) && value !== 6) {
      setDisabledDice(false);
      setDiceValue(0);
      setNextPlayer();
    }
  }

  async function moveOnlyAvailablePawn(value: number) {
    // if only one pawn is out, move it
    const outPawns = pawns.filter((c) => c.isPawnOut);
    if (outPawns.length !== 1) return;
    const [outPawn] = outPawns;
    if (value === 6) {
      if (outPawn.stepsToHome && value > outPawn.stepsToHome) {
        setDisabledDice(false);
        setDiceValue(0);
        setNextPlayer();
        return;
      }
      // if value is 6 and only one pawn is out, dont move it
      return;
    }

    const didKill = await outPawn.moveWithValue(value);
    setMoveLogs((logs) => [
      ...logs,
      `${outPawn.pawnColor} moved a pawn by ${value}`,
    ]);
    if (didKill) {
      setMoveLogs((logs) => [...logs, `${outPawn.pawnColor} killed a pawn`]);
    }

    setDisabledDice(false);
    setDiceValue(0);
    if (didKill) return;
    setNextPlayer();
  }

  function setNextPlayer() {
    const nextPlayer = colors[(colors.indexOf(playerTurn) + 1) % 4];
    setPlayerTurn(nextPlayer);
  }

  return (
    <div className="absolute w-full max-w-52 -bottom-4 -right-40">
      <div className="w-full mb-2">
        {import.meta.env.MODE === "development" && (
          <div className="flex flex-col items-center gap-2 mb-2">
            {isCheatMode && (
              <DevModeInput value={cheatNumber} onChange={setCheatNumber} />
            )}
            <DevModeSwitch value={isCheatMode} onChange={setIsCheatMode} />
          </div>
        )}
        <h1
          className={cn(
            "text-xl font-semibold text-center capitalize rounded-lg",
            textColors[playerTurn],
            bgColors[playerTurn],
          )}
        >
          {playerTurn}'s turn
        </h1>
      </div>
      <div
        className={cn(
          "p-4 border-2 rounded-md flex items-center justify-center",
          borderColors[playerTurn],
        )}
      >
        <Dice
          faces={faces}
          rollingTime={1150}
          sound="/sfx/dice_roll.wav"
          size={100}
          disabled={disabledDice}
          onRoll={handleRoll}
          cheatValue={cheatNumber}
        />
      </div>
    </div>
  );
}

function DevModeInput(props: {
  value: CheatNumber;
  onChange: (value: CheatNumber) => void;
}) {
  return (
    <Input
      type="number"
      placeholder="Enter cheat number"
      value={props.value ?? 1}
      onChange={(e) => props.onChange(e.target.valueAsNumber as CheatNumber)}
    />
  );
}

function DevModeSwitch(props: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 font-semibold">
      <Switch checked={props.value} onCheckedChange={props.onChange} />
      Dev Mode
    </div>
  );
}
