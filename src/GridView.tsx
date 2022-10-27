import {
  CSSProperties,
  TransitionEventHandler,
  AnimationEventHandler,
  memo,
} from "react";
import { getColumns } from "./Grid";
import { Cell, OBSTACLE, Grid } from "./Grid.types";

const colorArray = [
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

function log2(value: number): number {
  return Math.log(value) / Math.log(2);
}

function getCellColor(cell: Cell): string {
  if (cell === OBSTACLE) {
    return "#ACA295";
  }

  if (cell === 0) {
    return "transparent";
  }

  return colorArray[log2(cell) - 1];
}

export function GridView({
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
          {row.map((value, ci) => (
            <span
              className="cell"
              key={ci + ri * getColumns(grid)}
              style={{
                backgroundColor: getCellColor(value),
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
