import { useEffect, useMemo, useState } from 'react';
import { requireSupabase } from '@/lib/supabase';

const DAY_MS = 86_400_000;
const PRICE_FIELDS = [['input', '输入'], ['cached', '缓存命中'], ['output', '输出']];
const ACTION_LABELS = {
  chat: '学习助手', evaluate: 'AI 评估', 'interview-report': '面试报告', 'weakness-report': '薄弱点报告',
  'draft-question': '追问出题', 'draft-weakness-questions': '薄弱点出题',
};
const actionLabel = (action) => ACTION_LABELS[action] ?? (action.startsWith('music-') ? '音乐练习室' : action.startsWith('lab-') ? 'ConceptLab' : action);
const k = (n) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const money = (n) => (n == null ? '—' : `¥${n < 1 ? n.toFixed(4) : n.toFixed(2)}`);

/** Cost at the prices currently entered (not the ones saved with each row), so a price fix applies to history. */
function costAt(row, pricing) {
  const price = pricing?.[row.model];
  if (!price) return null;
  return ((row.input_tokens - row.cached_tokens) * price.input + row.cached_tokens * price.cached + row.output_tokens * price.output) / 1_000_000;
}

function summarize(rows, pricing) {
  const blank = () => ({ calls: 0, input: 0, cached: 0, output: 0, reasoning: 0, cost: 0, unpriced: 0 });
  const total = blank();
  const byModel = new Map();
  const byAction = new Map();
  for (const row of rows) {
    const cost = costAt(row, pricing);
    for (const bucket of [total, byModel.get(row.model) ?? byModel.set(row.model, blank()).get(row.model), byAction.get(actionLabel(row.action)) ?? byAction.set(actionLabel(row.action), blank()).get(actionLabel(row.action))]) {
      bucket.calls += 1;
      bucket.input += row.input_tokens;
      bucket.cached += row.cached_tokens;
      bucket.output += row.output_tokens;
      bucket.reasoning += row.reasoning_tokens;
      if (cost == null) bucket.unpriced += 1; else bucket.cost += cost;
    }
  }
  return { total, byModel: [...byModel.entries()].sort((a, b) => b[1].cost - a[1].cost || b[1].output - a[1].output), byAction: [...byAction.entries()].sort((a, b) => b[1].cost - a[1].cost || b[1].calls - a[1].calls) };
}

/**
 * API 设置 → prices and where the tokens went. Prices are per million tokens in yuan, by model name;
 * the function saves them with save-settings and uses them for the cost 小芽 shows after each answer.
 */
