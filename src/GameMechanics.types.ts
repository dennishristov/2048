import { Grid } from "./Grid.types";

export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

export enum GameReducerActionType {
  MOVE,
  INCREMENT_COMPLETED_TRANSITION,
  HIDE_OVERLAY,
}

export type GameReducerAction =
  | {
      type: GameReducerActionType.MOVE;
      direction: Direction;
    }
  | {
      type: GameReducerActionType.INCREMENT_COMPLETED_TRANSITION;
    }
  | {
      type: GameReducerActionType.HIDE_OVERLAY;
    };

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
