import "./Game.css";

import { CSSProperties, useEffect, useMemo, useReducer } from "react";

import { gameReducer, initGameState } from "./GameMechanics";
import {
  AnimationState,
  Direction,
  GameReducerActionType,
  Translation,
} from "./GameMechanics.types";
import { GridView } from "./GridView";

export function Game({
  rows,
  columns,
  obstacles,
}: {
  rows: number;
  columns: number;
  obstacles: number;
}) {
  const [{ grid, translations, previousGrid, animationState }, dispatch] =
    useReducer(gameReducer, initGameState([rows, columns, obstacles]));

  const transforms = useMemo(
    () => mapTranslationsToTransforms(rows, columns, translations),
    [rows, columns, translations]
  );

  const transitionEndHandler = () =>
    dispatch({ type: GameReducerActionType.INCREMENT_COMPLETED_TRANSITION });

  const hasWon = useMemo(() => grid.flat().includes(2048), [grid]);

  useEffect(() => {
    const keyToDirectionMap = {
      ArrowUp: Direction.UP,
      ArrowDown: Direction.DOWN,
      ArrowLeft: Direction.LEFT,
      ArrowRight: Direction.RIGHT,
    } as const;

    const keydownHandler = ({ key }: KeyboardEvent) => {
      if (key in keyToDirectionMap) {
        dispatch({
          type: GameReducerActionType.MOVE,
          direction: keyToDirectionMap[key as keyof typeof keyToDirectionMap],
        });
      }
    };

    document.addEventListener("keydown", keydownHandler);

    return () => {
      document.removeEventListener("keydown", keydownHandler);
    };
  }, []);

  return (
    <>
      <div className="grid-container">
        <GridView
          grid={previousGrid}
          transforms={transforms}
          onTransitionEnd={transitionEndHandler}
          key="grid"
        />
        {animationState === AnimationState.OVERLAYING && (
          <GridView
            grid={grid}
            className={`grid-overlay`}
            onAnimationEnd={() => {
              dispatch({ type: GameReducerActionType.HIDE_OVERLAY });
            }}
            key="overlay"
          />
        )}
      </div>
      {hasWon && <div>Congratulations, you won!</div>}
    </>
  );
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

      const axis = Math.abs(diff) >= columns ? "Y" : "X";
      const moveBy = axis === "Y" ? diff / columns : diff;

      return {
        transform: `translate${axis}(${moveBy * 64}px)`,
        transition: `transform 0.08s ease`,
      };
    });
}
