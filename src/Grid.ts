import { shuffle } from "lodash";
import { Grid, Cell } from "./Grid.types";

export const MIN_CELL_VALUE = 2;

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

export function findRandomEmptyCellIndex(grid: Grid): number {
  const shuffledIdxPairs = shuffle(
    grid.flat().map((cell, i): [Cell, number] => [cell, i])
  );
  const [, i] = shuffledIdxPairs.find(([cell]) => cell === 0) ?? [-1, -1];

  return i;
}

export function insertValueAtIndex(grid: Grid, value: Cell, i: number): Grid {
  return grid.map((row, rowI) =>
    row.map((cell, cellI) => (rowI * row.length + cellI === i ? value : cell))
  );
}

export function getRows(grid: Grid): number {
  return grid.length;
}

export function getColumns(grid: Grid): number {
  return grid[0].length;
}
