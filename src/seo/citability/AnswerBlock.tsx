export interface AnswerBlockProps {
  question: string;
  answer: string;
  className?: string;
}

export function AnswerBlock({ question, answer, className }: AnswerBlockProps) {
  return (
    <section className={className} data-citability="answer">
      <h2>{question}</h2>
      <p>{answer}</p>
    </section>
  );
}
