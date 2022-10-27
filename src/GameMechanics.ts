import { isEqual } from "lodash";
import {
  AnimationState,
  Direction,
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

export function gameReducer(state: GameState, action: Direction): GameState {
  switch (action) {
    case "increment-completed-transition":
      if (state.animationState !== AnimationState.MOVING) {
        console.log("fuck");
        break;
      }
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

    case "end-overlay":
      return {
        ...state,
        completedTranslations: 0,
        translations: [],
        previousGrid: state.grid,
        animationState: AnimationState.SETTLED,
      };
  }
  const [moved, translations] = move(state.grid, action);

  if (isEqual(moved, state.grid)) {
    return state;
  }

  const newEntryI = findRandomEmptyCellIndex(moved);

  return {
    previousGrid: state.grid,
    grid: insertValueAtIndex(moved, MIN_CELL_VALUE, newEntryI),
    translations,
    animationState: AnimationState.MOVING,
    completedTranslations: 0,
  };
}

function move(grid: Grid, direction: Direction): [Grid, Translation[]] {
  switch (direction) {
    case "left":
      return moveLeft(grid, [identity]);
    case "right":
      return moveLeft(grid, [flipHorizontal]);
    case "up":
      return moveLeft(grid, [transpose]);
    case "down":
      return moveLeft(grid, [transpose, flipHorizontal]);
    default:
      return [grid, []];
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

  const reverseTransforms = transformations
    .slice()
    .reverse()
    .reduce(transformAccumulator, moved);

  const transformedIndices = transformations
    .reduce(
      transformAccumulator,
      createIndexGrid(getRows(transformed), getColumns(transformed))
    )
    .flat() as number[];

  const mappedTranslations = translations.map(
    ([from, to]): Translation => [
      transformedIndices[from],
      transformedIndices[to],
    ]
  );

  return [reverseTransforms, mappedTranslations];
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
