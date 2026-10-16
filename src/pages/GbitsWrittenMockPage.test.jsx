import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GbitsWrittenMockPage from './GbitsWrittenMockPage';
import { GBITS_MOCK_PAPERS, MOCK_TYPES } from '../data/gbitsMockPapers';
import { MOCK_STORAGE_KEY } from '../lib/gbitsMock';
const state = vi.hoisted(() => ({ questions: [] }));
const grade = vi.hoisted(() => vi.fn());
vi.mock('@/context/QuestionsContext', () => ({ useQuestions: () => ({ questions: state.questions, loading: false, error: null }) }));
vi.mock('@/data/questionRepository', () => ({ gradeCloudQuestion: grade }));
vi.mock('@/components/common/Markdown', () => ({ default: ({ content }) => <p>{content}</p> }));
const paper = GBITS_MOCK_PAPERS[1];
const view = () => <MemoryRouter initialEntries={['/written-mock/gbits-b']}><Routes><Route path="written-mock/:paperId" element={<GbitsWrittenMockPage />} /></Routes></MemoryRouter>;
const click = (name) => fireEvent.click(screen.getByRole('button', { name, exact: true }));
function finish(type) { click(`进入${type}`); click(`提交整个${type}题型`); click('确认提交并锁定'); }
beforeEach(() => {
  localStorage.clear(); grade.mockReset(); grade.mockResolvedValue({ correct: true, referenceAnswerMd: 'secret reference' });
  state.questions = MOCK_TYPES.flatMap((type) => paper.groups[type].map((legacyId) => ({ id: `uuid-${legacyId}`, legacyId, type, title: legacyId, promptMd: 'visible prompt', payload: { options: [{ id: 'A', text: 'one' }, { id: 'B', text: 'two' }], blanks: [{ id: 'a', label: '结果' }] } })));
});
afterEach(cleanup);
describe('written mock screen', () => {
  it('restores an active draft, locks submitted blocks and defers every cloud answer until all three blocks finish', async () => {
    let ui = render(view()); click('创建本次模拟'); click('进入编程');
    fireEvent.change(screen.getByRole('textbox', { name: '编程作答' }), { target: { value: 'unfinished code' } });
    expect(screen.queryByRole('button', { name: '进入单选' })).toBeNull();
    expect(grade).not.toHaveBeenCalled(); expect(screen.queryByText('secret reference')).toBeNull();
    ui.unmount(); ui = render(view());
    expect(screen.getByRole('textbox', { name: '编程作答' })).toHaveValue('unfinished code');
    click('提交整个编程题型'); expect(screen.getByRole('alertdialog')).toHaveTextContent('未答完整 2 题'); click('确认提交并锁定');
    expect(screen.getByRole('button', { name: '编程已提交 · 不可返回' })).toBeDisabled();
    finish('填空'); expect(grade).not.toHaveBeenCalled();
    finish('单选'); expect(screen.getByRole('heading', { name: '全卷已提交' })).toBeVisible();
    expect(grade).not.toHaveBeenCalled(); click('加载全卷解析');
    await waitFor(() => expect(grade).toHaveBeenCalledTimes(21));
    expect(grade).toHaveBeenCalledWith('uuid-gbits-087', { answerMd: 'unfinished code' });
    await screen.findByText('客观题答对 18 / 18 题');
    const old = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY)); click('新建一次重练（保留旧记录）');
    const next = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY)); expect(Object.keys(next.attempts)).toHaveLength(2);
    expect(next.attempts[old.current[paper.id]]).toEqual(old.attempts[old.current[paper.id]]);
  });
  it('preserves final submissions after an RPC failure and can retry review', async () => {
    grade.mockRejectedValueOnce(new Error('offline')); render(view()); click('创建本次模拟');
    finish('单选'); finish('填空'); finish('编程'); const before = localStorage.getItem(MOCK_STORAGE_KEY); click('加载全卷解析');
    await screen.findByText(/解析加载失败/); expect(localStorage.getItem(MOCK_STORAGE_KEY)).toBe(before);
    click('加载全卷解析'); await screen.findByText('客观题答对 18 / 18 题');
  });
  it('disables missing cloud papers without augmenting from bundled questions', () => {
    state.questions.pop(); render(view()); expect(screen.getByRole('alert')).toHaveTextContent('缺少 1 题'); expect(screen.queryByRole('button', { name: '创建本次模拟' })).toBeNull();
  });
  it('does not overwrite malformed local records', () => {
    localStorage.setItem(MOCK_STORAGE_KEY, '{broken'); render(view()); expect(screen.getByRole('alert')).toHaveTextContent('未覆盖原数据'); expect(localStorage.getItem(MOCK_STORAGE_KEY)).toBe('{broken');
  });
  it('does not switch blocks when durable submission fails', () => {
    render(view()); click('创建本次模拟'); click('进入单选'); click('提交整个单选题型');
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    click('确认提交并锁定'); expect(screen.getByRole('alert')).toHaveTextContent('quota'); expect(screen.queryByRole('button', { name: '进入填空' })).toBeNull();
    spy.mockRestore(); click('确认提交并锁定'); expect(screen.getByRole('button', { name: '单选已提交 · 不可返回' })).toBeDisabled();
  });
});
