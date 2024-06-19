import type { PlayerColor } from "@/types";
import type { MotionValue, AnimationControls } from "framer-motion";
import {
  bluePlayerAtom,
  greenPlayerAtom,
  ludoStore,
  // playerTurnAtom,
  redPlayerAtom,
  yellowPlayerAtom,
} from "./atoms";
import { type PrimitiveAtom } from "jotai";
import { type Player } from "./player";

const colorAtom: Record<PlayerColor, PrimitiveAtom<Player>> = {
  red: redPlayerAtom,
  green: greenPlayerAtom,
  yellow: yellowPlayerAtom,
  blue: bluePlayerAtom,
};

export type PawnDirection = "up" | "down" | "left" | "right";
export interface PawnPosition {
  x: MotionValue<number>;
  y: MotionValue<number>;
}
interface PawnArgs {
  index: number;
  position: PawnPosition;
  controls: AnimationControls;
  color: PlayerColor;
  initialPosition: { x: number; y: number };
  el: HTMLButtonElement;
}
const moveSound = new Audio("/sfx/pawn_move.wav");
const landSound = new Audio("/sfx/pawn_land.wav");
const killSound = new Audio("/sfx/stomp.wav");
export const dangerBoxIds = [
  "box-red-5-0",
  "box-green-5-2",
  "box-yellow-0-2",
  "box-blue-0-0",
];
export class Pawn {
  public static readonly STEP = 48;
  public static readonly ORIGINAL_SIZE = 40;

  public index: number;
  public position: PawnPosition;
  public color: PlayerColor;
  public el: HTMLButtonElement;
  public controls: AnimationControls;
  public stepsToHome: number | null = null;
  public currentBoxId: string | null = null;
  public isOut = false;
  public hasWon = false;
  public size = 45;
  public progress = 0;

  private initialPosition: { x: number; y: number };
  private player: Player;
  private direction: PawnDirection;

  constructor({
    index,
    position,
    initialPosition,
    el,
    controls,
    color,
  }: PawnArgs) {
    this.index = index;
    this.position = position;
    this.controls = controls;
    this.color = color;
    this.initialPosition = initialPosition;
    this.el = el;

    this.direction = this.setDirection();
    this.player = Pawn.getPlayer(this.color);
  }

  public static getPlayer(color: PlayerColor): Player {
    return ludoStore.get(colorAtom[color]);
  }
  public static setPlayer(color: PlayerColor, player: Player) {
    ludoStore.set(colorAtom[color], player);
  }

  public static getByIdxAndColor(
    idx: number,
    color: PlayerColor,
  ): Pawn | undefined {
    const pawns = this.getPlayer(color).pawns;
    return pawns.find((pawn) => pawn.index === idx);
  }
  public static getByElement(el: HTMLButtonElement) {
    const [, color, index] = el.id.split("-");
    return this.getByIdxAndColor(Number(index), color as PlayerColor);
  }
  public checkProximity(selector: string, direction = this.direction): boolean {
    const buffer = 20;
    const pawnRect = getExactClientRect(this.el);
    const wallRect = getExactClientRect(document.querySelector(selector)!);

    let isClose = false;

    switch (direction) {
      case "up":
        isClose =
          pawnRect.top - buffer <= wallRect.bottom &&
          pawnRect.bottom > wallRect.bottom;
        break;
      case "down":
        isClose =
          pawnRect.bottom + buffer >= wallRect.top &&
          pawnRect.top < wallRect.top;
        break;
      case "left":
        isClose =
          pawnRect.left - buffer <= wallRect.right &&
          pawnRect.right > wallRect.right;
        break;
      case "right":
        isClose =
          pawnRect.right + buffer >= wallRect.left &&
          pawnRect.left < wallRect.left;
        break;
    }

    return isClose;
  }

  public handleTurn() {
    if (!this.currentBoxId) return;
    if (this.direction === "right") {
      if (this.checkIsNextBox("down")) {
        this.turnDown();
      }
      else {
        this.turnUp();
      }
    }
    else if (this.direction === "up") {
      if (this.checkIsNextBox("right")) {
        this.turnRight();
      }
      else {
        this.turnLeft();
      }
    }
    else if (this.direction === "down") {
      if (this.checkIsNextBox("left")) {
        this.turnLeft();
      }
      else {
        this.turnRight();
      }
    }
    else if (this.direction === "left") {
      if (this.checkIsNextBox("up")) {
        this.turnUp();
      }
      else {
        this.turnDown();
      }
    }
  }