export default function UsagePanel({ models, pricing, onPricingChange }) {
  const [range, setRange] = useState(7);
  const [state, setState] = useState({ rows: [], loading: true, error: '' });

  useEffect(() => {
    let alive = true;
    requireSupabase().from('ai_usage')
      .select('created_at,action,model,input_tokens,cached_tokens,output_tokens,reasoning_tokens')
      .gte('created_at', new Date(Date.now() - 30 * DAY_MS).toISOString())
      .order('created_at', { ascending: false })
      .limit(5000)
      .then(({ data, error }) => {
        if (!alive) return;
        setState(error ? { rows: [], loading: false, error: '用量记录暂不可用（数据库迁移尚未应用或网络异常）。' } : { rows: data ?? [], loading: false, error: '' });
      });
    return () => { alive = false; };
  }, []);

  const since = Date.now() - range * DAY_MS;
  const rows = useMemo(() => state.rows.filter((row) => new Date(row.created_at).getTime() >= since), [state.rows, since]);
  const { total, byModel, byAction } = useMemo(() => summarize(rows, pricing), [rows, pricing]);
  const priceModels = [...new Set([...Object.values(models ?? {}), ...Object.keys(pricing ?? {}), ...byModel.map(([m]) => m)])].filter(Boolean);

  const setPrice = (model, field, value) => {
    const next = { ...(pricing ?? {}) };
    const current = { input: '', cached: '', output: '', ...(next[model] ?? {}) };
    current[field] = value;
    next[model] = current;
    onPricingChange(next);
  };

  return (
    <section className="ai-usage" aria-label="用量与价格">
      <h3 className="ai-settings-title">用量与花费</h3>
      <div className="ai-usage-range" role="group" aria-label="时间范围">
        {[[1, '今天'], [7, '近 7 天'], [30, '近 30 天']].map(([days, label]) => (
          <button key={days} type="button" className={`filter-pill ${range === days ? 'is-active' : ''}`} aria-pressed={range === days} onClick={() => setRange(days)}>{label}</button>
        ))}
      </div>
      {state.loading ? <p className="type-caption">正在读取用量…</p> : state.error ? <p className="type-caption">{state.error}</p> : (
        <>
          <dl className="ai-usage-figures">
            <div><dt>花费</dt><dd>{money(total.cost)}{total.unpriced ? <small>另有 {total.unpriced} 次未定价</small> : null}</dd></div>
            <div><dt>调用</dt><dd>{total.calls}</dd></div>
            <div><dt>缓存命中</dt><dd>{pct(total.cached, total.input)}<small>输入 {k(total.input)}</small></dd></div>
            <div><dt>思考占输出</dt><dd>{pct(total.reasoning, total.output)}<small>输出 {k(total.output)}</small></dd></div>
          </dl>
          {byModel.length > 0 && (
            <div className="ai-usage-table-wrap">
              <table className="ai-usage-table">
                <caption>按模型</caption>
                <thead><tr><th scope="col">模型</th><th scope="col">调用</th><th scope="col">命中</th><th scope="col">输出</th><th scope="col">思考</th><th scope="col">花费</th></tr></thead>
                <tbody>{byModel.map(([model, s]) => (
                  <tr key={model}><th scope="row">{model}</th><td>{s.calls}</td><td>{pct(s.cached, s.input)}</td><td>{k(s.output)}</td><td>{pct(s.reasoning, s.output)}</td><td>{s.unpriced ? '未定价' : money(s.cost)}</td></tr>
                ))}</tbody>
              </table>
              <table className="ai-usage-table">
                <caption>按功能</caption>
                <thead><tr><th scope="col">功能</th><th scope="col">调用</th><th scope="col">命中</th><th scope="col">输出</th><th scope="col">花费</th></tr></thead>
                <tbody>{byAction.map(([action, s]) => (
                  <tr key={action}><th scope="row">{action}</th><td>{s.calls}</td><td>{pct(s.cached, s.input)}</td><td>{k(s.output)}</td><td>{s.unpriced ? '未定价' : money(s.cost)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          {!rows.length && <p className="type-caption">这段时间还没有记录。部署后每次调用都会记下输入、缓存命中、输出和思考的 token 数。</p>}
        </>
      )}
      <fieldset className="ai-price-grid">
        <legend>单价（元 / 百万 token，按服务商价格填写）</legend>
        <div className="ai-price-row is-head" aria-hidden="true"><span />{PRICE_FIELDS.map(([, label]) => <span key={label}>{label}</span>)}</div>
        {priceModels.map((model) => (
          <div key={model} className="ai-price-row" role="group" aria-label={`${model} 单价`}>
            <span className="ai-price-model">{model}</span>
            {PRICE_FIELDS.map(([field, label]) => (
              <input key={field} className="input-apple" type="number" min="0" max="10000" step="0.01" inputMode="decimal"
                aria-label={`${model} ${label}单价`} value={pricing?.[model]?.[field] ?? ''} onChange={(e) => setPrice(model, field, e.target.value)} />
            ))}
          </div>
        ))}
      </fieldset>
      <p className="type-caption">三格都填了的模型才会计价，保存设置后生效；没定价时小芽显示消耗的 token 数。花费按这里的当前单价计算，改价格后历史也会重算。</p>
    </section>
  );
}

/** Complete price rows only, as numbers, for save-settings. */
export function cleanPricing(pricing) {
  const clean = {};
  for (const [model, price] of Object.entries(pricing ?? {})) {
    const values = PRICE_FIELDS.map(([field]) => Number(price?.[field]));
    if (PRICE_FIELDS.every(([field]) => price?.[field] !== '' && price?.[field] != null) && values.every((v) => Number.isFinite(v) && v >= 0)) {
      clean[model] = Object.fromEntries(PRICE_FIELDS.map(([field], i) => [field, values[i]]));
    }
  }
  return clean;
}
