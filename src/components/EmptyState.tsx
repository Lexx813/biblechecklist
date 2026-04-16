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
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <p className="empty-state-title">{title}</p>}
      {sub && <p className="empty-state-sub">{sub}</p>}
      {btnLabel && <Button variant="primary" size="md" onClick={onBtn}>{btnLabel}</Button>}
    </div>
  );
}
