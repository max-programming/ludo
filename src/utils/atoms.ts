import { PlayerColor } from "@/types";
import { atom, createStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Player } from "./player";

export const ludoStore = createStore();

export const diceValueAtom = atom(0);
export const disabledDiceAtom = atom(false);
export const moveLogsAtom = atom<string[]>([]);
export const playerTurnAtom = atomWithStorage<PlayerColor>(
  "player_turn",
  "red",
);
export const colorsAtom = atomWithStorage<PlayerColor[]>("colors", [
  "red",
  "green",
  "yellow",
  "blue",
]);

export const redPlayerAtom = atom(new Player("red"));
export const greenPlayerAtom = atom(new Player("green"));
export const yellowPlayerAtom = atom(new Player("yellow"));
export const bluePlayerAtom = atom(new Player("blue"));

export const colorToAtomMap: Record<PlayerColor, typeof redPlayerAtom> = {
  red: redPlayerAtom,
  green: greenPlayerAtom,
  yellow: yellowPlayerAtom,
  blue: bluePlayerAtom,
};
