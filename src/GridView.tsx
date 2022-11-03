import {
  CSSProperties,
  TransitionEventHandler,
  AnimationEventHandler,
} from "react";
import { getColumns } from "./Grid";
import { TileValue, OBSTACLE, Grid } from "./Grid.types";

function log2(value: number): number {
  return Math.log(value) / Math.log(2);
}

const TILE_COLOR_ARRAY = [
  "#2270ed",
  "#5a54ce",
  "#9138ae",
  "#ad2a9e",
  "#c81c8e",
  "#f84492",
  "#fe453c",
  "#fe6823",
  "#fd8a09",
  "#df9e1b",
  "#c0b12d",
  "#82d750",
];

function getTileColor(cell: TileValue): string {
  if (cell === OBSTACLE) {
    return "#aca295";
  }

  if (cell === 0) {
    return "transparent";
  }

  return TILE_COLOR_ARRAY[log2(cell) - 1];
}

const SQUARE_MARGIN = 2;

export function GridView({
  grid,
  tileSize,
  transforms,
  className = "",
  onTransitionEnd,
  onAnimationEnd,
}: {
  className?: string;
  tileSize: number;
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
          {row.map((value, ci) => (
            <span
              className="tile"
              key={ci + ri * getColumns(grid)}
              style={{
                width: tileSize - 2 * SQUARE_MARGIN,
                height: tileSize - 2 * SQUARE_MARGIN,
                backgroundColor: getTileColor(value),
                fontSize: 8 + tileSize / 8,
                ...transforms?.[ri * getColumns(grid) + ci],
              }}
            >
              {value !== OBSTACLE && value !== 0 && value}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
