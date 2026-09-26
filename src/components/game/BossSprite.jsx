// 16×16 pixel interviewer for the chapter boss. Drawn like PixelPet: merged horizontal runs.
const ROWS = [
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '..hhhhhhhhhhhh..',
  '..hssssssssssh..',
  '..ssssssssssss..',
  '..sggggssggggs..',
  '..sgllgssgllgs..',
  '..sggggssggggs..',
  '..ssssssssssss..',
  '..sssssmmsssss..',
  '...ssssssssss...',
  '....ssssssss....',
  '...bbbbttbbbb...',
  '..bbbbbttbbbbb..',
  '.bbbbbbttbbbbbb.',
  '.bbbbbbttbbbbbb.',
];

const PALETTE = { h: '#2b2b33', s: '#f2c9a0', g: '#22313a', l: '#cfe8ff', m: '#8a4b3a', b: '#4a6fa5', t: '#e5294f' };

const RECTS = ROWS.flatMap((line, y) => {
  const rects = [];
  let x = 0;
  while (x < line.length) {
    const ch = line[x];
    let end = x + 1;
    while (end < line.length && line[end] === ch) end += 1;
    if (ch !== '.') rects.push({ x, y, width: end - x, fill: PALETTE[ch] });
    x = end;
  }
  return rects;
});

export default function BossSprite({ size = 96, className = '' }) {
  return (
    <svg className={`boss-sprite ${className}`} width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {RECTS.map((r) => <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.width} height="1" fill={r.fill} />)}
    </svg>
  );
}
