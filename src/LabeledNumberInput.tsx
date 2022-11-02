import { InputNumber, InputNumberProps } from "antd";

export default function LabeledNumberInput({
  label,
  ...props
}: { label: string } & InputNumberProps<number>): JSX.Element {
  return (
    <div className="input">
      {label}
      <InputNumber {...props} />
    </div>
  );
}