  public async moveWithValue(value: number) {
    if (this.hasWon) return;

    let didKill = false;
    let remainingSteps = value;
    // value is the dice roll
    for (let i = 0; i < value; i++) {
      if (this.stepsToHome && remainingSteps > this.stepsToHome) return;
      didKill = await this.move(i === value - 1);
      remainingSteps--;
      this.progress++;
    }
    return didKill;
  }

  public takeOut() {
    console.log(`taking out ${this.color}`);
    switch (this.color) {
      case "red":
        this.takeRedOut();
        break;
      case "green":
        this.takeGreenOut();
        break;
      case "blue":
        this.takeBlueOut();
        break;
      case "yellow":
        this.takeYellowOut();
        break;
    }
    landSound.play();
    this.isOut = true;
    this.size = 40;
  }

  public adjustMultipleInSameBox() {
    const allPawns = Object.values(colorAtom).flatMap(
      (atom) => ludoStore.get(atom).pawns,
    );
    const pawnsInBox = allPawns.filter(
      (pawn) =>
        !!pawn.currentBoxId &&
        pawn.currentBoxId === this.currentBoxId &&
        (pawn.color !== this.color || pawn.index !== this.index),
    );
    console.log(pawnsInBox);
    if (!pawnsInBox.length) {
      return;
    }
    const scale = 0.6;
    const transition = { duration: 0.1 };
    const { x, y } = this.position;
    // if 2, keep them side by side
    if (pawnsInBox.length === 1) {
      this.controls.start({
        scale,
        translateX: x.get() - 10,
        transition,
      });
      pawnsInBox[0].controls.start({
        scale,
        translateX: pawnsInBox[0].position.x.get() + 10,
        transition,
      });
    }
    // if 3, keep them in a triangle
    else if (pawnsInBox.length === 2) {
      this.controls.start({
        scale,
        translateY: y.get() + 10,
        transition,
      });
      for (let i = 0; i < 2; i++) {
        const currentPawn = pawnsInBox[i];
        const { x, y } = currentPawn.position;
        const translateX = i === 0 ? x.get() + 10 : x.get() - 10;
        const translateY = y.get() - 10;
        currentPawn.controls.start({
          scale,
          translateX,
          translateY,
          transition,
        });
      }
    }
    // if 4, keep them in a square
    else if (pawnsInBox.length === 3) {
      this.controls.start({
        scale,
        translateY: y.get() + 10,
        translateX: x.get() - 10,
        transition,
      });
      for (let i = 0; i < 3; i++) {
        const currentPawn = pawnsInBox[i];
        const { x, y } = currentPawn.position;
        const translateX = i === 0 || i === 2 ? x.get() + 10 : x.get() - 10;
        const translateY = i < 2 ? y.get() - 10 : y.get() + 10;
        currentPawn.controls.start({
          scale,
          translateX,
          translateY,
          transition,
        });
      }
    }
  }

  public setBoxId() {
    const pawnRect = getExactClientRect(this.el);
    const elementsAtNextPosition = document.elementsFromPoint(
      pawnRect.left,
      pawnRect.top,
    );
    const box = elementsAtNextPosition.find((el) =>
      el.classList.contains("box"),
    );
    this.currentBoxId = box?.id || null;
  }

  public resetPosition() {
    if (!this.currentBoxId) return;

    const { x, y } = this.position;
    const xPosition = x.get();
    const yPositon = y.get();

    this.controls.start({
      scale: 1,
      translateX: xPosition,
      translateY: yPositon,
      transition: { duration: 0.1 },
    });
  }

  private setDirection(): PawnDirection {
    switch (this.color) {
      case "red":
        return "right";
      case "green":
        return "down";
      case "blue":
        return "up";
      case "yellow":
        return "left";
    }
  }

