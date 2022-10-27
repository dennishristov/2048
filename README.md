# 2048

There are a couple of things I find interesting about the solution that I would like to explain a bit.

## Game State

The entire state of the game is stored in an object looking like:

```
export type GameState = {
  grid: Grid;
  previousGrid: Grid;
  translations: Translation[];
  animationState: AnimationState;
  completedTranslations: number;
};
```

Let's dig deeper into a couple of these:

- `gird`: a matrix representing the values of the cells possible values are
  -- 0: empty
  -- > 0: a visible cell with a positive value
  -- OBSTACLE: represents itself
- the rest are implementation details for how we animate moving and placing the cells

## Game Mechanics

Implementing the algorithm that accommodates all directions is eased up by implementing one just for `LEFT`. Applying linear transformations on the `grid` matrix allows us to reuse the former algorithm for implementing the rest of the directions. One can inspect details on that [here](https://github.com/denishristov/2048/blob/ad3a15a6cebeec63edcafafa478d59c5b3c1c94d/src/GameMechanics.ts#L114)

> Note: I did get some inspiration for this by seeing [this fellow dev](https://github.com/gabrielecirulli/2048/blob/fc1ef4fe5a5fcccea7590f3e4c187c75980b353f/js/game_manager.js#L194) describing directions as vectors which reminded me of linear transformations for matrices. I would also like to thank 3Blue1Brown for his amazing videos on linear algebra (all of them are great, in fact), which built my intuition for coming up with the solution.

## Animating the cells

We can describe the state of the game in regard to animating the cells by having these 3 states that go in a sequential loop:

- `SETTLED`: the default one, nothing moving
- `MOVING`: applying transitions for translates across X and Y for the moving cells
- `OVERLAYING`: animating (opacity for) an overlay consisting of the next grid state
