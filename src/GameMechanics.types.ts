import { Grid } from "./Grid.types";

export type Direction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "end-overlay"
  | "increment-completed-transition";

/**
 * translation from index to index
 */
export type Translation = [number, number];

export enum AnimationState {
  SETTLED,
  MOVING,
  OVERLAYING,
}

export type GameState = {
  grid: Grid;
  previousGrid: Grid;
  translations: Translation[];
  animationState: AnimationState;
  completedTranslations: number;
};

export type Transformation = (grid: Grid) => Grid;
