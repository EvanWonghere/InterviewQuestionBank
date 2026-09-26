import { useEffect, useMemo, useState } from 'react';
import { requireSupabase } from '@/lib/supabase';
import {
  BUILT_IN_PRICES, DEFAULT_USD_TO_CNY, PRICES_CHECKED_AT, deepSeekPeak, priceAt,
} from '../../../supabase/functions/ai-tutor/prices.js';

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

/** Cost at today's price table and overrides, priced at the time of the call (DeepSeek off-peak). */
function costAt(row, pricing) {
  const price = priceAt(row.model, row.created_at, pricing);
  if (!price) return null;
  return ((row.input_tokens - row.cached_tokens) * price.input + row.cached_tokens * price.cached + row.output_tokens * price.output) / 1_000_000;
}

/** ai_settings.pricing as { rate, models }; the first saved shape was a flat model map. */
export function normalizePricing(pricing) {
  if (!pricing || typeof pricing !== 'object') return { rate: '', models: {} };
  if ('models' in pricing || 'rate' in pricing) return { rate: pricing.rate ?? '', models: pricing.models ?? {} };
  return { rate: '', models: pricing };
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
 * API 设置 → where the tokens went. Prices are built in (prices.js, with DeepSeek's off-peak rate);
 * the exchange rate and per-model overrides are optional and saved with save-settings.
 */
export default function UsagePanel({ models, pricing: rawPricing, fx, onPricingChange }) {
  const saved = useMemo(() => normalizePricing(rawPricing), [rawPricing]);
  // What the function uses: a manual rate if one was saved, otherwise the live rate it fetched.
  const pricing = useMemo(
    () => ({ ...saved, rate: Number(saved.rate) > 0 ? Number(saved.rate) : fx?.rate ?? DEFAULT_USD_TO_CNY }),
    [saved, fx],
  );
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
  const priceModels = [...new Set([...Object.values(models ?? {}), ...Object.keys(pricing.models), ...byModel.map(([m]) => m)])].filter(Boolean);

  const setPrice = (model, field, value) => {
    const current = { input: '', cached: '', output: '', ...(saved.models[model] ?? {}) };
    current[field] = value;
    onPricingChange({ ...saved, models: { ...saved.models, [model]: current } });
  };
  const clearPrice = (model) => {
    const next = { ...saved.models };
    delete next[model];
    onPricingChange({ ...saved, models: next });
  };
  const rate = pricing.rate;
  const rateNote = Number(saved.rate) > 0 ? '手动设置' : fx?.date ? `${fx.source} ${fx.date}，每 12 小时自动更新` : '自动获取失败，暂用默认值';
  const peakNow = deepSeekPeak(Date.now());
  const yuan = (n) => (n < 0.1 ? n.toFixed(3) : n < 10 ? n.toFixed(2) : n.toFixed(1));

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
      <div className="ai-usage-table-wrap">
        <table className="ai-usage-table">
          <caption>单价（元 / 百万 token，{PRICES_CHECKED_AT} 按官方价格页核对）</caption>
          <thead><tr><th scope="col">模型</th><th scope="col">输入</th><th scope="col">缓存命中</th><th scope="col">输出</th></tr></thead>
          <tbody>{priceModels.map((model) => {
            const price = priceAt(model, Date.now(), pricing);
            const builtIn = BUILT_IN_PRICES[model];
            const source = pricing.models[model] ? '自定义' : builtIn?.offPeakFactor ? (peakNow ? '高峰价' : '闲时半价') : builtIn?.currency === 'USD' ? `美元 × ${rate.toFixed(4)}` : builtIn ? '' : '未定价';
            return (
              <tr key={model}>
                <th scope="row">{model}{source && <small className="ai-price-source">{source}</small>}</th>
                {price ? ['input', 'cached', 'output'].map((f) => <td key={f}>{yuan(price[f])}</td>) : <td colSpan={3}>—</td>}
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <p className="type-caption">
        DeepSeek 在北京时间工作日 9:00–12:00、14:00–18:00 按高峰价，其余时间（含周末）半价；每次调用按它发生的时刻计价，现在是{peakNow ? '高峰时段' : '闲时'}。法定节假日也是闲时，但这里按工作日计，节假日会略高估。
        OpenAI 按美元价格折算，汇率 {rate.toFixed(4)}（{rateNote}）。
      </p>
      <details className="ai-price-override">
        <summary>自定义单价与汇率（服务商调价、用了不在表里的模型，或想固定汇率时再填）</summary>
        <label className="ai-rate">手动汇率
          <input className="input-apple" type="number" min="0.01" max="100" step="0.0001" inputMode="decimal" placeholder={`留空自动（${(fx?.rate ?? DEFAULT_USD_TO_CNY).toFixed(4)}）`}
            value={saved.rate} onChange={(e) => onPricingChange({ ...saved, rate: e.target.value })} aria-label="美元兑人民币汇率" />
        </label>
        <fieldset className="ai-price-grid">
          <legend>元 / 百万 token，高峰价；DeepSeek 闲时仍按半价</legend>
          <div className="ai-price-row is-head" aria-hidden="true"><span />{PRICE_FIELDS.map(([, label]) => <span key={label}>{label}</span>)}</div>
          {priceModels.map((model) => (
            <div key={model} className="ai-price-row" role="group" aria-label={`${model} 单价`}>
              <span className="ai-price-model">{model}{saved.models[model] && <button type="button" className="ai-text-btn" onClick={() => clearPrice(model)}>恢复内置</button>}</span>
              {PRICE_FIELDS.map(([field, label]) => (
                <input key={field} className="input-apple" type="number" min="0" max="10000" step="0.01" inputMode="decimal"
                  aria-label={`${model} ${label}单价`} value={saved.models[model]?.[field] ?? ''} onChange={(e) => setPrice(model, field, e.target.value)} />
              ))}
            </div>
          ))}
        </fieldset>
      </details>
      <p className="type-caption">改动随「保存设置」生效。花费按当前价格表重新计算，历史也跟着变。</p>
    </section>
  );
}

/** The rate and complete override rows only, as numbers, for save-settings. */
export function cleanPricing(rawPricing) {
  const pricing = normalizePricing(rawPricing);
  const models = {};
  for (const [model, price] of Object.entries(pricing.models)) {
    const values = PRICE_FIELDS.map(([field]) => Number(price?.[field]));
    if (PRICE_FIELDS.every(([field]) => price?.[field] !== '' && price?.[field] != null) && values.every((v) => Number.isFinite(v) && v >= 0)) {
      models[model] = Object.fromEntries(PRICE_FIELDS.map(([field], i) => [field, values[i]]));
    }
  }
  const rate = Number(pricing.rate);
  return { ...(pricing.rate !== '' && Number.isFinite(rate) && rate > 0 ? { rate } : {}), models };
}
