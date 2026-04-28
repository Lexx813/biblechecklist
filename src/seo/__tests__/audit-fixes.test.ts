import { describe, it, expect } from 'vitest';
import { MESSIANIC_PROPHECIES } from '../../data/messianicProphecies';
import { STUDY_TOPICS } from '../../data/studyTopics';
import { LOCALES } from '../locales';

/**
 * Regression tests for the 2026-04-28 SEO audit fixes. These guard the
 * specific schema/structure changes that ship traffic-critical signals.
 */

describe('audit-fixes: locales narrowed to shipped languages', () => {
  it('LOCALES is exactly en + es until other content ships', () => {
    expect([...LOCALES]).toEqual(['en', 'es']);
  });
});

describe('audit-fixes: messianic-prophecies data integrity', () => {
  it('every prophecy has a non-empty summary, prophecy ref, and at least one fulfillment', () => {
    expect(MESSIANIC_PROPHECIES.length).toBeGreaterThan(0);
    for (const p of MESSIANIC_PROPHECIES) {
      expect(p.id, `prophecy ${p.id} has empty id`).toBeTruthy();
      expect(p.summary.trim().length, `prophecy ${p.id} has empty summary`).toBeGreaterThan(0);
      expect(p.prophecy.ref, `prophecy ${p.id} missing prophecy ref`).toBeTruthy();
      expect(p.fulfillments.length, `prophecy ${p.id} has zero fulfillments`).toBeGreaterThan(0);
    }
  });

  it('builds a valid ItemList payload for the schema script', () => {
    // Mirrors the construction in app/messianic-prophecies/page.tsx.
    const URL = 'https://jwstudy.org/messianic-prophecies';
    const itemList = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      numberOfItems: MESSIANIC_PROPHECIES.length,
      itemListElement: MESSIANIC_PROPHECIES.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'CreativeWork',
          '@id': `${URL}#${p.id}`,
          name: p.summary,
          citation: [p.prophecy.ref, ...p.fulfillments.map(f => f.ref)].join('; '),
        },
      })),
    };
    expect(itemList.numberOfItems).toBe(MESSIANIC_PROPHECIES.length);
    expect(itemList.itemListElement[0].position).toBe(1);
    expect(itemList.itemListElement[0].item['@id']).toMatch(/^https:\/\/jwstudy\.org\/messianic-prophecies#/);
    // Each item must include both the prophecy and its fulfillment refs.
    for (const item of itemList.itemListElement) {
      expect(item.item.citation).toContain(';');
    }
  });
});

describe('audit-fixes: study-topics FAQPage filter', () => {
  // The filter rule shipped at app/study-topics/[slug]/page.tsx: only sections
  // whose heading ends in "?" are included in FAQPage schema.
  function filterFaqSections(sections: Array<{ heading: string; paragraphs: string[] }>) {
    return sections.filter(s => s.heading.trim().endsWith('?'));
  }

  it('keeps headings ending in question mark', () => {
    const sections = [
      { heading: 'What does the Bible say?', paragraphs: ['ans'] },
      { heading: 'Scriptural evidence', paragraphs: ['ans'] },
      { heading: 'Is Jesus God?', paragraphs: ['ans'] },
    ];
    const out = filterFaqSections(sections);
    expect(out.map(s => s.heading)).toEqual([
      'What does the Bible say?',
      'Is Jesus God?',
    ]);
  });

  it('returns empty when no section is a question — schema must be skipped', () => {
    const sections = [
      { heading: 'Background', paragraphs: ['x'] },
      { heading: 'Conclusion', paragraphs: ['y'] },
    ];
    expect(filterFaqSections(sections)).toEqual([]);
  });

  it('tolerates trailing whitespace on the question mark', () => {
    const sections = [
      { heading: 'Why?  ', paragraphs: ['x'] },
    ];
    expect(filterFaqSections(sections)).toHaveLength(1);
  });

  // Sanity: at least one real study topic has a question-formatted section so
  // the FAQPage schema actually fires somewhere on the site.
  it('at least one shipped study topic has a question-formatted section', () => {
    const totalQuestionSections = STUDY_TOPICS.reduce(
      (n, t) => n + t.sections.filter(s => s.heading.trim().endsWith('?')).length,
      0,
    );
    expect(totalQuestionSections).toBeGreaterThan(0);
  });
});
