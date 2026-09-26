// What 小芽 says and does for each game event. Hand-written; no model call.
// `motion`: hop | cheer | shake | spin (skipped in quiet mode and with reduced motion).
export const REACTIONS = {
  combo3: () => ({ text: '三连！', mood: 'happy', motion: 'hop' }),
  combo5: ({ card } = {}) => ({ text: card ? '停不下来了！+1 提示卡' : '停不下来了！', mood: 'happy', motion: 'cheer' }),
  miss: ({ canRevive } = {}) => ({ text: canRevive ? '没事。回答 AI 的追问还能复活。' : '没事，这题之后复习见。', mood: 'sad', motion: 'shake', ms: 3500 }),
  revive: () => ({ text: '复活了！', mood: 'happy', motion: 'spin' }),
  lit: () => ({ text: '记住了，第 3 颗星。', mood: 'happy', motion: 'hop' }),
  fail: () => ({ text: '休息一下再来，已答的都记下了。', mood: 'sad', motion: null, ms: 3500 }),
  promote: ({ grew } = {}) => ({ text: grew ? '升职了！我长出了新叶子。' : '升职了！', mood: 'happy', motion: 'spin', ms: 3500 }),
  crit: () => ({ text: '追问打得好！', mood: 'happy', motion: 'hop' }),
  ko: () => ({ text: '拿到 Offer 了！', mood: 'happy', motion: 'spin', ms: 3500 }),
};

export const REACTION_MS = 2500;
export const TIP_MS = 8000;
