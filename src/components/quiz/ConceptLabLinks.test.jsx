import { describe, expect, it } from 'vitest';
import { getConceptLabLinks } from './ConceptLabLinks';

describe('ConceptLabLinks mapping', () => {
  it('resolves generated links by legacy ID and removes duplicate lab entries', () => {
    const links = getConceptLabLinks({ id: 'uuid', legacyId: 'q-040' });
    expect(links.map((link) => link.id)).toEqual(['cpp-dispatch', 'cpp-lifetime', 'cpp-adjust', 'cpp-virtual-base']);
    expect(links.every((link) => !('answer' in link))).toBe(true);
  });

  it('also resolves static questions whose id is the legacy ID', () => {
    expect(getConceptLabLinks({ id: 'q-018' }).map((link) => link.id)).toEqual(['gc-alloc']);
  });
});
