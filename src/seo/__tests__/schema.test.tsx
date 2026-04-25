import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrganizationSchema } from '../schema/Organization';
import { WebSiteSchema } from '../schema/WebSite';
import { WebApplicationSchema } from '../schema/WebApplication';
import { ArticleSchema } from '../schema/Article';
import { BreadcrumbSchema } from '../schema/Breadcrumb';
import { FAQSchema } from '../schema/FAQ';
import { HowToSchema } from '../schema/HowTo';
import { ItemListSchema } from '../schema/ItemList';
import { BookSchema } from '../schema/Book';
import { ProfilePageSchema } from '../schema/ProfilePage';
import { DiscussionForumPostingSchema } from '../schema/DiscussionForumPosting';

function extractJson(html: string): Record<string, unknown> {
  const match = html.match(/>([\s\S]*?)<\/script>/);
  return JSON.parse(match?.[1] ?? '{}');
}

describe('OrganizationSchema', () => {
  it('emits a single ld+json script with @type Organization', () => {
    const html = renderToStaticMarkup(<OrganizationSchema />);
    expect(html).toContain('application/ld+json');
    const json = extractJson(html);
    expect(json['@type']).toBe('Organization');
    expect(json['@context']).toBe('https://schema.org');
    expect(json.name).toBe('JW Study');
    expect(json.url).toBe('https://jwstudy.org');
  });
});

describe('WebSiteSchema', () => {
  it('includes a SearchAction potentialAction', () => {
    const html = renderToStaticMarkup(<WebSiteSchema />);
    const json = extractJson(html);
    expect(json['@type']).toBe('WebSite');
    const action = json.potentialAction as { '@type': string };
    expect(action['@type']).toBe('SearchAction');
  });
});

describe('WebApplicationSchema', () => {
  it('emits free Offer', () => {
    const html = renderToStaticMarkup(<WebApplicationSchema />);
    const json = extractJson(html);
    expect(json['@type']).toBe('WebApplication');
    const offers = json.offers as Array<{ price: string }>;
    const offer = Array.isArray(offers) ? offers[0] : offers;
    expect(offer.price).toBe('0');
  });
});

describe('ArticleSchema', () => {
  it('emits headline + author + dates', () => {
    const html = renderToStaticMarkup(
      <ArticleSchema
        headline="Test"
        url="https://jwstudy.org/blog/test"
        datePublished="2026-04-01"
        dateModified="2026-04-15"
        author="Alexi"
        image="https://jwstudy.org/blog/test.jpg"
      />,
    );
    const json = extractJson(html);
    expect(json['@type']).toBe('Article');
    expect(json.headline).toBe('Test');
    const author = json.author as { name: string };
    expect(author.name).toBe('Alexi');
  });
});

describe('BreadcrumbSchema', () => {
  it('emits an ItemList with positioned items', () => {
    const html = renderToStaticMarkup(
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://jwstudy.org/' },
        { name: 'Blog', url: 'https://jwstudy.org/blog' },
      ]} />,
    );
    const json = extractJson(html);
    expect(json['@type']).toBe('BreadcrumbList');
    const items = json.itemListElement as Array<{ position: number }>;
    expect(items).toHaveLength(2);
    expect(items[0].position).toBe(1);
  });
});

describe('FAQSchema', () => {
  it('emits a FAQPage with each Q&A as a Question', () => {
    const html = renderToStaticMarkup(
      <FAQSchema items={[
        { question: 'Is it free?', answer: 'Yes.' },
        { question: 'Do I need an account?', answer: 'Not to read.' },
      ]} />,
    );
    const json = extractJson(html);
    expect(json['@type']).toBe('FAQPage');
    const main = json.mainEntity as Array<{ '@type': string }>;
    expect(main).toHaveLength(2);
    expect(main[0]['@type']).toBe('Question');
  });
});

describe('HowToSchema', () => {
  it('emits HowTo with steps', () => {
    const html = renderToStaticMarkup(
      <HowToSchema name="Read in 1 year" steps={[
        { name: 'Day 1', text: 'Genesis 1' },
        { name: 'Day 2', text: 'Genesis 2' },
      ]} />,
    );
    const json = extractJson(html);
    expect(json['@type']).toBe('HowTo');
    const step = json.step as Array<unknown>;
    expect(step).toHaveLength(2);
  });
});

describe('ItemListSchema', () => {
  it('emits ItemList with positioned items', () => {
    const html = renderToStaticMarkup(
      <ItemListSchema items={[
        { name: 'Genesis', url: 'https://jwstudy.org/books/genesis' },
        { name: 'Exodus', url: 'https://jwstudy.org/books/exodus' },
      ]} />,
    );
    const json = extractJson(html);
    expect(json['@type']).toBe('ItemList');
    const items = json.itemListElement as Array<{ position: number }>;
    expect(items[0].position).toBe(1);
  });
});

describe('BookSchema', () => {
  it('emits a Book', () => {
    const html = renderToStaticMarkup(
      <BookSchema name="Genesis" url="https://jwstudy.org/books/genesis" numberOfPages={50} />,
    );
    const json = extractJson(html);
    expect(json['@type']).toBe('Book');
    expect(json.name).toBe('Genesis');
  });
});

describe('ProfilePageSchema', () => {
  it('emits ProfilePage with mainEntity Person', () => {
    const html = renderToStaticMarkup(
      <ProfilePageSchema name="Alexi" url="https://jwstudy.org/share/abc" />,
    );
    const json = extractJson(html);
    expect(json['@type']).toBe('ProfilePage');
    const main = json.mainEntity as { '@type': string };
    expect(main['@type']).toBe('Person');
  });
});

describe('DiscussionForumPostingSchema', () => {
  it('emits DiscussionForumPosting', () => {
    const html = renderToStaticMarkup(
      <DiscussionForumPostingSchema
        headline="What's a good reading plan?"
        url="https://jwstudy.org/forum/cat/thread"
        datePublished="2026-04-01"
        author="Alexi"
        text="Asking for the community."
      />,
    );
    const json = extractJson(html);
    expect(json['@type']).toBe('DiscussionForumPosting');
  });
});
