import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnswerBlock } from '../citability/AnswerBlock';
import { FAQBlock } from '../citability/FAQBlock';
import { KeyFacts } from '../citability/KeyFacts';

describe('AnswerBlock', () => {
  it('renders an h2 question and a p answer', () => {
    const html = renderToStaticMarkup(<AnswerBlock question="What is JW Study?" answer="A free Bible reading tracker." />);
    expect(html).toContain('<h2');
    expect(html).toContain('What is JW Study?');
    expect(html).toContain('<p');
    expect(html).toContain('A free Bible reading tracker.');
  });
});

describe('FAQBlock', () => {
  it('renders a heading per Q and emits FAQ schema', () => {
    const html = renderToStaticMarkup(
      <FAQBlock items={[
        { question: 'Is it free?', answer: 'Yes.' },
        { question: 'Account needed?', answer: 'Not to read.' },
      ]} />,
    );
    expect(html).toContain('Is it free?');
    expect(html).toContain('Account needed?');
    expect(html).toContain('FAQPage');
  });
});

describe('KeyFacts', () => {
  it('renders a dl with dt/dd pairs', () => {
    const html = renderToStaticMarkup(
      <KeyFacts items={[
        { label: 'Price', value: 'Free' },
        { label: 'Languages', value: '6' },
      ]} />,
    );
    expect(html).toContain('<dl');
    expect(html).toContain('<dt');
    expect(html).toContain('Price');
    expect(html).toContain('Free');
  });
});
