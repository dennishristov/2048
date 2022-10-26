import "./App.css";
import { useEffect, useMemo, useReducer } from "react";
import { isEqual, shuffle } from "lodash";

const OBSTACLE = "OBSTACLE";
type Cell = number | typeof OBSTACLE;
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

function insertValueAtIndex(grid: Grid, value: Cell, i: number): Grid {
  return grid.map((row, rowI) =>
    row.map((cell, cellI) => (rowI * row.length + cellI === i ? value : cell))
  );
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

function moveLeft(grid: Grid): Grid {
  return grid.map((row) => {
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
      }

      const nextPopulatedCellI = findNextPopulatedCellIndex(mutableRow, i);
      if (nextPopulatedCellI === -1) {
        continue;
      }

      // Sum if there is the a cell with the same value ahead
      if (mutableRow[i] === mutableRow[nextPopulatedCellI]) {
        //@ts-ignore, we checked for obstacle already
        mutableRow[i] *= 2;
        mutableRow[nextPopulatedCellI] = 0;
      }
    }

    return mutableRow;
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
      return transpose(
        flipHorizontal(moveLeft(flipHorizontal(transpose(grid))))
      );
  }
}

function gameReducer(grid: Grid, direction: Direction): Grid {
  const moved = move(grid, direction);

  if (isEqual(moved, grid)) {
    return grid;
  }

  const newEntryI = findRandomEmptyCellIndex(moved);
  return insertValueAtIndex(moved, MIN_CELL_VALUE, newEntryI);
}

function initGrid([rows, columns, obstacles]: [number, number, number]): Grid {
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
  const grid = createEmptyGrid(rows, columns);
  const withObstacles = Array(obstacles)
    .fill(0)
    .reduce(
      (result) =>
        insertValueAtIndex(result, OBSTACLE, findRandomEmptyCellIndex(result)),
      grid
    );
  const starter = findRandomEmptyCellIndex(withObstacles);

  return insertValueAtIndex(withObstacles, MIN_CELL_VALUE, starter);
}

const defaultGameArgs: [number, number, number] = [6, 6, 3];

//https://www.learnui.design/tools/data-color-picker.html#divergent
const colorArray = [
  "#554994",
  "#7d66a7",
  "#a186bb",
  "#c3a9d0",
  "#e2cde6",
  "#fff2ff",
  "#ffe9f7",
  "#ffe0ea",
  "#ffd8da",
  "#ffd1c7",
  "#ffccb3",
];

function log2(value: number): number {
  return Math.log(value) / Math.log(2);
}

function App() {
  const [grid, dispatch] = useReducer(gameReducer, defaultGameArgs, initGrid);

  useEffect(() => {
    const keyToDirectionMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    } as const;

    const keydownHandler = ({ key }: KeyboardEvent) => {
      if (key in keyToDirectionMap) {
        dispatch(keyToDirectionMap[key as keyof typeof keyToDirectionMap]);
      }
    };

    document.addEventListener("keydown", keydownHandler);

    return () => {
      document.removeEventListener("keydown", keydownHandler);
    };
  }, []);

  const hasWon = useMemo(() => grid.flat().includes(2048), [grid]);

  return (
    <div className="grid">
      {grid.map((row, ri) => (
        <div className="row" key={ri}>
          {row.map((c, ci) => (
            <span
              className="cell"
              key={ci}
              style={{
                backgroundColor:
                  colorArray[log2(typeof c === "number" ? c : 1) - 1],
              }}
            >
              {c}
            </span>
          ))}
        </div>
      ))}
      {hasWon && <div>Congratulations, you won!</div>}
    </div>
  );
}

export default App;
