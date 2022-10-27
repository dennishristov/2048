import React from "react";

export default function Input({
  label,
  ...props
}: { label: string } & React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>): JSX.Element {
  return (
    <div className="input">
      {label}
      <input {...props} />
    </div>
  );
}
