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
      <Game
        key={[rows, columns, obstacles].join(";")}
        rows={rows}
        columns={columns}
        obstacles={obstacles}
      />
      <Button
        className="game-settings-button"
        onClick={() => setOpenedConfigDrawer(true)}
      >
        Game Settings
      </Button>
      <Drawer
        title="Game Settings"
        placement="right"
        onClose={() => setOpenedConfigDrawer(false)}
        open={openedConfigDrawer}
        width={24}
      >
        <Space direction="vertical" className="game-settings-drawer">
          <Alert
            message="Changing the settings will reset the game state."
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
    </div>
  );
}
