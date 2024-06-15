import { PlayerColor } from "@/types";
import { atom, createStore } from "jotai";
import { Player } from "./player";

export const colors: PlayerColor[] = ["red", "green", "yellow", "blue"];

export const ludoStore = createStore();

export const diceValueAtom = atom(0);
export const disabledDiceAtom = atom(false);
export const moveLogsAtom = atom<string[]>([]);
export const playerTurnAtom = atom<PlayerColor>(
  // colors[Math.floor(Math.random() * 4)],
  "red",
);

export const redPlayerAtom = atom<Player>(new Player("red"));
export const greenPlayerAtom = atom<Player>(new Player("green"));
export const yellowPlayerAtom = atom<Player>(new Player("yellow"));
export const bluePlayerAtom = atom<Player>(new Player("blue"));

export const colorToAtomMap: Record<PlayerColor, typeof redPlayerAtom> = {
  red: redPlayerAtom,
  green: greenPlayerAtom,
  yellow: yellowPlayerAtom,
  blue: bluePlayerAtom,
};
