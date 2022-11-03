import { gameReducer, initGameState } from "./GameMechanics";
import {
  Direction,
  GameReducerActionType,
  Translation,
} from "./GameMechanics.types";
import * as GridUtils from "./Grid";
import { Grid } from "./Grid.types";

describe("moving", () => {
  beforeEach(() => {
    jest.spyOn(GridUtils, "insertValueAtIndex").mockImplementation((x) => x);
  });

  const exampleGrid = [
    [0, 2, 0],
    [2, 2, 2],
    [0, 2, 0],
  ];

  describe("left", () => {
    test(`moves grid`, () => {
      expect(moveGrid(exampleGrid, Direction.LEFT)).toMatchObject([
        [2, 0, 0],
        [4, 2, 0],
        [2, 0, 0],
      ]);
    });

    test(`computes translates`, () => {
      expect(computeTranslates(exampleGrid, Direction.LEFT)).toEqual(
        expect.arrayContaining([
          [1, 0],
          [4, 3],
          [5, 4],
          [7, 6],
        ])
      );
    });
  });

  describe("right", () => {
    test(`moves grid`, () => {
      expect(moveGrid(exampleGrid, Direction.RIGHT)).toMatchObject([
        [0, 0, 2],
        [0, 2, 4],
        [0, 0, 2],
      ]);
    });

    test(`computes translates`, () => {
      expect(computeTranslates(exampleGrid, Direction.RIGHT)).toEqual(
        expect.arrayContaining([
          [1, 2],
          [4, 5],
          [3, 4],
          [7, 8],
        ])
      );
    });
  });

  describe("up", () => {
    test(`moves grid`, () => {
      expect(moveGrid(exampleGrid, Direction.UP)).toMatchObject([
        [2, 4, 2],
        [0, 2, 0],
        [0, 0, 0],
      ]);
    });

    test(`computes translates`, () => {
      expect(computeTranslates(exampleGrid, Direction.UP)).toEqual(
        expect.arrayContaining([
          [3, 0],
          [4, 1],
          [7, 4],
          [5, 2],
        ])
      );
    });
  });

  describe("down", () => {
    test(`moves grid`, () => {
      expect(moveGrid(exampleGrid, Direction.DOWN)).toMatchObject([
        [0, 0, 0],
        [0, 2, 0],
        [2, 4, 2],
      ]);
    });

    test(`computes translates`, () => {
      expect(computeTranslates(exampleGrid, Direction.DOWN)).toEqual(
        expect.arrayContaining([
          [3, 6],
          [4, 7],
          [1, 4],
          [5, 8],
        ])
      );
    });
  });

  function moveGrid(grid: Grid, direction: Direction): Grid {
    const state = initGameState([
      GridUtils.getRows(grid),
      GridUtils.getColumns(grid),
      0,
    ]);
    state.grid = grid;
    return gameReducer(state, {
      type: GameReducerActionType.MOVE,
      direction,
    }).grid;
  }

  function computeTranslates(grid: Grid, direction: Direction): Translation[] {
    const state = initGameState([
      GridUtils.getRows(grid),
      GridUtils.getColumns(grid),
      0,
    ]);
    state.grid = grid;
    return gameReducer(state, {
      type: GameReducerActionType.MOVE,
      direction,
    }).translations;
  }
});
