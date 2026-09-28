export const money = (n: number) =>
  Math.round((n + Number.EPSILON) * 100) / 100;
export function account(
  initial: number,
  price: number,
  quantity: number,
  current: number,
  fee = 0,
) {
  if (
    [initial, price, quantity, current, fee].some(
      (n) => !Number.isFinite(n) || n < 0,
    ) ||
    !Number.isInteger(quantity)
  )
    throw Error("参数无效");
  const cost = money(price * quantity + fee);
  if (cost > initial) throw Error("现金不足，教学账户不借款");
  const cash = money(initial - cost),
    value = money(current * quantity),
    equity = money(cash + value);
  return { cash, value, equity, pnl: money(equity - initial) };
}
export function match(
  limit: number,
  quantity: number,
  asks: { price: number; quantity: number }[],
) {
  if (
    limit < 0 ||
    quantity < 0 ||
    !Number.isFinite(limit) ||
    !Number.isInteger(quantity)
  )
    throw Error("参数无效");
  let remaining = quantity;
  const fills: { price: number; quantity: number }[] = [];
  for (const ask of [...asks].sort((a, b) => a.price - b.price)) {
    if (ask.price > limit || remaining === 0) break;
    const qty = Math.min(remaining, ask.quantity);
    fills.push({ price: ask.price, quantity: qty });
    remaining -= qty;
  }
  return {
    fills,
    remaining,
    total: money(fills.reduce((n, f) => n + f.price * f.quantity, 0)),
    status:
      remaining === 0
        ? "全部成交"
        : remaining === quantity
          ? "未成交"
          : "部分成交",
  };
}
export function portfolio(weight: number, a: number, b: number) {
  return money(weight * a + (1 - weight) * b);
}
export function indexEtf(changes: number[], weights: number[], annualFeePercent: number, trackingDifferencePercent: number) {
  if (changes.length !== 3 || weights.length !== 3 ||
    [...changes, ...weights, annualFeePercent, trackingDifferencePercent].some((value) => !Number.isFinite(value)) ||
    changes.some((value) => value < -100) || weights.some((value) => value < 0 || value > 1) ||
    Math.abs(weights.reduce((sum, value) => sum + value, 0) - 1) > 0.000001 || annualFeePercent < 0) {
    throw Error("指数教学参数无效：三只股票权重之和须为 100%");
  }
  const indexChange = money(changes.reduce((sum, value, i) => sum + value * weights[i], 0));
  const etfChange = money(indexChange - annualFeePercent + trackingDifferencePercent);
  return { indexChange, indexLevel: money(100 * (1 + indexChange / 100)), etfChange, etfNav: money(100 * (1 + etfChange / 100)), difference: money(indexChange - etfChange) };
}
export function holdingsVolatility(count: number, correlation: number, singleVolatility = 20) {
  if (!Number.isInteger(count) || count < 1 || count > 20 || !Number.isFinite(correlation) || correlation < -1 || correlation > 1 ||
    !Number.isFinite(singleVolatility) || singleVolatility < 0 || (count > 1 && correlation < -1 / (count - 1) - 0.000001)) {
    throw Error("持仓参数无效：该数量下的共同相关系数不能低于 −1/(N−1)");
  }
  return money(singleVolatility * Math.sqrt(Math.max(0, correlation + (1 - correlation) / count)));
}
export type Question = {
  id: string;
  concept: string;
  prompt: string;
  options: string[];
  variant: boolean;
  kind?: "choice" | "numeric" | "scenario" | "ordering";
  tolerance?: number;
  unit?: string;
};
export type Lesson = {
  id: string;
  version: number;
  title: string;
  prerequisites: string[];
  goal: string;
  body: string;
  terms: Record<string, string>;
  experiment: string;
  instruction?: string;
  experimentBrief?: { situation: string; question: string; controls: string; observe: string };
  observation: string;
  questions: Question[];
  stage?: string;
  misconceptions?: { mistake: string; reality: string; experiment?: string }[];
  ruleCards?: { rule: string; scope: string; excludes: string; source: string; effectiveDate?: string; checkedAt?: string; reviewStatus?: string; url?: string }[];
  readings?: { resourceId: string; paragraphs: string; minutes: number }[];
};
export type RecordRow = {
  id: string;
  kind: string;
  lesson_id: string;
  version: number;
  payload: any;
  created_at: string;
};
export function sell(
  cash: number,
  held: number,
  quantity: number,
  price: number,
  fee = 0,
) {
  if (
    [cash, held, quantity, price, fee].some(
      (n) => !Number.isFinite(n) || n < 0,
    ) ||
    !Number.isInteger(held) ||
    !Number.isInteger(quantity) ||
    quantity > held
  )
    throw Error("卖出参数无效");
  const nextCash = money(cash + quantity * price - fee);
  if (nextCash < 0) throw Error("现金不足");
  return {
    cash: nextCash,
    held: held - quantity,
    equity: money(nextCash + (held - quantity) * price),
  };
}
export function auction(orders: { side: "buy" | "sell"; price: number; quantity: number }[]) {
  if (!orders.length || orders.some((order) => !Number.isFinite(order.price) || order.price < 0 || !Number.isInteger(order.quantity) || order.quantity < 0)) throw Error("竞价参数无效");
  const prices = [...new Set(orders.map((order) => order.price))].sort((a, b) => a - b);
  const candidates = prices.map((price) => {
    const buy = orders.filter((order) => order.side === "buy" && order.price >= price).reduce((sum, order) => sum + order.quantity, 0);
    const sell = orders.filter((order) => order.side === "sell" && order.price <= price).reduce((sum, order) => sum + order.quantity, 0);
    return { price, matched: Math.min(buy, sell), imbalance: Math.abs(buy - sell) };
  });
  return candidates.sort((a, b) => b.matched - a.matched || a.imbalance - b.imbalance || a.price - b.price)[0];
}
export function limitScenario(reference: number, percent: number, buyQuantity: number, sellQuantity: number) {
  if (![reference, percent, buyQuantity, sellQuantity].every(Number.isFinite) || reference < 0 || percent < 0 || percent > 100 || !Number.isInteger(buyQuantity) || !Number.isInteger(sellQuantity) || buyQuantity < 0 || sellQuantity < 0) throw Error("涨跌停教学参数无效");
  const upper = money(reference * (1 + percent / 100));
  const lower = money(reference * (1 - percent / 100));
  return { upper, lower, filled: Math.min(buyQuantity, sellQuantity), queued: Math.max(0, buyQuantity - sellQuantity) };
}
export function tradeCosts(amount: number, commissionRate: number, minimum: number, saleTaxRate = 0, transferRate = 0, spread = 0) {
  if ([amount, commissionRate, minimum, saleTaxRate, transferRate, spread].some((value) => !Number.isFinite(value) || value < 0)) throw Error("费用参数无效");
  const oneCommission = Math.max(amount * commissionRate, minimum);
  const buyCost = money(oneCommission + amount * transferRate);
  const sellCost = money(oneCommission + amount * transferRate + amount * saleTaxRate);
  const spreadCost = money(amount * spread);
  const total = money(buyCost + sellCost + spreadCost);
  return { buyCost, sellCost, spreadCost, total, breakEvenPercent: amount ? money(total / amount * 100) : 0 };
}
export function drawdown(lossPercent: number) {
  if (!Number.isFinite(lossPercent) || lossPercent < 0 || lossPercent >= 100) throw Error("回撤必须在 0% 到 100% 之间");
  return money(lossPercent / (100 - lossPercent) * 100);
}
export function correlatedRisk(weight: number, volatilityA: number, volatilityB: number, correlation: number) {
  if (![weight, volatilityA, volatilityB, correlation].every(Number.isFinite) || weight < 0 || weight > 1 || volatilityA < 0 || volatilityB < 0 || correlation < -1 || correlation > 1) throw Error("相关性参数无效");
  return money(Math.sqrt(weight ** 2 * volatilityA ** 2 + (1 - weight) ** 2 * volatilityB ** 2 + 2 * weight * (1 - weight) * correlation * volatilityA * volatilityB));
}
export function statements(revenue: number, costs: number, unpaidSales: number) {
  if ([revenue, costs, unpaidSales].some((value) => !Number.isFinite(value) || value < 0) || unpaidSales > revenue) throw Error("财报教学参数无效");
  return { profit: money(revenue - costs), operatingCash: money(revenue - unpaidSales - costs) };
}
export function valuation(price: number, earningsPerShare: number) {
  if (![price, earningsPerShare].every(Number.isFinite) || price < 0) throw Error("估值教学参数无效");
  return { pe: earningsPerShare > 0 ? money(price / earningsPerShare) : null };
}
export function benchmark(ownReturn: number, benchmarkReturn: number, costs: number) {
  if (![ownReturn, benchmarkReturn, costs].every(Number.isFinite) || costs < 0) throw Error("基准参数无效");
  return { netReturn: money(ownReturn - costs), relative: money(ownReturn - costs - benchmarkReturn) };
}
