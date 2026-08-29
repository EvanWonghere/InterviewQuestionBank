import { describe, expect, it } from 'vitest';
import { legacyStatusToReview, mergeLegacyData } from './legacyMigration';

describe('legacy migration', () => {
  it('lets Gist data win over stale local values', () => {
    expect(mergeLegacyData({ q1: 'wrong' }, { q1: 'local' }, { progress: { q1: 'mastered' }, notes: { q1: 'cloud' } })).toEqual({ progress: { q1: 'mastered' }, notes: { q1: 'cloud' } });
  });

  it('maps mastered to a 30 day interval', () => {
    expect(legacyStatusToReview('mastered', new Date('2026-08-29T00:00:00Z'))).toMatchObject({ intervalDays: 30, lastQuality: 4 });
  });
});
