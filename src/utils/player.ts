import { PlayerColor } from "@/types";
import { Pawn } from "./pawn-controller";

export class Player {
  public hasKilled = false;
  public diceSixCount = 0;
  public speed = 0.1;
  public pawns: Pawn[] = [];

  constructor(public color: PlayerColor) {}
}
