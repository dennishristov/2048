import {
  CSSProperties,
  TransitionEventHandler,
  AnimationEventHandler,
} from "react";
import { Cell, OBSTACLE, Grid } from "./Grid.types";

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

function getCellColor(cell: Cell): string {
  if (cell === OBSTACLE) {
    return "brown";
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
