import { isEqual } from "lodash";
import {
  AnimationState,
  Direction,
  GameReducerAction,
  GameReducerActionType,
  GameState,
  Transformation,
  Translation,
} from "./GameMechanics.types";
import {
  createEmptyGrid,
  insertValueAtIndex,
  findRandomEmptyCellIndex,
  MIN_CELL_VALUE,
  getColumns,
  createIndexGrid,
  getRows,
} from "./Grid";
import { OBSTACLE, Grid, Cell } from "./Grid.types";

export function initGameState([rows, columns, obstacles]: [
  number,
  number,
  number
]): GameState {
  // some interesting corner cases
  // return [
  // [0, OBSTACLE, 2, 0, 0, 0],
  // [0, 0, 0, 2, OBSTACLE, 0],
  // [0, 2, 0, 2, 4],
  // [0, OBSTACLE, 2, 2, 4],
  // [2, OBSTACLE, 2, 2, 4],
  // [0, 2, 2, 2, 4],
  // [2, 2, 2, 2, 4],
  // ];
  // return [
  //   [
  //     [0, 0, 2],
  //     [0, 0, 2],
  //     [0, 0, 2],
  //   ],
  //   [],
  // ];
  const empty = createEmptyGrid(rows, columns);
  const withObstacles = Array(obstacles)
    .fill(0)
    .reduce(
      (result) =>
        insertValueAtIndex(result, OBSTACLE, findRandomEmptyCellIndex(result)),
      empty
    );
  const starter = findRandomEmptyCellIndex(withObstacles);

  const grid = insertValueAtIndex(withObstacles, MIN_CELL_VALUE, starter);

  return {
    grid,
    translations: [],
    previousGrid: grid,
    animationState: AnimationState.SETTLED,
    completedTranslations: 0,
  };
}

export function gameReducer(
  state: GameState,
  action: GameReducerAction
): GameState {
  switch (action.type) {
    case GameReducerActionType.MOVE:
      const [moved, translations] = move(state.grid, action.direction);

      if (isEqual(moved, state.grid)) {
        return state;
      }

      const newEntryI = findRandomEmptyCellIndex(moved);
      const grid = insertValueAtIndex(moved, MIN_CELL_VALUE, newEntryI);

      return {
        grid,
        previousGrid: state.grid,
        translations,
        animationState: AnimationState.MOVING,
        completedTranslations: 0,
      };

    case GameReducerActionType.INCREMENT_COMPLETED_TRANSITION:
      if (state.completedTranslations + 1 === state.translations.length) {
        return {
          ...state,
          completedTranslations: 0,
          animationState: AnimationState.OVERLAYING,
        };
      }

      return {
        ...state,
        completedTranslations: state.completedTranslations + 1,
      };

    case GameReducerActionType.HIDE_OVERLAY:
      return {
        ...state,
        completedTranslations: 0,
        translations: [],
        previousGrid: state.grid,
        animationState: AnimationState.SETTLED,
      };
  }
}

function move(grid: Grid, direction: Direction): [Grid, Translation[]] {
  switch (direction) {
    case Direction.LEFT:
      return moveLeft(grid, [identity]);
    case Direction.RIGHT:
      return moveLeft(grid, [flipHorizontal]);
    case Direction.UP:
      return moveLeft(grid, [transpose]);
    case Direction.DOWN:
      return moveLeft(grid, [transpose, flipHorizontal]);
  }
}

function moveLeft(
  grid: Grid,
  transformations: Transformation[]
): [Grid, Translation[]] {
  const transformed = transformations.reduce(transformAccumulator, grid);
  const columns = getColumns(transformed);
  const translations: Translation[] = [];

  const moved = transformed.map((row, rowI) => {
    const mutableRow = row.slice();

    for (let i = 0; i < row.length; i++) {
      if (mutableRow[i] === OBSTACLE) {
        continue;
      }

      // Move next positive value to the left most side of the row
      if (mutableRow[i] === 0) {
        const nextPopulatedCellI = findNextPopulatedCellIndex(mutableRow, i);
        if (nextPopulatedCellI === -1) {
          continue;
        }

        mutableRow[i] = mutableRow[nextPopulatedCellI];
        mutableRow[nextPopulatedCellI] = 0;

        const from = nextPopulatedCellI + rowI * columns;
        const to = i + rowI * columns;
        translations.push([from, to]);
      }

      const nextPopulatedCellI = findNextPopulatedCellIndex(mutableRow, i);
      if (nextPopulatedCellI === -1) {
        continue;
      }

      // Sum if there is the a cell with the same value ahead
      if (mutableRow[i] === mutableRow[nextPopulatedCellI]) {
        //@ts-ignore, we checked for an obstacle already
        mutableRow[i] *= 2;
        mutableRow[nextPopulatedCellI] = 0;

        const from = nextPopulatedCellI + rowI * columns;
        const to = i + rowI * columns;
        translations.push([from, to]);
      }
    }

    return mutableRow;
  });

  const normalizedGrid = transformations
    .slice()
    .reverse()
    .reduce(transformAccumulator, moved);

  const transformedIndices = transformations
    .reduce(
      transformAccumulator,
      createIndexGrid(getRows(grid), getColumns(grid))
    )
    .flat() as number[];

  const normalizedTranslations = translations.map(
    ([from, to]): Translation => [
      transformedIndices[from],
      transformedIndices[to],
    ]
  );

  return [normalizedGrid, normalizedTranslations];
}

function findNextPopulatedCellIndex(row: Cell[], start: number): number {
  const nextObstacleIndex = row
    .slice(start + 1, row.length)
    .findIndex((x) => x === OBSTACLE);

  const boundaryIndex =
    nextObstacleIndex === -1 ? row.length : start + 1 + nextObstacleIndex;

  const nextPopulatedCellI = row
    .slice(start + 1, boundaryIndex)
    .findIndex((x) => x > 0);

  if (nextPopulatedCellI === -1) {
    return -1;
  }

  return start + 1 + nextPopulatedCellI;
}

function identity<T>(grid: T[][]): T[][] {
  return grid;
}

/**
 * [0, 2, 4]
 * [0, 0, 8]
 * [0, 0, 0]
 * to
 * [4, 2, 0]
 * [8, 0, 0]
 * [0, 0, 0]
 */
function flipHorizontal<T>(grid: T[][]): T[][] {
  return grid.map((row) => row.slice().reverse());
}

/**
 * [0, 2, 4]
 * [0, 0, 8]
 * [0, 0, 0]
 * to
 * [0, 0, 0]
 * [2, 0, 0]
 * [4, 8, 0]
 */
function transpose<T>(grid: T[][]): T[][] {
  const columns = grid[0].length;
  const rows = grid.length;

  return Array(columns)
    .fill(0)
    .map((_, ci) =>
      Array(rows)
        .fill(0)
        .map((_, ri) => grid[ri][ci])
    );
}

function transformAccumulator(grid: Grid, transform: Transformation): Grid {
  return transform(grid);
}
