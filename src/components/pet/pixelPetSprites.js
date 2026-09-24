// 16×16 pixel sprites for the study pet ("小芽"). Each frame is 16 rows of 16
// characters; '.' is transparent and every other character maps to a palette
// token. ConceptLab keeps a copy of this file — keep them in sync.

export const PET_PALETTE = {
  o: 'var(--pet-outline)',
  b: 'var(--pet-body)',
  h: 'var(--pet-highlight)',
  s: 'var(--pet-shade)',
  e: 'var(--pet-eye)',
  w: 'var(--pet-shine)',
  p: 'var(--pet-blush)',
  m: 'var(--pet-eye)',
  g: 'var(--pet-leaf)',
  l: 'var(--pet-leaf-light)',
  d: 'var(--pet-drop)',
};

const LEAF_UP = ['.....gl..lg.....', '......gggg......', '.......gg.......'];
const LEAF_DROOP = ['................', '....gg....gg....', '.....ggggg......'];
const LEAF_SWAY = ['......gl..lg....', '......gggg......', '.......gg.......'];

// Rows 3–15: the body. Face rows (8–12) are replaced per expression.
const BODY_TOP = [
  '....oooooooo....',
  '...ohhbbbbbbo...',
  '..ohbbbbbbbbbo..',
  '.ohhbbbbbbbbbbo.',
  '.obbbbbbbbbbbbo.',
];
const BODY_BOTTOM = [
  '..osbbbbbbbsso..',
  '...oooooooooo...',
  '....oo....oo....',
];

const row = (inner) => `.o${inner}o.`;

const FACES = {
  open: ['bbwebbbbwebb', 'bbeebbbbeebb', 'bppbbbbbbppb', 'bbbbbmmbbbbb', 'bbbbbbbbbbbs'],
  blink: ['bbbbbbbbbbbb', 'bbeebbbbeebb', 'bppbbbbbbppb', 'bbbbbmmbbbbb', 'bbbbbbbbbbbs'],
  lookUp: ['bbbwebbbbweb', 'bbbeebbbbeeb', 'bppbbbbbbppb', 'bbbbbbmbbbbb', 'bbbbbbbbbbbs'],
  lookSide: ['bwebbbbwebbb', 'beebbbbeebbb', 'bppbbbbbbppb', 'bbbbbbmbbbbb', 'bbbbbbbbbbbs'],
  talk: ['bbwebbbbwebb', 'bbeebbbbeebb', 'bppbbbbbbppb', 'bbbbbmmbbbbb', 'bbbbbmmbbbbs'],
  happy: ['bbeebbbbeebb', 'bebbebbebbeb', 'bppbbbbbbppb', 'bbbbmbbmbbbb', 'bbbbbmmbbbbs'],
  sad: ['bbbebbbbebbb', 'bbeebbbbeebb', 'bppbbbbbbppb', 'bbbbbmmbbbbb', 'bbbbmbbmbbbs'],
  sleep: ['bbbbbbbbbbbb', 'bbeebbbbeebb', 'bppbbbbbbppb', 'bbbbbbbbbbbb', 'bbbbbbbbbbbs'],
};

function frame(leaf, face, { drop = false } = {}) {
  const faceRows = face.map((inner) => row(inner));
  if (drop) faceRows[0] = `${faceRows[0].slice(0, 15)}d`;
  return [...leaf, ...BODY_TOP, ...faceRows, ...BODY_BOTTOM];
}

export const PET_FRAMES = {
  open: frame(LEAF_UP, FACES.open),
  blink: frame(LEAF_UP, FACES.blink),
  sway: frame(LEAF_SWAY, FACES.open),
  lookUp: frame(LEAF_UP, FACES.lookUp),
  lookSide: frame(LEAF_SWAY, FACES.lookSide),
  talk: frame(LEAF_UP, FACES.talk),
  happy: frame(LEAF_UP, FACES.happy),
  sad: frame(LEAF_DROOP, FACES.sad, { drop: true }),
  sleep: frame(LEAF_DROOP, FACES.sleep),
};

// [frame, milliseconds] loops per mood.
export const PET_SEQUENCES = {
  idle: [['open', 2400], ['blink', 140], ['open', 1800], ['sway', 500], ['open', 900], ['blink', 140]],
  thinking: [['lookUp', 700], ['lookSide', 700]],
  talking: [['talk', 170], ['open', 170]],
  happy: [['happy', 1000]],
  sad: [['sad', 1000]],
  sleep: [['sleep', 1000]],
};

// Merge horizontal runs of the same colour so a frame is ~40 rects, not 256.
export function frameRects(name) {
  const rects = [];
  PET_FRAMES[name].forEach((line, y) => {
    let x = 0;
    while (x < line.length) {
      const ch = line[x];
      let end = x + 1;
      while (end < line.length && line[end] === ch) end += 1;
      if (ch !== '.') rects.push({ x, y, width: end - x, fill: PET_PALETTE[ch] });
      x = end;
    }
  });
  return rects;
}
