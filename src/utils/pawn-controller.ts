import type { PlayerColor } from "@/types";
import type { MotionValue, AnimationControls } from "framer-motion";
import {
  bluePlayerAtom,
  greenPlayerAtom,
  ludoStore,
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

export class Pawn {
  public static readonly STEP = 48;
  public static readonly ORIGINAL_SIZE = 40;

  public index: number;
  public position: PawnPosition;
  public color: PlayerColor;
  public stepsToHome: number | null = null;
  public isOut = false;
  public hasWon = false;
  public size = 45;
  public progress = 0;

  private controls: AnimationControls;
  private initialPosition: { x: number; y: number };
  private el: HTMLButtonElement;
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
    const pawns = Pawn.getPlayer(color).pawns;
    return pawns.find((pawn) => pawn.index === idx);
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
    const currentPostion = this.position;
    switch (this.color) {
      case "red":
        this.takeRedOut(currentPostion);
        this.direction = "right";
        break;
      case "green":
        this.takeGreenOut(currentPostion);
        this.direction = "down";
        break;
      case "blue":
        this.takeBlueOut(currentPostion);
        this.direction = "up";
        break;
      case "yellow":
        this.takeYellowOut(currentPostion);
        this.direction = "left";
        break;
    }
    landSound.play();
    this.isOut = true;
    this.size = 40;
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
    if (!this.isOut) return false;
    const soundToPlay = isLastMove ? landSound : moveSound;
    console.log(`Moving in ${this.direction}`);

    if (this.direction === "right") {
      await this.moveRight(soundToPlay);
    }
    else if (this.direction === "up") {
      await this.moveUp(soundToPlay);
    }
    else if (this.direction === "down") {
      await this.moveDown(soundToPlay);
    }
    else if (this.direction === "left") {
      await this.moveLeft(soundToPlay);
    }
    // refactor code after this comment to make it more readable and DRY
    let didKill = false;
    if (isLastMove) {
      const collidingPawnId = this.checkPawnCollision();
      if (collidingPawnId) {
        didKill = await this.handleKill(collidingPawnId);
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
    const isSafeBox = this.checkIsSafeBox(pawnToKill);
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

  private handleTurn() {
    const { x: currentX, y: currentY } = this.position;

    const isNextFinalHome = this.checkProximity("#final_home");
    if (this.direction === "right") {
      if (!isNextFinalHome) {
        if (this.checkIsNextBox("down"))
          this.turnDown(currentX, isNextFinalHome);
        else this.turnUp(currentX, isNextFinalHome);
      }
      else {
        this.turnUp(currentX, isNextFinalHome);
      }
    }
    else if (this.direction === "up") {
      if (!isNextFinalHome) {
        if (this.checkIsNextBox("right"))
          this.turnRight(currentY, isNextFinalHome);
        else this.turnLeft(currentY, isNextFinalHome);
      }
      else {
        this.turnLeft(currentY, isNextFinalHome);
      }
    }
    else if (this.direction === "down") {
      if (!isNextFinalHome) {
        if (this.checkIsNextBox("left"))
          this.turnLeft(currentY, isNextFinalHome);
        else this.turnRight(currentY, isNextFinalHome);
      }
      else {
        this.turnRight(currentY, isNextFinalHome);
      }
    }
    else if (this.direction === "left") {
      if (!isNextFinalHome) {
        if (this.checkIsNextBox("up")) this.turnUp(currentX, isNextFinalHome);
        else this.turnDown(currentX, isNextFinalHome);
      }
      else {
        this.turnDown(currentX, isNextFinalHome);
      }
    }
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
        if (this.color === "red" && direction === "right")
          this.turnRight(this.position.y, false);
        else if (this.color === "green" && direction === "down")
          this.turnDown(this.position.x, false);
        else if (this.color === "blue" && direction === "up")
          this.turnUp(this.position.x, false);
        else if (this.color === "yellow" && direction === "left")
          this.turnLeft(this.position.y, false);
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

  private checkProximity(
    selector: string,
    direction = this.direction,
  ): boolean {
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

  private async moveRight(soundToPlay: HTMLAudioElement) {
    const { x: currentX, y: currentY } = this.position;
    soundToPlay.play();
    await this.controls.start({
      name: "move",
      translateX: currentX.get() + Pawn.STEP,
      translateY: currentY.get(),
      transition: { duration: this.player.speed },
    });
    currentX.set(currentX.get() + Pawn.STEP);
  }

  private async moveUp(soundToPlay: HTMLAudioElement) {
    const { x: currentX, y: currentY } = this.position;
    soundToPlay.play();
    await this.controls.start({
      name: "move",
      translateY: currentY.get() - Pawn.STEP,
      translateX: currentX.get(),
      transition: { duration: this.player.speed },
    });
    currentY.set(currentY.get() - Pawn.STEP);
  }

  private async moveDown(soundToPlay: HTMLAudioElement) {
    const { x: currentX, y: currentY } = this.position;
    soundToPlay.play();
    await this.controls.start({
      name: "move",
      translateY: currentY.get() + Pawn.STEP,
      translateX: currentX.get(),
      transition: { duration: this.player.speed },
    });
    currentY.set(currentY.get() + Pawn.STEP);
  }

  private async moveLeft(soundToPlay: HTMLAudioElement) {
    const { x: currentX, y: currentY } = this.position;
    soundToPlay.play();
    await this.controls.start({
      name: "move",
      translateX: currentX.get() - Pawn.STEP,
      translateY: currentY.get(),
      transition: { duration: this.player.speed },
    });
    currentX.set(currentX.get() - Pawn.STEP);
  }

  private turnUp(currentX: MotionValue<number>, canCollide: boolean) {
    console.log("turning down");
    if (canCollide) {
      currentX.set(currentX.get() + Pawn.STEP);
    }
    this.direction = "up";
  }

  private turnRight(currentY: MotionValue<number>, canCollide: boolean) {
    console.log("turning right");
    if (canCollide) {
      currentY.set(currentY.get() + Pawn.STEP);
    }
    this.direction = "right";
  }

  private turnDown(currentX: MotionValue<number>, canCollide: boolean) {
    console.log("turning down");
    if (canCollide) {
      currentX.set(currentX.get() - Pawn.STEP);
    }
    this.direction = "down";
  }

  private turnLeft(currentY: MotionValue<number>, canCollide: boolean) {
    console.log("turning left");
    if (canCollide) {
      currentY.set(currentY.get() - Pawn.STEP);
    }
    this.direction = "left";
  }

  private takeRedOut(currentPostion: PawnPosition) {
    const { x: currentX, y: currentY } = currentPostion;

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

  private takeGreenOut(currentPostion: PawnPosition) {
    const { x: currentX, y: currentY } = currentPostion;
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

  private takeBlueOut(currentPostion: PawnPosition) {
    const { x: currentX, y: currentY } = currentPostion;
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

  private takeYellowOut(currentPostion: PawnPosition) {
    const { x: currentX, y: currentY } = currentPostion;

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

  private checkIsSafeBox(pawnToCheck: Pawn): boolean {
    // TODO: When 2 or more pawns are in the same safe box, they should be smaller in size and beside each other
    const pawnRect = getExactClientRect(pawnToCheck.el);
    const elementsAtNextPosition = document.elementsFromPoint(
      pawnRect.left,
      pawnRect.top,
    );
    const isSafeBox = elementsAtNextPosition.some(
      (el) => el.classList.contains("box") && el.classList.contains("safe"),
    );

    return isSafeBox;
  }

  private async sendHome(pawnToKill: Pawn) {
    const isSafeBox = this.checkIsSafeBox(pawnToKill);
    if (isSafeBox) return;

    killSound.play();
    this.el.classList.replace("z-40", "z-50");
    await this.showStompAnimation();
    this.el.classList.replace("z-50", "z-40");

    await pawnToKill.reset();
    const playerToKill = Pawn.getPlayer(pawnToKill.color);
    const pawns = playerToKill.pawns.map((pawn) =>
      pawn.index === pawnToKill.index ? pawnToKill : pawn,
    );

    Pawn.setPlayer(this.color, { ...playerToKill, pawns, hasKilled: true });
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

function getExactClientRect(el: HTMLElement) {
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
