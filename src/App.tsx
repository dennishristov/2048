import "./App.css";
import {
  AnimationEventHandler,
  CSSProperties,
  TransitionEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { isEqual, shuffle } from "lodash";

const OBSTACLE = "OBSTACLE";
type Cell = number | typeof OBSTACLE;
type Grid = Cell[][];
const MIN_CELL_VALUE = 2;
type Direction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "start-overlay"
  | "end-overlay";
type Translation = [number, number];
enum AnimationState {
  SETTLED,
  MOVING,
  OVERLAYING,
}
type GameState = {
  grid: Grid;
  previousGrid: Grid;
  translations: Translation[];
  animationState: AnimationState;
};

function createEmptyGrid(rows: number, columns: number): number[][] {
  return Array(rows)
    .fill(0)
    .map(() => Array(columns).fill(0));
}

function createIndexGrid(rows: number, columns: number): number[][] {
  return Array(rows)
    .fill(0)
    .map((_, ri) =>
      Array(columns)
        .fill(0)
        .map((_, ci) => rows * ri + ci)
    );
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

function moveLeft(grid: Grid): [Grid, Translation[]] {
  const columns = grid[0].length;
  const translations: Translation[] = [];

  const moved = grid.map((row, rowI) => {
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

  return [moved, translations];
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

function getRows(grid: Grid): number {
  return grid.length;
}

function getColumns(grid: Grid): number {
  return grid[0].length;
}

function move(grid: Grid, direction: Direction): [Grid, Translation[]] {
  switch (direction) {
    case "left":
      return moveLeft(grid);
    case "right":
      const [moved, translations] = moveLeft(flipHorizontal(grid));
      const transformedIndices = flipHorizontal(
        createIndexGrid(getRows(grid), getColumns(grid))
      ).flat();

      return [
        moved,
        translations.map(
          ([from, to]): Translation => [
            transformedIndices[from],
            transformedIndices[to],
          ]
        ),
      ];
    default:
      return [grid, []];
    // case "up":
    //   return transpose(moveLeft(transpose(grid)));
    // case "down":
    //   return transpose(
    //     flipHorizontal(moveLeft(flipHorizontal(transpose(grid))))
    //   );
  }
}

function gameReducer(state: GameState, action: Direction): GameState {
  switch (action) {
    case "start-overlay":
      return {
        ...state,
        animationState: AnimationState.OVERLAYING,
      };
    case "end-overlay":
      return {
        ...state,
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
  };
}

function initGameState([rows, columns, obstacles]: [
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
  };
}

const defaultGameArgs: [number, number, number] = [6, 6, 0];

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

function mapTranslationsToTransforms(
  rows: number,
  columns: number,
  translations: Translation[]
): Partial<CSSProperties>[] {
  return Array(rows * columns)
    .fill(0)
    .map((_, i): Partial<CSSProperties> => {
      const t = translations.find(([from]) => from === i);

      if (!t) {
        return {};
      }

      const [from, to] = t;
      const diff = to - from;

      const axis = Math.abs(diff) > columns ? "Y" : "X";

      return {
        transform: `translate${axis}(${diff * 64}px)`,
        transition: `transform ${Math.abs(diff) * 0.04}s ease`,
      };
    });
}

function getCellColor(cell: Cell): string {
  if (cell === OBSTACLE) {
    return "brown";
  }

  if (cell === 0) {
    return "transparent";
  }

  return colorArray[log2(cell) - 1];
}

function GridView({
  grid,
  transforms,
  className = "",
  onTransitionEnd,
  onAnimationEnd,
}: {
  className?: string;
  grid: Grid;
  transforms?: Partial<CSSProperties>[];
  onTransitionEnd?: TransitionEventHandler;
  onAnimationEnd?: AnimationEventHandler;
}): JSX.Element {
  return (
    <div
      className={`grid ${className}`}
      onTransitionEnd={onTransitionEnd}
      onAnimationEnd={onAnimationEnd}
    >
      {grid.map((row, ri) => (
        <div className="row" key={ri}>
          {row.map((c, ci) => (
            <span
              className="cell"
              key={ci}
              style={{
                backgroundColor: getCellColor(c),
                ...transforms?.[ri * row.length + ci],
              }}
            >
              {c || null}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [{ grid, translations, previousGrid, animationState }, dispatch] =
    useReducer(gameReducer, defaultGameArgs, initGameState);
  const transforms = mapTranslationsToTransforms(
    defaultGameArgs[0],
    defaultGameArgs[1],
    translations
  );

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

  const completedTranslations = useRef(0);
  const transitionEndHandler = useCallback(() => {
    completedTranslations.current++;
    if (completedTranslations.current === translations.length) {
      dispatch("start-overlay");
      completedTranslations.current = 0;
    }
  }, [completedTranslations, translations.length]);

  return (
    <div className="game">
      <div className="grid-container">
        <GridView
          grid={previousGrid ?? grid}
          transforms={transforms}
          onTransitionEnd={transitionEndHandler}
        />
        {animationState === AnimationState.OVERLAYING && (
          <GridView
            grid={grid}
            className={`grid-overlay`}
            onAnimationEnd={() => {
              dispatch("end-overlay");
            }}
          />
        )}
      </div>
      {hasWon && <div>Congratulations, you won!</div>}
    </div>
  );
}

export default App;
