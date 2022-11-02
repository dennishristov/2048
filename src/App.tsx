import { Alert, Button, Drawer, Space } from "antd";
import { useState } from "react";
import { MAX_GRID_SIZE, MIN_GRID_SIZE } from "./sizeConstraints";
import { Game } from "./Game";
import LabeledNumberInput from "./LabeledNumberInput";

export function App(): JSX.Element {
  const [rows, setRows] = useState(6);
  const [columns, setColumns] = useState(6);
  const [obstacles, setObstacles] = useState(2);
  const [openedConfigDrawer, setOpenedConfigDrawer] = useState(false);

  return (
    <div className="app">
      <Button
        className="config-params-button"
        onClick={() => setOpenedConfigDrawer(true)}
      >
        Configure Parameters
      </Button>
      <Drawer
        title="Configure Parameters"
        placement="right"
        onClose={() => setOpenedConfigDrawer(false)}
        open={openedConfigDrawer}
        width={256}
      >
        <Space direction="vertical" className="game-params-drawer">
          <Alert
            message="Adjusting the parameters will reset the game state."
            type="warning"
          />
          <LabeledNumberInput
            label="Rows"
            min={MIN_GRID_SIZE}
            max={MAX_GRID_SIZE}
            value={rows}
            onChange={(x) => x && setRows(x)}
          />
          <LabeledNumberInput
            label="Columns"
            min={MIN_GRID_SIZE}
            max={MAX_GRID_SIZE}
            value={columns}
            onChange={(x) => x && setColumns(x)}
          />
          <LabeledNumberInput
            label="Obstacles"
            min={0}
            max={7}
            value={obstacles}
            onChange={(x) => x && setObstacles(x)}
          />
        </Space>
      </Drawer>
      <Game
        key={[rows, columns, obstacles].join(";")}
        rows={rows}
        columns={columns}
        obstacles={obstacles}
      />
    </div>
  );
}
