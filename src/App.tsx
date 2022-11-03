import { Alert, Button, Drawer, Form, InputNumber, Space } from "antd";
import { useState } from "react";

import { Game } from "./Game";
import { MAX_GRID_SIZE, MIN_GRID_SIZE } from "./sizeConstraints";

export function App(): JSX.Element {
  const [openedConfigDrawer, setOpenedConfigDrawer] = useState(false);
  const [gameParams, setGameParams] = useState({
    rows: 6,
    columns: 6,
    obstacles: 2,
  });
  const { rows, columns, obstacles } = gameParams;

  return (
    <div className="app">
      <Game key={[rows, columns, obstacles].join(";")} {...gameParams} />
      <Button
        className="game-settings-button"
        onClick={() => setOpenedConfigDrawer(true)}
      >
        Settings
      </Button>
      <Drawer
        title="Settings"
        placement="right"
        onClose={() => setOpenedConfigDrawer(false)}
        open={openedConfigDrawer}
        width={256}
        destroyOnClose={true}
      >
        <Space direction="vertical" size={16}>
          <Alert
            message="Changing the settings will reset the game state."
            type="warning"
          />
          <Form
            layout="vertical"
            className="game-settings"
            initialValues={gameParams}
            onFinish={(x) => {
              setGameParams(x);
              setOpenedConfigDrawer(false);
            }}
          >
            <Form.Item label="Rows" name="rows" rules={[{ required: true }]}>
              <InputNumber min={MIN_GRID_SIZE} max={MAX_GRID_SIZE} />
            </Form.Item>
            <Form.Item
              label="Columns"
              name="columns"
              rules={[{ required: true }]}
            >
              <InputNumber min={MIN_GRID_SIZE} max={MAX_GRID_SIZE} />
            </Form.Item>
            <Form.Item
              label="Obstacles"
              name="obstacles"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} max={4} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Drawer>
    </div>
  );
}
