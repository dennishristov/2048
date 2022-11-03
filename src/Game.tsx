import "./Game.css";

import { CSSProperties, useEffect, useMemo, useReducer, useState } from "react";
import {
  gameReducer,
  hasMetWinCondition,
  hasNoAvailableMoves,
  initGameState,
} from "./GameMechanics";
import {
  AnimationState,
  Direction,
  GameReducerActionType,
  Translation,
} from "./GameMechanics.types";
import { GridView } from "./GridView";
import {
  BIG_TILE_SIZE,
  MAX_GRID_SIZE,
  SMALL_TILE_SIZE,
} from "./sizeConstraints";

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
    useReducer(gameReducer, [rows, columns, obstacles], initGameState);
  const tileSize = useDynamicTileSize();

  const transforms = useMemo(
    () => mapTranslationsToTransforms(rows, columns, translations, tileSize),
    [rows, columns, translations, tileSize]
  );

  const transitionEndHandler = () =>
    dispatch({ type: GameReducerActionType.INCREMENT_COMPLETED_TRANSITION });

  const hasWon = useMemo(() => hasMetWinCondition(grid), [grid]);
  const hasLost = useMemo(() => hasNoAvailableMoves(grid), [grid]);

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
          data-testid="game"
          grid={previousGrid}
          transforms={transforms}
          onTransitionEnd={transitionEndHandler}
          key="grid"
          tileSize={tileSize}
        />
        {animationState === AnimationState.OVERLAYING && (
          <GridView
            grid={grid}
            className="grid-overlay"
            onAnimationEnd={() => {
              dispatch({ type: GameReducerActionType.HIDE_OVERLAY });
            }}
            key="overlay"
            tileSize={tileSize}
          />
        )}
        {hasWon && (
          <div className="game-result-message">
            Congratulations, you won!
            <div className="emojis">🎉🎊🍾</div>
          </div>
        )}
        {hasLost && <div className="game-result-message">Game over.</div>}
      </div>
    </>
  );
}

function mapTranslationsToTransforms(
  rows: number,
  columns: number,
  translations: Translation[],
  squareSize: number
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
        transform: `translate${axis}(${moveBy * squareSize}px)`,
        transition: `transform 0.08s ease`,
      };
    });
}

function useDynamicTileSize(): number {
  const [size, setSize] = useState(BIG_TILE_SIZE);

  useEffect(() => {
    const resizeHandler = () =>
      setSize(
        Math.min(window.innerHeight, window.innerWidth) >
          MAX_GRID_SIZE * BIG_TILE_SIZE + 2 * 16
          ? BIG_TILE_SIZE
          : SMALL_TILE_SIZE
      );
    window.addEventListener("resize", resizeHandler);
    resizeHandler();

    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  return size;
}
