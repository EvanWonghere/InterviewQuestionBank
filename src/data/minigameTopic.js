// Topic placement is a study recommendation, not evidence of any interview question.
export const MINIGAME_TOPIC = {
  id: 'minigame-client',
  title: '小游戏客户端 · 技术复习',
  sections: [
    { id: 'basics', title: '01 · 语言与客户端基础', description: '值与引用、生命周期、事件、对象池和碰撞。', ids: ['q-001', 'q-002', 'q-005', 'q-016', 'q-019', 'q-026', 'q-027', 'q-035', 'q-057', 'q-060'] },
    { id: 'rendering', title: '02 · 渲染、资源与排查', description: '合批、透明叠加、构建包体和卡顿定位。', ids: ['q-007', 'q-008', 'q-161', 'q-165'] },
    { id: 'laya', title: '03 · TypeScript、Laya 与异步', description: '类型校验、事件、定时器和过期加载结果。', ids: ['minigame-001', 'minigame-002', 'minigame-003', 'minigame-004'] },
    { id: 'practice', title: '04 · 渲染、平台与 AI 验证', description: '排序合批、文字、平台回调与验收证据。', ids: ['minigame-005', 'minigame-006', 'minigame-007', 'minigame-008'] },
  ],
};

export function minigameTopicIds({ section = '', set = '', scope = 'core' } = {}) {
  if (set || scope !== 'core') return [];
  const sections = section ? MINIGAME_TOPIC.sections.filter((entry) => entry.id === section) : MINIGAME_TOPIC.sections;
  return sections.flatMap((entry) => entry.ids);
}

export function isMinigameQuestion(question, selection = {}) {
  if (!question || question.visibility === 'private' || (question.status && question.status !== 'published')) return false;
  return minigameTopicIds(selection).includes(question.legacyId || question.id);
}

export function selectMinigameQuestions(questions, selection = {}) {
  const byId = new Map(questions.filter((q) => isMinigameQuestion(q, selection)).map((q) => [q.legacyId || q.id, q]));
  return minigameTopicIds(selection).map((id) => byId.get(id)).filter(Boolean);
}