  private async move(isLastMove: boolean): Promise<boolean> {
    if (!this.isOut || !this.currentBoxId) return false;
    // if (this.color !== ludoStore.get(playerTurnAtom)) return false;
    const isNextFinalHome = dangerBoxIds.includes(this.currentBoxId);
    console.log({ isNextFinalHome });
    const soundToPlay = isLastMove ? landSound : moveSound;
    console.log(`Moving ${this.el.id} in ${this.direction}`);
    // this.resetPosition();
    switch (this.direction) {
      case "right":
        if (isNextFinalHome)
          this.position.y.set(this.position.y.get() + Pawn.STEP);
        await this.moveRight(soundToPlay, isLastMove);
        break;
      case "up":
        if (isNextFinalHome)
          this.position.x.set(this.position.x.get() + Pawn.STEP);
        await this.moveUp(soundToPlay, isLastMove);
        break;
      case "down":
        if (isNextFinalHome)
          this.position.x.set(this.position.x.get() - Pawn.STEP);
        await this.moveDown(soundToPlay, isLastMove);
        break;
      case "left":
        if (isNextFinalHome)
          this.position.y.set(this.position.y.get() - Pawn.STEP);
        await this.moveLeft(soundToPlay, isLastMove);
        break;
    }

    this.setBoxId();
    // refactor code after this comment to make it more readable and DRY
    let didKill = false;
    if (isLastMove) {
      // this.setBoxId();
      const collidingPawnId = this.checkPawnCollision();
      if (collidingPawnId) {
        console.log(`${this.el.id} trying to kill ${collidingPawnId}`);
        didKill = await this.handleKill(collidingPawnId);

        if (!didKill) {
          console.log(`${this.el.id} did not kill ${collidingPawnId}`);
          // the box is safe, hence if there are other pawns in the same box, they should be scaled down
          this.adjustMultipleInSameBox();
        }
        else console.log(`${this.el.id} killed ${collidingPawnId}`);
      }
      else {
        this.adjustMultipleInSameBox();
      }
    }

    const hasKilled = this.player.hasKilled;
    if (hasKilled) {
      const isDoorHandled = this.handleDoor();
      if (isDoorHandled) return didKill;
      if (this.stepsToHome) this.stepsToHome--;
    }

    const isNextBox = this.checkIsNextBox();
    if (isNextBox) return didKill;

    this.handleTurn();
    return didKill;
  }

  private async handleKill(collidingPawnId: string): Promise<boolean> {
    const [, color, idx] = collidingPawnId.split("-");
    const pawnToKill = Pawn.getByIdxAndColor(Number(idx), color as PlayerColor);
    if (!pawnToKill) return false;
    const isSafeBox = this.currentBoxId?.startsWith("safebox");
    if (isSafeBox) return false;
    await this.sendHome(pawnToKill);
    return true;
  }

  private checkPawnCollision(): string | null {
    const pawnRect = getExactClientRect(this.el);
    const pawnElements = Array.from(
      document.querySelectorAll<HTMLButtonElement>(".pawn"),
    );

    for (const pawnEl of pawnElements) {
      if (pawnEl === this.el) continue;

      const [, color, idx] = pawnEl.id.split("-");
      const pawn = Pawn.getByIdxAndColor(Number(idx), color as PlayerColor);
      if (!pawn) continue;
      if (!pawn.isOut) continue;
      if (pawn.color === this.color) continue;

      const otherPawnRect = getExactClientRect(pawnEl);

      const isColliding = !(
        pawnRect.right < otherPawnRect.left ||
        pawnRect.left > otherPawnRect.right ||
        pawnRect.bottom < otherPawnRect.top ||
        pawnRect.top > otherPawnRect.bottom
      );

      if (isColliding) return pawnEl.id;
    }

    return null;
  }

  private handleDoor(): boolean {
    const colorToDoor: Record<PlayerColor, PawnDirection> = {
      red: "right",
      green: "down",
      blue: "up",
      yellow: "left",
    };
    for (const [color, direction] of Object.entries(colorToDoor)) {
      if (color !== this.color) continue;

      const isNextDoor = this.checkIsNextBox(direction, true);
      if (isNextDoor) {
        if (this.color === "red" && direction === "right") this.turnRight();
        else if (this.color === "green" && direction === "down")
          this.turnDown();
        else if (this.color === "blue" && direction === "up") this.turnUp();
        else if (this.color === "yellow" && direction === "left")
          this.turnLeft();
        this.stepsToHome = 6;
      }
      return isNextDoor;
    }
    return false;
  }

  private checkIsNextBox(direction = this.direction, isDoor = false): boolean {
    const buffer = 20;
    const pawnRect = getExactClientRect(this.el);
    let nextX = pawnRect.left;
    let nextY = pawnRect.top;

    switch (direction) {
      case "up":
        nextY -= buffer;
        break;
      case "down":
        nextY += pawnRect.height + buffer;
        break;
      case "left":
        nextX -= buffer;
        break;
      case "right":
        nextX += pawnRect.width + buffer;
        break;
    }
    const elementsAtNextPosition = document.elementsFromPoint(nextX, nextY);
    const isNextBox = elementsAtNextPosition.some((el) => {
      if (
        el.classList.contains("box") &&
        (isDoor ? el.id === `door-${this.color}` : true)
      ) {
        if (!this.stepsToHome && el.classList.contains("home")) {
          return false;
        }
        return true;
      }
    });

    return isNextBox;
  }

