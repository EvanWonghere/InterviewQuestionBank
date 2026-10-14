// Topic placement describes preparation priority, never proof of an actual exam question.
const ids = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => `gbits-${String(start + i).padStart(3, '0')}`);
export const GBITS_TOPIC = {
  id: 'gbits', title: '吉比特游戏研发工程师 · 笔试专项',
  sections: [
    { id: 'cpp', title: '01 · C++ 基本盘', minutes: 30, description: '8 道选项辨析；机制口述题放在可选补充。', ids: ids(1, 8), supplementTitle: 'C++ 机制口述', supplementIds: ['q-039', 'q-040', 'q-041', 'q-042', 'q-043', 'q-045', 'q-046', 'q-047', 'q-068', 'q-142', 'q-143'] },
    { id: 'structures', title: '02 · 数据结构与读程序', minutes: 35, description: '5 道选择 + 4 道填空，练堆、排序、哈希和代码阅读。', ids: [...ids(9, 13), ...ids(21, 24)], supplementTitle: '数据结构机制口述', supplementIds: ['q-064', 'q-065', 'q-105', 'q-106', 'q-109', 'q-113'] },
    { id: 'systems', title: '03 · 系统、网络、数据库', minutes: 25, description: '6 道基础辨析，练线程、虚拟内存、TCP 与索引。', ids: ids(14, 19), supplementTitle: '系统与事务补充', supplementIds: ['gbits-039', 'q-051', 'q-053', 'q-054', 'q-055', 'q-075', 'q-117', 'q-163'] },
    { id: 'algorithms', title: '04 · 编程训练', minutes: 90, description: '14 道算法，含简单、中等和困难；90 分钟选两题，不要求一轮做完。', ids: ids(25, 38), supplementTitle: '算法机制补充', supplementIds: ['q-093', 'q-111', 'q-112', 'q-114'] },
    { id: 'client', title: '05 · 游戏物理基础', minutes: 5, description: '1 道冲量计算变式；工程设计题放在可选补充。', ids: ['gbits-020'], supplementTitle: '客户端面试与工程补充', supplementIds: [...ids(40, 42), 'q-023', 'q-031', 'q-083', 'q-095', 'q-097', 'q-149', 'q-154', 'q-177'] },
  ],
  startIds: ['gbits-001', 'gbits-009', 'gbits-017', 'gbits-021', 'gbits-025', 'gbits-026'],
  paperIds: [...ids(1, 24), 'gbits-025', 'gbits-026'],
  challengeIds: [...ids(1, 24), 'gbits-031', 'gbits-035'],
};

export const GBITS_PAPERS = [
  { set: 'paper', title: '基础自测卷', description: '20 选择 + 4 填空 + 2 道简单编程：括号匹配、最小子数组和。用于基础与速度检查，不代表吉比特实际难度。', ids: GBITS_TOPIC.paperIds },
  { set: 'challenge', title: '进阶自测卷', description: '20 选择 + 4 填空 + 2 道中/难编程：走格子 DP、多模式匹配。用于接触较难算法方向，题面与组合为训练编排，不是某场原卷复现。', ids: GBITS_TOPIC.challengeIds },
];

export function topicIds({ section = '', set = '', scope = 'core' } = {}) {
  if (set === 'start') return GBITS_TOPIC.startIds;
  const paper = GBITS_PAPERS.find((entry) => entry.set === set);
  if (paper) return paper.ids;
  if (set || !['core', 'supplement', 'all'].includes(scope)) return [];
  const sections = section ? GBITS_TOPIC.sections.filter((entry) => entry.id === section) : GBITS_TOPIC.sections;
  return sections.flatMap((entry) => scope === 'supplement' ? entry.supplementIds : scope === 'all' ? [...entry.ids, ...entry.supplementIds] : entry.ids);
}

export function isGbitsSupplement(question) {
  return topicIds({ scope: 'supplement' }).includes(question?.legacyId || question?.id);
}

export function selectTopicQuestions(questions, selection = {}) {
  const byId = new Map(questions.map((question) => [question.legacyId || question.id, question]));
  return topicIds(selection).map((id) => byId.get(id)).filter(Boolean);
}
