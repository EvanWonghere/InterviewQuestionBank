// Stable IDs work with both the bundled bank and Supabase UUID rows.
const ids = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => `gbits-${String(start + i).padStart(3, '0')}`);
export const GBITS_TOPIC = {
  id: 'gbits', title: '吉比特游戏研发工程师 · 笔试专项',
  sections: [
    { id: 'cpp', title: '01 · C++ 基本盘', minutes: 40, description: '先练选项辨析，再用旧题补对象、内存、STL。', ids: [...ids(1, 8), 'q-039', 'q-040', 'q-041', 'q-042', 'q-043', 'q-045', 'q-046', 'q-047', 'q-068', 'q-142', 'q-143'] },
    { id: 'structures', title: '02 · 数据结构与读程序', minutes: 35, description: '堆、排序、哈希、位运算、参数传递。', ids: [...ids(9, 13), ...ids(21, 24), 'q-064', 'q-065', 'q-105', 'q-106', 'q-109', 'q-113'] },
    { id: 'systems', title: '03 · 系统、网络、数据库', minutes: 35, description: '线程、缺页、TCP 与联合索引的适用条件。', ids: [...ids(14, 19), 'gbits-039', 'q-051', 'q-053', 'q-054', 'q-055', 'q-075', 'q-117', 'q-163'] },
    { id: 'algorithms', title: '04 · 编程母题', minutes: 90, description: '先栈/前缀和/简单 DP，再做背包、桶与多模式匹配。', ids: [...ids(25, 38), 'q-093', 'q-111', 'q-112', 'q-114'] },
    { id: 'client', title: '05 · 客户端方向', minutes: 40, description: '冲量读数、渲染与 UI 排查、加载生命周期、定时器。', ids: ['gbits-020', ...ids(40, 42), 'q-023', 'q-031', 'q-083', 'q-095', 'q-097', 'q-149', 'q-154', 'q-177'] },
  ],
  startIds: ['gbits-001', 'gbits-009', 'gbits-017', 'gbits-021', 'gbits-025', 'gbits-026'],
  paperIds: [...ids(1, 24), 'gbits-025', 'gbits-026'],
};

export function topicIds({ section = '', set = '' } = {}) {
  if (set === 'start') return GBITS_TOPIC.startIds;
  if (set === 'paper') return GBITS_TOPIC.paperIds;
  if (set) return [];
  if (section) return GBITS_TOPIC.sections.find((entry) => entry.id === section)?.ids ?? [];
  return GBITS_TOPIC.sections.flatMap((entry) => entry.ids);
}

export function selectTopicQuestions(questions, selection = {}) {
  const byId = new Map(questions.map((question) => [question.legacyId || question.id, question]));
  return topicIds(selection).map((id) => byId.get(id)).filter(Boolean);
}
