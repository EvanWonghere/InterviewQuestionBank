const ids = (start, end) => Array.from({ length: end - start + 1 }, (_, i) => `gbits-${String(start + i).padStart(3, '0')}`);
export const MOCK_TYPES = ['single_choice', 'fill_blank', 'algorithm'];
export const MOCK_LABELS = { single_choice: '单选', fill_blank: '填空', algorithm: '编程' };
export const GBITS_MOCK_PAPERS = [
  { id: 'gbits-a', revision: 1, title: '冲刺 A 卷', priority: '第一天优先', description: '参考 2023 综合卷结构；20 单选 / 4 填空 / 2 编程。全部题目为原创训练。', groups: { single_choice: ids(43, 62), fill_blank: ids(63, 66), algorithm: ids(67, 68) } },
  { id: 'gbits-b', revision: 1, title: '冲刺 B 卷', priority: '第二天优先', description: '参考 2024 客户端亲历结构；16 单选 / 2 填空 / 3 编程。全部题目为原创训练。', groups: { single_choice: ids(69, 84), fill_blank: ids(85, 86), algorithm: ids(87, 89) } },
  { id: 'gbits-c', revision: 1, title: '冲刺 C 卷', priority: '复盘后加练', description: '综合 2018 与 2025 考点，训练裁剪为 24 单选 / 4 填空 / 3 编程；不代表某年原卷题量。', groups: { single_choice: ids(90, 113), fill_blank: ids(114, 117), algorithm: ids(118, 120) } },
];
export const mockQuestionIds = (paper) => MOCK_TYPES.flatMap((type) => paper.groups[type]);
export const getMockPaper = (id) => GBITS_MOCK_PAPERS.find((paper) => paper.id === id);
export function selectMockQuestions(questions, paper) {
  const byId = new Map(questions.map((q) => [q.legacyId || q.id, q]));
  return mockQuestionIds(paper).map((id) => byId.get(id)).filter(Boolean);
}
