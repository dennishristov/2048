import "./App.css";

import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { gameReducer, initGameState } from "./GameMechanics";
import { AnimationState, Translation } from "./GameMechanics.types";
import { GridView } from "./GridView";

const defaultGameArgs: [number, number, number] = [6, 6, 4];

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

      // console.log(axis, moveBy, diff);

      return {
        transform: `translate${axis}(${moveBy * 64}px)`,
        transition: `transform ${Math.abs(moveBy) * 0.04}s ease`,
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
  }, [animationState]);

  const transitionEndHandler = useCallback(() => {
    dispatch("increment-completed-transition");
  }, []);

  const hasWon = useMemo(() => grid.flat().includes(2048), [grid]);
  console.log(animationState);
  return (
    <div className="game">
      <div className="grid-container">
        <GridView
          grid={previousGrid}
          transforms={transforms}
          onTransitionEnd={transitionEndHandler}
          key={(animationState === AnimationState.OVERLAYING).toString()}
        />
        {animationState === AnimationState.OVERLAYING && (
          <GridView
            grid={grid}
            className={`grid-overlay`}
            onAnimationEnd={() => {
              dispatch("end-overlay");
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
