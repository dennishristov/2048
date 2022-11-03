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
  findRandomEmptyTileIndex,
  MIN_TILE_VALUE,
  getColumns,
  createIndexGrid,
  getRows,
} from "./Grid";
import { OBSTACLE, Grid, TileValue } from "./Grid.types";

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
        insertValueAtIndex(result, OBSTACLE, findRandomEmptyTileIndex(result)),
      empty
    );
  const starter = findRandomEmptyTileIndex(withObstacles);

  const grid = insertValueAtIndex(withObstacles, MIN_TILE_VALUE, starter);

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

      const newEntryI = findRandomEmptyTileIndex(moved);
      const grid = insertValueAtIndex(moved, MIN_TILE_VALUE, newEntryI);

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

export function hasNoAvailableMoves(grid: Grid): boolean {
  return [Direction.LEFT, Direction.RIGHT, Direction.UP, Direction.DOWN].every(
    (x) => isEqual(grid, move(grid, x)[0])
  );
}

export const WIN_CONDITION_TILE_VALUE = 2048;

export function hasMetWinCondition(grid: Grid): boolean {
  return grid.flat().includes(WIN_CONDITION_TILE_VALUE);
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
        const nextPopulatedTileI = findNextPopulatedTileIndex(mutableRow, i);
        if (nextPopulatedTileI === -1) {
          continue;
        }

        mutableRow[i] = mutableRow[nextPopulatedTileI];
        mutableRow[nextPopulatedTileI] = 0;

        const from = nextPopulatedTileI + rowI * columns;
        const to = i + rowI * columns;
        translations.push([from, to]);
      }

      const nextPopulatedTileI = findNextPopulatedTileIndex(mutableRow, i);
      if (nextPopulatedTileI === -1) {
        continue;
      }

      // Sum if there is the a tile with the same value ahead
      if (mutableRow[i] === mutableRow[nextPopulatedTileI]) {
        //@ts-ignore, we checked for an obstacle already
        mutableRow[i] *= 2;
        mutableRow[nextPopulatedTileI] = 0;

        const from = nextPopulatedTileI + rowI * columns;
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

function findNextPopulatedTileIndex(row: TileValue[], start: number): number {
  const nextObstacleIndex = row
    .slice(start + 1, row.length)
    .findIndex((x) => x === OBSTACLE);

  const boundaryIndex =
    nextObstacleIndex === -1 ? row.length : start + 1 + nextObstacleIndex;

  const nextPopulatedTileI = row
    .slice(start + 1, boundaryIndex)
    .findIndex((x) => x > 0);

  if (nextPopulatedTileI === -1) {
    return -1;
  }

  return start + 1 + nextPopulatedTileI;
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
