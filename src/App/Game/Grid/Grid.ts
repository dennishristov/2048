import { shuffle } from "lodash";
import { Grid, TileValue } from "./Grid.types";

export function createEmptyGrid(rows: number, columns: number): number[][] {
  return Array(rows)
    .fill(0)
    .map(() => Array(columns).fill(0));
}

export function createIndexGrid(rows: number, columns: number): number[][] {
  return Array(rows)
    .fill(0)
    .map((_, ri) =>
      Array(columns)
        .fill(0)
        .map((_, ci) => columns * ri + ci)
    );
}

export function findRandomEmptyTileIndex(grid: Grid): number {
  const shuffledIdxPairs = shuffle(
    grid.flat().map((x, i): [TileValue, number] => [x, i])
  );
  const [, i] = shuffledIdxPairs.find(([x]) => x === 0) ?? [-1, -1];

  return i;
}

export function insertValueAtIndex(
  grid: Grid,
  value: TileValue,
  i: number
): Grid {
  return grid.map((row, rowI) =>
    row.map((x, columnI) => (rowI * row.length + columnI === i ? value : x))
  );
}

export function getRows(grid: Grid): number {
  return grid.length;
}

export function getColumns(grid: Grid): number {
  return grid[0].length;
}
