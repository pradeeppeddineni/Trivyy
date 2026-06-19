import { describe, it, expect } from 'vitest';
import {
  decodeEntities,
  normalize,
  deduplicate,
  type NormalizedQuestion,
} from '../src/seed/normalize';
import { mapOpenTdbCategory, CURATED_CATEGORIES } from '../src/seed/categories';

describe('decodeEntities', () => {
  it('decodes named and numeric HTML entities', () => {
    expect(decodeEntities('Tom &amp; Jerry')).toBe('Tom & Jerry');
    expect(decodeEntities('&quot;Hi&quot;')).toBe('"Hi"');
    expect(decodeEntities('caf&eacute;')).toBe('café');
    expect(decodeEntities('5 o&#039;clock')).toBe("5 o'clock");
    expect(decodeEntities('&#233;')).toBe('é'); // numeric not in the map
  });

  it('leaves plain text untouched', () => {
    expect(decodeEntities('no entities here')).toBe('no entities here');
  });
});

describe('mapOpenTdbCategory', () => {
  it('maps OpenTDB categories to curated slugs', () => {
    expect(mapOpenTdbCategory('Geography')).toBe('geography');
    expect(mapOpenTdbCategory('History')).toBe('history');
    expect(mapOpenTdbCategory('Mythology')).toBe('history');
    expect(mapOpenTdbCategory('Politics')).toBe('history');
    expect(mapOpenTdbCategory('Entertainment: Music')).toBe('music');
    expect(mapOpenTdbCategory('Entertainment: Musicals & Theatres')).toBe('music');
    expect(mapOpenTdbCategory('Entertainment: Film')).toBe('movies');
    expect(mapOpenTdbCategory('Entertainment: Television')).toBe('movies');
    expect(mapOpenTdbCategory('Entertainment: Japanese Anime & Manga')).toBe('movies');
    expect(mapOpenTdbCategory('Science: Computers')).toBe('tech');
    expect(mapOpenTdbCategory('Science: Gadgets')).toBe('tech');
    expect(mapOpenTdbCategory('Entertainment: Video Games')).toBe('tech');
    expect(mapOpenTdbCategory('Vehicles')).toBe('tech');
    expect(mapOpenTdbCategory('Science & Nature')).toBe('science');
    expect(mapOpenTdbCategory('Science: Mathematics')).toBe('science');
    expect(mapOpenTdbCategory('Animals')).toBe('science');
  });

  it('returns null for unmapped categories (they appear under "Surprise me")', () => {
    expect(mapOpenTdbCategory('Sports')).toBeNull();
    expect(mapOpenTdbCategory('General Knowledge')).toBeNull();
    expect(mapOpenTdbCategory('Art')).toBeNull();
    expect(mapOpenTdbCategory('Entertainment: Books')).toBeNull();
  });

  it('only ever returns a known curated slug or null', () => {
    const slugs = new Set<string>(CURATED_CATEGORIES.map((c) => c.slug));
    for (const name of ['Geography', 'Sports', 'Science: Computers', 'Art']) {
      const result = mapOpenTdbCategory(name);
      expect(result === null || slugs.has(result)).toBe(true);
    }
  });
});

describe('normalize', () => {
  it('decodes text and attaches the mapped slug, source, and raw category', () => {
    const q = normalize({
      question: 'Who painted the &quot;Mona Lisa&quot;?',
      correct_answer: 'Leonardo da Vinci',
      incorrect_answers: ['Raphael', 'Michelangelo', 'Donatello'],
      category: 'Art',
      difficulty: 'easy',
    });
    expect(q.text).toBe('Who painted the "Mona Lisa"?');
    expect(q.categorySlug).toBeNull(); // Art is unmapped
    expect(q.category).toBe('Art');
    expect(q.source).toBe('opentdb');
    expect(q.incorrectAnswers).toHaveLength(3);
  });
});

describe('deduplicate', () => {
  it('drops case-insensitive duplicate question texts', () => {
    const base: Omit<NormalizedQuestion, 'text'> = {
      correctAnswer: 'a',
      incorrectAnswers: [],
      category: '',
      categorySlug: null,
      difficulty: 'easy',
      source: 'opentdb',
    };
    const out = deduplicate([
      { ...base, text: 'Same question?' },
      { ...base, text: 'same QUESTION?' },
      { ...base, text: 'Different?' },
    ]);
    expect(out).toHaveLength(2);
    expect(out.map((q) => q.text)).toEqual(['Same question?', 'Different?']);
  });
});
