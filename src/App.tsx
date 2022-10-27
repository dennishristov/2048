import { useState } from "react";
import { Game } from "./Game";
import Input from "./Input";

export function App(): JSX.Element {
  const [rows, setRows] = useState(6);
  const [columns, setColumns] = useState(6);
  const [obstacles, setObstacles] = useState(2);

  return (
    <div className="game">
      <div className="game-params">
        <Input
          label="Rows"
          type="number"
          min={4}
          max={10}
          value={rows}
          onChange={(x) => setRows(x.target.valueAsNumber)}
        />
        <Input
          label="Columns"
          type="number"
          min={4}
          max={10}
          value={columns}
          onChange={(x) => setColumns(x.target.valueAsNumber)}
        />
        <Input
          label="Obstacles"
          type="number"
          min={0}
          max={10}
          value={obstacles}
          onChange={(x) => setObstacles(x.target.valueAsNumber)}
        />
      </div>
      <Game
        key={[rows, columns, obstacles].join(";")}
        rows={rows}
        columns={columns}
        obstacles={obstacles}
      />
    </div>
  );
}
