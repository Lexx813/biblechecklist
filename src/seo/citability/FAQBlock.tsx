import { FAQSchema, type FAQItem } from '../schema/FAQ';

export function FAQBlock({ items, className }: { items: FAQItem[]; className?: string }) {
  return (
    <section className={className} data-citability="faq">
      <h2>Frequently asked questions</h2>
      <dl>
        {items.map((q) => (
          <div key={q.question}>
            <dt>{q.question}</dt>
            <dd>{q.answer}</dd>
          </div>
        ))}
      </dl>
      <FAQSchema items={items} />
    </section>
  );
}
