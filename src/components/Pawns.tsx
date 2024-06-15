import { cn } from "@/lib/utils";
import { type PlayerColor } from "@/types";
import {
  diceValueAtom,
  playerTurnAtom,
  colors as playerColors,
  redPawnsAtom,
  bluePawnsAtom,
  yellowPawnsAtom,
  greenPawnsAtom,
  disabledDiceAtom,
  moveLogsAtom,
} from "@/utils/atoms";
import { Pawn } from "@/utils/pawn-controller";
import { motion, useMotionValue, useAnimation } from "framer-motion";
import { PrimitiveAtom, useAtom, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

interface PawnProps {
  playerColor: PlayerColor;
  index: number;
}

const colors = {
  red: {
    light: "fill-red-200",
    dark: "fill-red-700",
    darker: "fill-red-800",
  },
  blue: {
    light: "fill-blue-200",
    dark: "fill-blue-700",
    darker: "fill-blue-800",
  },
  green: {
    light: "fill-green-200",
    dark: "fill-green-700",
    darker: "fill-green-800",
  },
  yellow: {
    light: "fill-yellow-200",
    dark: "fill-yellow-700",
    darker: "fill-yellow-800",
  },
};

const colorAtom: Record<PlayerColor, PrimitiveAtom<Pawn[]>> = {
  red: redPawnsAtom,
  green: greenPawnsAtom,
  yellow: yellowPawnsAtom,
  blue: bluePawnsAtom,
};

export function PawnButton({ playerColor, index }: PawnProps) {
  const [playerTurn, setPlayerTurn] = useAtom(playerTurnAtom);
  const [pawns, setPawns] = useAtom(colorAtom[playerColor]);
  const [diceNumber, setDiceNumber] = useAtom(diceValueAtom);
  const [, setMoveLogs] = useAtom(moveLogsAtom);
  const pawnRef = useRef<HTMLButtonElement>(null);
  const setDisabledDice = useSetAtom(disabledDiceAtom);

  const controls = useAnimation();
  const x = useMotionValue(index % 2 === 0 ? Pawn.STEP : Pawn.STEP * 4);
  const y = useMotionValue(index < 2 ? Pawn.STEP : Pawn.STEP * 4);

  const pawn = pawns.find((c) => c.index === index);

  useEffect(() => {
    if (pawn || !pawnRef.current) return;

    const initialPosition = {
      x: index % 2 === 0 ? Pawn.STEP : Pawn.STEP * 4,
      y: index < 2 ? Pawn.STEP : Pawn.STEP * 4,
    };
    const newPawn = new Pawn(
      index,
      { x, y },
      controls,
      playerColor,
      initialPosition,
      pawnRef.current,
    );
    setPawns([...pawns, newPawn]);
  }, [controls, index, pawn, pawns, playerColor, setPawns, x, y]);

  useEffect(() => {
    // three sixes rule
    // diceSixCount is for player (should not be part of Pawn)
    if (!pawn) return;
    if (playerColor !== playerTurn) return;

    if (diceNumber === 6) pawn.diceSixCount++;
    else if (diceNumber !== 0) pawn.diceSixCount = 0;

    if (diceNumber === 6 && pawn.diceSixCount === 3) {
      setDiceNumber(0);
      setDisabledDice(false);
      setNextPlayer();
      pawn.diceSixCount = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diceNumber]);

  function setNextPlayer() {
    const nextPlayer = playerColors[(playerColors.indexOf(playerTurn) + 1) % 4];
    setPlayerTurn(nextPlayer);
  }

  async function handleTap() {
    if (playerTurn !== playerColor || diceNumber === 0 || !pawn) {
      return;
    }

    if (diceNumber !== 6 && !pawn.isPawnOut) {
      setDisabledDice(false);
      return;
    }

    if (diceNumber === 6 && !pawn.isPawnOut) {
      pawn.takeOut();
      setMoveLogs((logs) => [...logs, `${playerColor} took out a pawn`]);
      setDiceNumber(0);
      setDisabledDice(false);
    }
    else {
      if (diceNumber > 6) return;

      const didKill = await pawn.moveWithValue(diceNumber);
      setMoveLogs((logs) => [
        ...logs,
        `${playerColor} moved a pawn by ${diceNumber}`,
      ]);
      if (didKill) {
        setMoveLogs((logs) => [...logs, `${playerColor} killed a pawn`]);
      }

      console.log({ didKill });

      setDisabledDice(false);
      setDiceNumber(0);
      // if it was 6 or a kill, don't change the player
      if (diceNumber === 6 || didKill) return;
      setNextPlayer();
    }
  }

  function handleAnimationComplete(def: {
    name?: string;
    translateX: number;
    translateY: number;
  }) {
    if (!pawn) return;

    if (def.name === "pawnout") {
      if (playerColor === "blue" && [0, 1].includes(index)) {
        x.set(def.translateX);
        y.set(def.translateY);
      }
      else if (playerColor === "green" && [2, 3].includes(index)) {
        x.set(def.translateX);
        y.set(def.translateY);
      }
      else if (playerColor === "yellow" && [0, 2].includes(index)) {
        x.set(def.translateX);
        y.set(def.translateY);
      }
      pawn.position = { x, y };
    }
    // if (def.name !== "pawnin") {
    // }
  }

  return (
    <motion.button
      className={cn(
        "absolute focus:outline-none pawn",
        playerColor === playerTurn ? "z-50" : "z-40",
      )}
      id={`pawn-${playerColor}-${index}`}
      animate={controls}
      onClick={handleTap}
      onAnimationComplete={handleAnimationComplete}
      ref={pawnRef}
      whileTap={{
        scale: 0.9,
        transition: { duration: 0.1 },
      }}
      initial={{
        name: "stationary",
        translateY: y.get(),
        translateX: x.get(),
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={pawn?.size ?? 45}
        height={pawn?.size ?? 45}
        className={cn(pawn?.isPawnOut && "translate-x-1 translate-y-1")}
        xmlSpace="preserve"
      >
        <path
          d="M38 20c2.4-1.8 4-4.7 4-8 0-5.5-4.5-10-10-10S22 6.5 22 12c0 3.3 1.6 6.2 4 8h-7v6h7l-3.5 13.5L10 50h28V26h7v-6h-7z"
          className={colors[playerColor].light}
        />
        <path
          d="M20 24c0-2.2 1.8-4 4-4h4v-4h-4c-4.4 0-8 3.6-8 8v4h7.9c-.6 7-4.7 13.4-11.1 16.7L8 47.3V56c0 4.4 3.6 8 8 8h32c4.4 0 8-3.6 8-8v-8l-15-8-3-16h-6v7.7c0 5.4 1.3 10.8 3.7 15.7l.3.6H15.2C23.1 43.6 28 35.2 28 26.2V24h-8z"
          className={colors[playerColor].dark}
        />
        <path
          d="M32 0c6.6 0 12 5.4 12 12 0 1.5-.3 3-.8 4.3 2.8 1 4.8 3.6 4.8 6.7v5h-7.9c.6 7 4.7 13.4 11.1 16.7l4.9 2.6V56c0 4.4-3.6 8-8 8h-4v-4h4c2.2 0 4-1.8 4-4v-6.3l-2.7-1.4C41.1 43.9 36 35.4 36 26.2V24h8v-1c0-1.7-1.3-3-3-3h-5l2.4-3.2c1-1.3 1.6-3 1.6-4.8 0-4.4-3.6-8-8-8s-8 3.6-8 8c0 1.5.4 2.8 1.1 4H24c-1.1 0-2.1.2-3.1.6-.6-1.4-.9-3-.9-4.6 0-6.6 5.4-12 12-12z"
          className={colors[playerColor].darker}
        />
      </svg>
    </motion.button>
  );
}