import { cn } from "@/lib/utils";
import { PlayerColor } from "@/types";
import {
  bluePlayerAtom,
  colorToAtomMap,
  colors,
  diceValueAtom,
  disabledDiceAtom,
  greenPlayerAtom,
  moveLogsAtom,
  playerTurnAtom,
  redPlayerAtom,
  yellowPlayerAtom,
} from "@/utils/atoms";
import { PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import Dice from "react-dice-roll";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Player } from "@/utils/player";
import { Variants, motion } from "framer-motion";

const faces = [1, 2, 3, 4, 5, 6].map((face) => `/dice-faces/dice-${face}.png`);

const colorAtom: Record<PlayerColor, PrimitiveAtom<Player>> = {
  red: redPlayerAtom,
  green: greenPlayerAtom,
  yellow: yellowPlayerAtom,
  blue: bluePlayerAtom,
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
  const player = useAtomValue(colorToAtomMap[playerTurn]);
  const [, setMoveLogs] = useAtom(moveLogsAtom);
  const { pawns } = useAtomValue(colorAtom[playerTurn]);

  function handleRoll(value: number) {
    setDiceValue(value);
    setDisabledDice(true);

    handleThreeSixes(value);
    moveOnlyAvailablePawn(value);

    changePlayerTurnOnEmptyTurn(value);
  }

  function handleThreeSixes(value: number) {
    // if (player. !== playerTurn) return;
    if (value === 6) player.diceSixCount++;
    else if (value !== 0) player.diceSixCount = 0;

    if (value === 6 && player.diceSixCount === 3) {
      setDiceValue(0);
      setDisabledDice(false);
      setNextPlayer();
      player.diceSixCount = 0;
    }
  }

  function changePlayerTurnOnEmptyTurn(value: number) {
    console.log(pawns.every((c) => !c.isOut) && value !== 6);
    // if all pawns are in the initial home and the dice value is not 6, change the player turn
    if (pawns.every((c) => !c.isOut) && value !== 6) {
      setDisabledDice(false);
      setDiceValue(0);
      setNextPlayer();
    }
  }

  async function moveOnlyAvailablePawn(value: number) {
    // if only one pawn is out, move it
    const outPawns = pawns.filter((c) => c.isOut);
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
      `${outPawn.color} moved a pawn by ${value}`,
    ]);
    if (didKill) {
      setMoveLogs((logs) => [...logs, `${outPawn.color} killed a pawn`]);
    }

    setDisabledDice(false);
    setDiceValue(0);
    if (didKill) return;
    setNextPlayer();
  }

  function setNextPlayer() {
    setTimeout(() => {
      const nextPlayer = colors[(colors.indexOf(playerTurn) + 1) % 4];
      setPlayerTurn(nextPlayer);
    }, 200);
  }

  const positionVariants: Variants = {
    red: {
      translateX: isCheatMode ? -230 : -160,
      translateY: -320,
    },
    green: {
      translateX: 740,
      translateY: -320,
    },
    yellow: {
      translateX: 740,
      translateY: isCheatMode ? 230 : 260,
    },
    blue: {
      translateX: isCheatMode ? -230 : -160,
      translateY: isCheatMode ? 230 : 260,
    },
  };

  return (
    <motion.div
      className="w-full max-w-52"
      variants={positionVariants}
      initial={playerTurn}
      animate={playerTurn}
      transition={{ duration: 0.5, type: "spring" }}
    >
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
    </motion.div>
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
