import logo from "./logo.svg";
import "./App.css";
import { useReducer } from "react";
import { isEqual, shuffle } from "lodash";

/**
 * [
 *  [0, 0, 0, 0, 0, 0],
 *  [0, 0, 0, 0, 0, 0],
 *  [0, 0, 0, 0, 0, 0],
 *  [0, 0, 0, 0, 0, 0],
 *  [0, 0, 0, 0, 0, 0],
 *  [0, 0, 0, 0, 0, 0],
 * ]
 */
const OBSTACLE = "OBSTACLE";
type Cell = number;
type Grid = Cell[][];
const MIN_CELL_VALUE = 2;

type Direction = "up" | "down" | "left" | "right";

function createEmptyGrid(rows: number, columns: number): Grid {
  return Array(rows)
    .fill(0)
    .map(() => Array(columns).fill(0));
}

function findRandomEmptyCellIndex(grid: Grid): number {
  const shuffledIdxPairs = shuffle(
    grid.flat().map((cell, i): [Cell, number] => [cell, i])
  );
  const [, i] = shuffledIdxPairs.find(([cell]) => cell === 0) ?? [-1, -1];

  return i;
}

function insertValueAtIndex(grid: Grid, value: number, i: number): Grid {
  return grid.map((row, rowI) =>
    row.map((cell, cellI) => (rowI * row.length + cellI === i ? value : cell))
  );
}

function findNextPopulatedCellIndex(row: Cell[], start: number): number {
  const nextPopulatedCellI = row
    .slice(start + 1, row.length)
    .findIndex((x) => x > 0);

  if (nextPopulatedCellI === -1) {
    return -1;
  }

  return start + nextPopulatedCellI + 1;
}

function moveLeft(grid: Grid): Grid {
  return grid.map((row) => {
    const slice = row.slice();

    for (let i = 0; i < row.length; i++) {
      const nextPopulatedCellI = findNextPopulatedCellIndex(slice, i);

      if (nextPopulatedCellI === -1) {
        continue;
      }

      if (slice[i] === 0) {
        slice[i] = slice[nextPopulatedCellI];
        slice[nextPopulatedCellI] = 0;
      }

      if (slice[i] === slice[nextPopulatedCellI]) {
        slice[i] *= 2;
        slice[nextPopulatedCellI] = 0;
      }
    }

    return slice;
  });
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
function flipHorizontal(grid: Grid): Grid {
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
function transpose(grid: Grid): Grid {
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

function move(grid: Grid, direction: Direction): Grid {
  switch (direction) {
    case "left":
      return moveLeft(grid);
    case "right":
      return flipHorizontal(moveLeft(flipHorizontal(grid)));
    case "up":
      return transpose(moveLeft(transpose(grid)));
    case "down":
      // return transpose(
      //   flipHorizontal(moveLeft(transpose(flipHorizontal(grid))))
      // );
      return transpose(
        flipHorizontal(moveLeft(flipHorizontal(transpose(grid))))
      );
  }
}

function gameReducer(grid: Grid, direction: Direction): Grid {
  const moved: Grid = move(grid, direction);

  if (!isEqual(moved, grid)) {
    const newEntryI = findRandomEmptyCellIndex(moved);
    return insertValueAtIndex(moved, MIN_CELL_VALUE, newEntryI);
  }

  return grid;
}

function initGrid([rows, columns]: [number, number]): Grid {
  const grid = createEmptyGrid(rows, columns);
  const starter = findRandomEmptyCellIndex(grid);

  return insertValueAtIndex(grid, MIN_CELL_VALUE, starter);
}

const hello: [number, number] = [6, 6];

const colorArray = [
  "red",
  "green",
  "blue",
  "orange",
  "yellow",
  "white",
].reverse();

function log2(value: number): number {
  return Math.log(value) / Math.log(2);
}

function App() {
  const [grid, dispatch] = useReducer(gameReducer, hello, initGrid);

  return (
    <div className="grid">
      {grid.map((row, ri) => (
        <div className="row" key={ri}>
          {row.map((c, ci) => (
            <span
              className="cell"
              key={ci}
              style={{ backgroundColor: colorArray[log2(c)] }}
            >
              {c}
            </span>
          ))}
        </div>
      ))}
      <button onClick={() => dispatch("left")}>Left</button>
      <button onClick={() => dispatch("right")}>Right</button>
      <button onClick={() => dispatch("up")}>Up</button>
      <button onClick={() => dispatch("down")}>Down</button>
    </div>
  );
}

export default App;
