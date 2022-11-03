import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Game } from "./Game";
import * as GameMechanics from "./GameMechanics";
import { AnimationState } from "./GameMechanics.types";
import { Grid } from "./Grid.types";

const grid = [
  [2048, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

beforeEach(() => {
  jest.spyOn(GameMechanics, "initGameState").mockImplementation(() => ({
    translations: [],
    animationState: AnimationState.SETTLED,
    completedTranslations: 0,
    previousGrid: grid,
    grid,
  }));
});

test("renders game", () => {
  render(<Game rows={4} columns={4} obstacles={0} />);
  expect(screen.getByTestId("game")).toBeInTheDocument();
});

test("renders game tiles", () => {
  render(<Game rows={4} columns={4} obstacles={0} />);
  expect(screen.getAllByTestId("tile").map((x) => x.innerHTML)).toMatchObject(
    getGridOutput(grid)
  );
});

test("accommodates keyboard input game tiles", async () => {
  render(<Game rows={4} columns={4} obstacles={0} />);

  const newGrid = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2048, 0, 0, 0],
  ];
  jest.spyOn(GameMechanics, "gameReducer").mockImplementationOnce(() => ({
    translations: [],
    animationState: AnimationState.SETTLED,
    completedTranslations: 0,
    previousGrid: newGrid,
    grid: newGrid,
  }));

  fireEvent(document, new KeyboardEvent("keydown", { key: "ArrowDown" }));

  expect(screen.getAllByTestId("tile").map((x) => x.innerHTML)).toMatchObject(
    getGridOutput(newGrid)
  );
});

function getGridOutput(grid: Grid): string[] {
  return grid.flat().map((x) => (x === 0 ? "" : x.toString()));
}
