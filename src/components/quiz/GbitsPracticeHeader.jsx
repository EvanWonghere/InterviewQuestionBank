import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// A practice aid only. No automatic grades, forced submission or progress writes.
export default function GbitsPracticeHeader({ set, available, expected }) {
  const [deadline, setDeadline] = useState(null);
  const [remaining, setRemaining] = useState(90 * 60);
  useEffect(() => {
    if (!deadline) return;
    const update = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);
  return <div className="surface-card p-4 space-y-3 mb-5">
    <Link to="/topics/gbits" className="type-caption">← 吉比特笔试专项</Link>
    <p className="type-caption">{set === 'paper' ? '混合练习卷 · 20 选择 / 4 填空 / 2 编程' : set === 'start' ? '起步练习 · 先独立答这 6 题' : '按专题顺序练习'} · 当前 {available} / {expected} 题</p>
    {available < expected && <p role="alert">当前题库缺少 {expected - available} 道专题题目，已显示的列表不是完整练习卷。</p>}
    {set === 'paper' && <div className="flex flex-wrap items-center gap-3">
      <span className="font-mono tabular-nums" aria-label="剩余练习时间">{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span>
      {!deadline && <button type="button" className="btn-neutral" disabled={available < expected} onClick={() => setDeadline(Date.now() + 90 * 60000)}>开始 90 分钟计时</button>}
      {deadline && <button type="button" className="btn-neutral" onClick={() => { setDeadline(null); setRemaining(90 * 60); }}>重新计时</button>}
      <p className="type-micro">{deadline && remaining === 0 ? '时间到，先停笔，再复盘。' : '计时仅供自测；离开或刷新页面后重置。'}</p>
    </div>}
  </div>;
}
