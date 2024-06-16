import { PlayerColor } from "@/types";
import { Pawn } from "./pawn-controller";

export class Player {
  public hasKilled = false;
  public diceSixCount = 0;
  public speed = 0.2;
  public pawns: Pawn[] = [];

  constructor(public color: PlayerColor) {}
}
