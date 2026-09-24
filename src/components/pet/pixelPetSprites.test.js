import { describe, expect, it } from 'vitest';
import { PET_FRAMES, PET_PALETTE, PET_SEQUENCES, frameRects } from './pixelPetSprites';

describe('pixel pet sprites', () => {
  it('keeps every frame on a 16×16 grid with known palette keys', () => {
    for (const [name, rows] of Object.entries(PET_FRAMES)) {
      expect(rows, name).toHaveLength(16);
      for (const line of rows) {
        expect(line, name).toHaveLength(16);
        for (const ch of line) if (ch !== '.') expect(PET_PALETTE, `${name}:${ch}`).toHaveProperty(ch);
      }
    }
  });
  it('only sequences frames that exist', () => {
    for (const steps of Object.values(PET_SEQUENCES)) for (const [name] of steps) expect(PET_FRAMES).toHaveProperty(name);
  });
  it('merges runs into rects', () => {
    const rects = frameRects('open');
    expect(rects.length).toBeLessThan(80);
    expect(rects.reduce((n, r) => n + r.width, 0)).toBe(PET_FRAMES.open.join('').replaceAll('.', '').length);
  });
});