  private async moveRight(soundToPlay: HTMLAudioElement, isLastMove = false) {
    const { x: currentX, y: currentY } = this.position;
    soundToPlay.play();
    await this.controls.start({
      name: isLastMove ? "last_move" : "move",
      translateX: currentX.get() + Pawn.STEP,
      translateY: currentY.get(),
      transition: { duration: this.player.speed },
    });
    currentX.set(currentX.get() + Pawn.STEP);
  }

  private async moveUp(soundToPlay: HTMLAudioElement, isLastMove = false) {
    const { x: currentX, y: currentY } = this.position;
    soundToPlay.play();
    await this.controls.start({
      name: isLastMove ? "last_move" : "move",
      translateY: currentY.get() - Pawn.STEP,
      translateX: currentX.get(),
      transition: { duration: this.player.speed },
    });
    currentY.set(currentY.get() - Pawn.STEP);
  }

  private async moveDown(soundToPlay: HTMLAudioElement, isLastMove = false) {
    const { x: currentX, y: currentY } = this.position;
    soundToPlay.play();
    await this.controls.start({
      name: isLastMove ? "last_move" : "move",
      translateY: currentY.get() + Pawn.STEP,
      translateX: currentX.get(),
      transition: { duration: this.player.speed },
    });
    currentY.set(currentY.get() + Pawn.STEP);
  }

  private async moveLeft(soundToPlay: HTMLAudioElement, isLastMove = false) {
    const { x: currentX, y: currentY } = this.position;
    soundToPlay.play();
    await this.controls.start({
      name: isLastMove ? "last_move" : "move",
      translateX: currentX.get() - Pawn.STEP,
      translateY: currentY.get(),
      transition: { duration: this.player.speed },
    });
    currentX.set(currentX.get() - Pawn.STEP);
  }

  private turnUp() {
    console.log(`turning up ${this.el.id}`);
    this.direction = "up";
  }

  private turnRight() {
    console.log(`turning right ${this.el.id}`);
    this.direction = "right";
  }

  private turnDown() {
    console.log(`turning down ${this.el.id}`);
    this.direction = "down";
  }

  private turnLeft() {
    console.log(`turning left ${this.el.id}`);
    this.direction = "left";
  }

  private takeRedOut() {
    const { x: currentX, y: currentY } = this.position;

    if (this.index === 0) {
      this.controls.start({
        name: "pawnout",
        translateY: currentY.get() + Pawn.STEP * 5,
      });
      return currentY.set(currentY.get() + Pawn.STEP * 5);
    }
    if (this.index === 1) {
      this.controls.start({
        name: "pawnout",
        translateY: currentY.get() + Pawn.STEP * 5,
        translateX: currentX.get() - Pawn.STEP * 3,
      });
      currentY.set(currentY.get() + Pawn.STEP * 5);
      return currentX.set(currentX.get() - Pawn.STEP * 3);
    }
    if (this.index === 2) {
      this.controls.start({
        name: "pawnout",
        translateY: currentY.get() + Pawn.STEP * 2,
      });
      return currentY.set(currentY.get() + Pawn.STEP * 2);
    }
    if (this.index === 3) {
      this.controls.start({
        name: "pawnout",
        translateY: currentY.get() + Pawn.STEP * 2,
        translateX: currentX.get() - Pawn.STEP * 3,
      });
      currentY.set(currentY.get() + Pawn.STEP * 2);
      return currentX.set(currentX.get() - Pawn.STEP * 3);
    }
  }

