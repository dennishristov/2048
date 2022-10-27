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

const defaultGameArgs: [number, number, number] = [6, 6, 0];

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
        transition: `transform 0.16s ease`,
      };
    });
}

function Game() {
  const [{ grid, translations, previousGrid, animationState }, dispatch] =
    useReducer(gameReducer, defaultGameArgs, initGameState);
  const transforms = useMemo(
    () =>
      mapTranslationsToTransforms(
        defaultGameArgs[0],
        defaultGameArgs[1],
        translations
      ),
    [translations]
  );

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
  }, [animationState]);

  const transitionEndHandler = () =>
    dispatch({ type: GameReducerActionType.INCREMENT_COMPLETED_TRANSITION });

  const hasWon = useMemo(() => grid.flat().includes(2048), [grid]);

  return (
    <div className="game">
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
    </div>
  );
}

export default Game;
