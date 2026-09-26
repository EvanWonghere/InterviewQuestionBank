import { PET_FRAMES, PET_PALETTE } from './pixelPetSprites';

// Growth forms for the stage game. Rows 0–2 of every frame are the leaf, so a form swaps
// only those rows. Kept outside pixelPetSprites.js, which ConceptLab copies verbatim.
const LEAVES = {
  twin: ['...lgg....ggl...', '....lggggggl....', '.......gg.......'],
  bloom: ['......ffff......', '.....ffyyff.....', '......lggl......'],
  droop: ['................', '....gg....gg....', '.....ggggg......'],
};

const PALETTE = { ...PET_PALETTE, f: 'var(--pet-flower, #ff8fb1)', y: 'var(--pet-flower-center, #ffd24a)' };

/** Like frameRects, with the leaf rows of `form` (sprout keeps the frame's own leaf). */
export function formFrameRects(name, form = 'sprout') {
  const rows = LEAVES[form] ? [...LEAVES[form], ...PET_FRAMES[name].slice(3)] : PET_FRAMES[name];
  const rects = [];
  rows.forEach((line, y) => {
    let x = 0;
    while (x < line.length) {
      const ch = line[x];
      let end = x + 1;
      while (end < line.length && line[end] === ch) end += 1;
      if (ch !== '.') rects.push({ x, y, width: end - x, fill: PALETTE[ch] });
      x = end;
    }
  });
  return rects;
}

export const PET_FORMS = {
  sprout: { name: '小芽', hint: 'LV1–2' },
  twin: { name: '双叶', hint: 'LV3–4' },
  bloom: { name: '开花', hint: 'LV5 起' },
  droop: { name: '打蔫', hint: '到期题 ≥ 10' },
};