  private takeGreenOut() {
    const { x: currentX, y: currentY } = this.position;
    if (this.index === 0) {
      this.controls.start({
        name: "pawnout",
        translateX: currentX.get() - Pawn.STEP * 2,
      });
      return currentX.set(currentX.get() - Pawn.STEP * 2);
    }
    if (this.index === 1) {
      this.controls.start({
        name: "pawnout",
        translateX: currentX.get() - Pawn.STEP * 5,
      });
      return currentX.set(currentX.get() - Pawn.STEP * 5);
    }
    if (this.index === 2) {
      this.controls.start({
        name: "pawnout",
        translateX: currentX.get() - Pawn.STEP * 2,
        translateY: currentY.get() - Pawn.STEP * 3,
      });
      currentX.set(currentX.get() - Pawn.STEP * 2);
      return currentY.set(currentY.get() - Pawn.STEP * 3);
    }
    if (this.index === 3) {
      this.controls.start({
        name: "pawnout",
        translateX: currentX.get() - Pawn.STEP * 5,
        translateY: currentY.get() - Pawn.STEP * 3,
      });
      currentX.set(currentX.get() - Pawn.STEP * 5);
      return currentY.set(currentY.get() - Pawn.STEP * 3);
    }
  }

  private takeBlueOut() {
    const { x: currentX, y: currentY } = this.position;
    if (this.index === 0) {
      this.controls.start({
        name: "pawnout",
        translateY: currentY.get() + Pawn.STEP * 3,
        translateX: currentX.get() + Pawn.STEP * 5,
      });
      return currentY.set(currentY.get() + Pawn.STEP * 3);
    }
    if (this.index === 1) {
      this.controls.start({
        name: "pawnout",
        translateY: currentY.get() + Pawn.STEP * 3,
        translateX: currentX.get() + Pawn.STEP * 2,
      });
      return currentY.set(currentY.get() + Pawn.STEP * 3);
    }
    if (this.index === 2) {
      this.controls.start({
        name: "pawnout",
        translateX: currentX.get() + Pawn.STEP * 5,
      });
      return currentX.set(currentX.get() + Pawn.STEP * 5);
    }
    if (this.index === 3) {
      this.controls.start({
        name: "pawnout",
        translateX: currentX.get() + Pawn.STEP * 2,
      });
      return currentX.set(currentX.get() + Pawn.STEP * 2);
    }
  }

  private takeYellowOut() {
    const { x: currentX, y: currentY } = this.position;

    if (this.index === 0) {
      this.controls.start({
        name: "pawnout",
        translateY: currentY.get() - Pawn.STEP * 2,
        translateX: currentX.get() + Pawn.STEP * 3,
      });
      return currentY.set(currentY.get() - Pawn.STEP * 2);
    }
    if (this.index === 1) {
      this.controls.start({
        name: "pawnout",
        translateY: currentY.get() - Pawn.STEP * 2,
      });
      return currentY.set(currentY.get() - Pawn.STEP * 2);
    }
    if (this.index === 2) {
      this.controls.start({
        name: "pawnout",
        translateY: currentY.get() - Pawn.STEP * 5,
        translateX: currentX.get() + Pawn.STEP * 3,
      });
      return currentY.set(currentY.get() - Pawn.STEP * 5);
    }
    if (this.index === 3) {
      this.controls.start({
        name: "pawnout",
        translateY: currentY.get() - Pawn.STEP * 5,
      });
      return currentY.set(currentY.get() - Pawn.STEP * 5);
    }
  }

  private async sendHome(pawnToKill: Pawn) {
    const isSafeBox = this.currentBoxId?.startsWith("safebox");
    if (isSafeBox) return;

    killSound.play();
    this.el.classList.replace("z-40", "z-50");
    await this.showStompAnimation();
    this.el.classList.replace("z-50", "z-40");

    await pawnToKill.reset();
    const currentPlayer = Pawn.getPlayer(this.color);

    Pawn.setPlayer(this.color, { ...currentPlayer, hasKilled: true });
  }

  private async showStompAnimation() {
    await this.controls.start({
      name: "stomp_start",
      scale: 1.5,
    });
    await this.controls.start({
      name: "stomp_end",
      scale: 1,
    });
  }

  private async reset() {
    if (this.player.pawns.filter((p) => p.isOut).length === 1) {
      Pawn.setPlayer(this.color, {
        ...this.player,
        hasKilled: false,
        diceSixCount: 0,
      });
    }

    this.isOut = false;
    this.direction = this.setDirection();
    this.size = 45;
    this.progress = 0;
    this.stepsToHome = null;
    this.position.x.set(this.initialPosition.x);
    this.position.y.set(this.initialPosition.y);
    await this.controls.start({
      name: "pawnin",
      translateX: this.initialPosition.x,
      translateY: this.initialPosition.y,
    });
  }
}

export function getExactClientRect(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
    right: rect.right + scrollLeft,
    bottom: rect.bottom + scrollTop,
    height: rect.height,
    width: rect.width,
  };
}
