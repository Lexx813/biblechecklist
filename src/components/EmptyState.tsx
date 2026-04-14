import React from "react";
import Button from "./ui/Button";

interface Props {
  icon?: React.ReactNode;
  title?: string;
  sub?: string;
  btnLabel?: string;
  onBtn?: () => void;
}

export default function EmptyState({ icon, title, sub, btnLabel, onBtn }: Props) {
  return (
    <div className="home-empty">
      <div className="home-empty-icon">{icon}</div>
      <p className="home-empty-title">{title}</p>
      <p className="home-empty-sub">{sub}</p>
      {btnLabel && <Button variant="primary" size="md" onClick={onBtn}>{btnLabel}</Button>}
    </div>
  );
}
