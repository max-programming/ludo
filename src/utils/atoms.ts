import { PlayerColor } from "@/types";
import { atom, createStore } from "jotai";
import { Pawn } from "./pawn-controller";

export const colors: PlayerColor[] = ["red", "green", "yellow", "blue"];

export const pawnsStore = createStore();

export const diceValueAtom = atom(0);
export const disabledDiceAtom = atom(false);
export const moveLogsAtom = atom<string[]>([]);
export const playerTurnAtom = atom<PlayerColor>(
  // colors[Math.floor(Math.random() * 4)],
  "red",
);

export const redPawnsAtom = atom<Pawn[]>([]);
export const greenPawnsAtom = atom<Pawn[]>([]);
export const yellowPawnsAtom = atom<Pawn[]>([]);
export const bluePawnsAtom = atom<Pawn[]>([]);

export const playerHasKilledAtom = {
  red: atom(false),
  green: atom(false),
  yellow: atom(false),
  blue: atom(false),
};
