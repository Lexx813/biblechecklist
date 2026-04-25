export interface KeyFactItem {
  label: string;
  value: string;
}

export function KeyFacts({ items, className }: { items: KeyFactItem[]; className?: string }) {
  return (
    <dl className={className} data-citability="key-facts">
      {items.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
