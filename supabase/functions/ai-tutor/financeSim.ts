import { auction, drawdown, limitScenario, match, money, sell, tradeCosts } from "./financeModel.ts";

export type SimInstrument = { id: string; name: string; kind: "stock" | "etf"; sector: string; base: number };
export type SimScenario = { id: string; version: number; title: string; lessonIds: string[]; days: number; instruments: SimInstrument[]; eventDay?: number; eventText?: string; auction?: boolean; priceLimit: number; lot: number; commissionRate: number; minimumCommission: number; saleTaxRate: number; transferRate: number; spreadRate: number; reviewStatus: string };
export type SimEvent = (
  | { type: "start"; scenario: SimScenario; seed: number; at: string; plan?: string; positionCap: number }
  | { type: "order"; id: string; day: number; symbol: string; side: "buy" | "sell"; mode: "limit" | "market"; limit: number; quantity: number; reason: string; invalidIf: string; expected: string; positionPercent: number; at: string }
  | { type: "fill"; orderId: string; day: number; symbol: string; side: "buy" | "sell"; price: number; quantity: number; fee: number }
  | { type: "cancel"; orderId: string; day: number; at: string }
  | { type: "open"; day: number; price: number; matched: number }
  | { type: "day"; day: number }
  | { type: "review"; orderId: string; text: string; attribution: string[]; at: string }
  | { type: "drawdown_note"; percent: number; recovery: number; at: string }
  | { type: "ledger_check"; cash: number; holdings: number; equity: number; at: string }
  | { type: "abandon"; reason: string; at: string }
  | { type: "plan_review"; text: string; at: string }
  | { type: "finish"; at: string }) & { requestId?: string; requestPayload?: unknown };
export type SimAction =
  | { type: "order"; symbol: string; side: "buy" | "sell"; mode: "limit" | "market"; limit: number; quantity: number; reason: string; invalidIf: string; expected: string }
  | { type: "cancel"; orderId: string }
  | { type: "open" }
  | { type: "day" }
  | { type: "review"; orderId: string; text: string; attribution: string[] }
  | { type: "drawdown_note"; percent: number }
  | { type: "ledger_check"; cash: number; holdings: number; equity: number }
  | { type: "abandon"; reason: string }
  | { type: "plan_review"; text: string }
  | { type: "finish" };
export type SimRun = { id: string; scenario_id: string; scenario_version: number; seed: number; events: SimEvent[]; status: "active" | "complete"; revision: number };
export type SimOrder = Extract<SimEvent, { type: "order" }> & { filled: number; cancelled: boolean };
export type SimState = { scenario: SimScenario; seed: number; day: number; phase: "auction" | "continuous"; cash: number; holdings: Record<string, { quantity: number; lots: { quantity: number; day: number }[]; spent: number }>; orders: SimOrder[]; reviews: Record<string, Extract<SimEvent, { type: "review" }>>; peak: number; maxDrawdown: number; equity: number; positionCap: number; plan: string; completed: boolean; events: SimEvent[] };

function hash(seed: number, day: number, symbol: string) {
  let h = (seed ^ (day * 2654435761)) >>> 0;
  for (const char of symbol) h = Math.imul(h ^ char.charCodeAt(0), 16777619) >>> 0;
  h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
  return (h >>> 0) / 0xffffffff;
}
export function quote(scenario: SimScenario, seed: number, symbol: string, day: number): { price: number; previous: number; supply: number; news: string } {
  const instrument = scenario.instruments.find((item) => item.id === symbol);
  if (!instrument || !Number.isInteger(day) || day < 1 || day > scenario.days) throw Error("虚构证券或交易日不存在");
  let price = instrument.base;
  let previous = price;
  for (let n = 1; n <= day; n++) {
    previous = price;
    const shock = scenario.id === "drawdown" && scenario.eventDay && n >= scenario.eventDay && n < scenario.eventDay + 3 ? -0.08 : n === scenario.eventDay ? (scenario.id === "diversify" && instrument.sector === "食品" ? -0.09 : scenario.id === "auction" ? 0.1 : -0.04) : 0;
    const noise = (hash(seed, n, symbol) - 0.5) * (instrument.kind === "etf" ? 0.02 : 0.04);
    const change = scenario.id === "auction" && n === scenario.eventDay ? scenario.priceLimit / 100 : Math.max(-scenario.priceLimit / 100, Math.min(scenario.priceLimit / 100, noise + shock));
    price = money(previous * (1 + change));
  }
  const supply = scenario.id === "unfilled" && day === 2 ? 50 : scenario.id === "auction" && day === scenario.eventDay ? 0 : 300;
  return { price, previous, supply, news: day === scenario.eventDay ? scenario.eventText ?? "虚构剧本事件" : "虚构公司公告：暂无新的经营信息。" };
}
export function replay(events: SimEvent[]): SimState {
  const first = events[0];
  if (!first || first.type !== "start") throw Error("练习局缺少开局事件");
  const state: SimState = { scenario: first.scenario, seed: first.seed, day: 1, phase: first.scenario.auction ? "auction" : "continuous", cash: 100000, holdings: {}, orders: [], reviews: {}, peak: 100000, maxDrawdown: 0, equity: 100000, positionCap: first.positionCap, plan: first.plan ?? "", completed: false, events };
  const updateEquity = () => {
    state.equity = money(state.cash + Object.entries(state.holdings).reduce((sum, [id, h]) => sum + h.quantity * quote(state.scenario, state.seed, id, Math.min(state.day, state.scenario.days)).price, 0));
    state.peak = Math.max(state.peak, state.equity);
    state.maxDrawdown = money(Math.max(state.maxDrawdown, (state.peak - state.equity) / state.peak * 100));
  };
  for (const event of events.slice(1)) {
    if (event.type === "order") state.orders.push({ ...event, filled: 0, cancelled: false });
    else if (event.type === "fill") {
      const order = state.orders.find((item) => item.id === event.orderId);
      if (!order || order.cancelled) throw Error("成交缺少有效委托");
      order.filled += event.quantity;
      const holding = state.holdings[event.symbol] ?? { quantity: 0, lots: [], spent: 0 };
      if (event.side === "buy") {
        state.cash = money(state.cash - event.price * event.quantity - event.fee);
        holding.quantity += event.quantity;
        holding.spent = money(holding.spent + event.price * event.quantity + event.fee);
        holding.lots.push({ quantity: event.quantity, day: event.day });
      } else {
        state.cash = sell(state.cash, holding.quantity, event.quantity, event.price, event.fee).cash;
        holding.quantity -= event.quantity;
        let left = event.quantity;
        for (const lot of holding.lots) { const take = Math.min(left, lot.quantity); lot.quantity -= take; left -= take; if (!left) break; }
        holding.lots = holding.lots.filter((lot) => lot.quantity > 0);
      }
      state.holdings[event.symbol] = holding;
    } else if (event.type === "cancel") { const order = state.orders.find((item) => item.id === event.orderId); if (order) order.cancelled = true; }
    else if (event.type === "open") state.phase = "continuous";
    else if (event.type === "day") { state.day = event.day; state.phase = state.scenario.auction ? "auction" : "continuous"; }
    else if (event.type === "review") state.reviews[event.orderId] = event;
    else if (event.type === "finish") state.completed = true;
    updateEquity();
  }
  return state;
}
export function availableToSell(state: SimState, symbol: string) { return state.holdings[symbol]?.lots.filter((lot) => lot.day < state.day).reduce((sum, lot) => sum + lot.quantity, 0) ?? 0; }
export function orderPending(order: SimOrder) { return order.cancelled ? 0 : Math.max(0, order.quantity - order.filled); }
function fillsFor(state: SimState, order: SimOrder, now: string): SimEvent[] {
  const q = quote(state.scenario, state.seed, order.symbol, state.day);
  const band = limitScenario(q.previous, state.scenario.priceLimit, order.quantity, q.supply);
  const opening = state.events.find((event) => event.type === "open" && event.day === state.day);
  const price = opening?.type === "open" ? opening.price : q.price;
  const remaining = orderPending(order);
  if (!remaining || state.phase === "auction" || (price >= band.upper && q.supply === 0)) return [];
  const executable = order.side === "buy" ? (order.mode === "market" || order.limit >= price) : (order.mode === "market" || order.limit <= price);
  if (!executable) return [];
  const quantity = order.side === "buy" ? match(order.mode === "market" ? band.upper : order.limit, remaining, [{ price, quantity: q.supply }]).fills.reduce((sum, fill) => sum + fill.quantity, 0) : Math.min(remaining, q.supply);
  if (!quantity) return [];
  const amount = money(quantity * price);
  const costs = tradeCosts(amount, state.scenario.commissionRate, state.scenario.minimumCommission, state.scenario.saleTaxRate, state.scenario.transferRate, state.scenario.spreadRate);
  const fee = order.side === "buy" ? costs.buyCost : costs.sellCost;
  if (order.side === "buy" && amount + fee > state.cash) return [];
  if (order.side === "sell" && quantity > availableToSell(state, order.symbol)) return [];
  void now;
  return [{ type: "fill", orderId: order.id, day: state.day, symbol: order.symbol, side: order.side, price, quantity, fee }];
}
export function actOnRun(run: SimRun, action: SimAction, at = new Date().toISOString(), id = crypto.randomUUID()): SimRun {
  const state = replay(run.events);
  if (state.completed) throw Error("关卡已结束");
  const scenario = state.scenario;
  let added: SimEvent[] = [];
  if (action.type === "order") {
    const instrument = scenario.instruments.find((item) => item.id === action.symbol);
    if (!instrument || !["buy", "sell"].includes(action.side) || !["limit", "market"].includes(action.mode) || !Number.isInteger(action.quantity) || action.quantity <= 0 || action.quantity % scenario.lot !== 0 || !Number.isFinite(action.limit) || action.limit <= 0) throw Error(`委托数量须为 ${scenario.lot} 股整数倍，且价格有效`);
    if (!action.reason?.trim() || !action.invalidIf?.trim()) throw Error("提交委托前须填写理由与何时算我错了");
    if (action.reason.length > 1000 || action.invalidIf.length > 1000 || (action.expected ?? "").length > 1000) throw Error("下单前文字过长");
    if (scenario.id === "plan" && !state.plan.trim()) throw Error("本关须先写交易计划");
    if (action.side === "sell" && action.quantity > availableToSell(state, action.symbol)) throw Error("今日可卖不足：今天买入的股份下一交易日才能卖");
    const q = quote(scenario, state.seed, action.symbol, state.day);
    const band = limitScenario(q.previous, scenario.priceLimit, action.quantity, q.supply);
    if (action.mode === "limit" && (action.limit < band.lower || action.limit > band.upper)) throw Error("限价超出本关教学价格带");
    const estimated = money(action.quantity * (action.mode === "market" ? q.price : action.limit));
    if (action.side === "buy" && estimated + scenario.minimumCommission > state.cash) throw Error("教学账户现金不足");
    const positionPercent = money(estimated / state.equity * 100);
    const order: Extract<SimEvent, { type: "order" }> = { type: "order", id, day: state.day, symbol: action.symbol, side: action.side, mode: action.mode, limit: action.limit, quantity: action.quantity, reason: action.reason.trim(), invalidIf: action.invalidIf.trim(), expected: (action.expected ?? "").trim(), positionPercent, at };
    added = [order];
    const pending = replay([...run.events, order]).orders.at(-1)!;
    added.push(...fillsFor(state, pending, at));
  } else if (action.type === "cancel") {
    const order = state.orders.find((item) => item.id === action.orderId);
    if (!order || !orderPending(order)) throw Error("没有可撤销的未成交部分");
    added = [{ type: "cancel", orderId: order.id, day: state.day, at }];
  } else if (action.type === "open") {
    if (state.phase !== "auction") throw Error("当前不是集合竞价阶段");
    const orders = state.orders.filter((order) => order.day === state.day && orderPending(order)).map((order) => ({ side: order.side, price: order.limit, quantity: orderPending(order) }));
    // The quote is the fixed reference in this teaching auction; the matching price comes from the shared model.
    const q = quote(scenario, state.seed, scenario.instruments[0].id, state.day);
    const outcome = auction([...orders, { side: "sell", price: q.price, quantity: q.supply }]);
    added = [{ type: "open", day: state.day, price: outcome.price ?? q.price, matched: outcome.matched }];
    let next = replay([...run.events, ...added]);
    for (const order of next.orders.filter((item) => item.day === next.day && orderPending(item))) {
      const fills = fillsFor(next, order, at); added.push(...fills); next = replay([...run.events, ...added]);
    }
  } else if (action.type === "day") {
    if (state.day >= scenario.days) throw Error("已到关卡最后一个交易日，请结束关卡");
    added = [{ type: "day", day: state.day + 1 }];
    let next = replay([...run.events, ...added]);
    if (next.phase === "continuous") for (const order of next.orders.filter((item) => orderPending(item))) {
      const fills = fillsFor(next, order, at); added.push(...fills); next = replay([...run.events, ...added]);
    }
  } else if (action.type === "review") {
    if (!state.orders.some((order) => order.id === action.orderId) || !action.text?.trim() || action.text.length > 2000 || action.attribution.some((value) => !["知识不懂", "操作失误", "判断验证", "随机波动"].includes(value))) throw Error("复盘内容无效");
    added = [{ type: "review", orderId: action.orderId, text: action.text.trim(), attribution: action.attribution, at }];
  } else if (action.type === "drawdown_note") {
    if (!Number.isFinite(action.percent) || Math.abs(action.percent - state.maxDrawdown) > 0.1) throw Error("请按账户账簿填写最大回撤");
    added = [{ type: "drawdown_note", percent: state.maxDrawdown, recovery: drawdown(Math.min(99, state.maxDrawdown)), at }];
  } else if (action.type === "ledger_check") {
    if ([action.cash, action.holdings, action.equity].some((value) => !Number.isFinite(value)) || Math.abs(action.cash - state.cash) > .01 || Math.abs(action.holdings - (state.equity - state.cash)) > .01 || Math.abs(action.equity - state.equity) > .01) throw Error("账簿核对不一致，请区分现金、持仓市值和总资产");
    added = [{ type: "ledger_check", cash: state.cash, holdings: money(state.equity - state.cash), equity: state.equity, at }];
  } else if (action.type === "abandon") {
    if (scenario.id !== "plan" || !state.plan || state.orders.length || !action.reason?.trim()) throw Error("放弃执行需要先写计划与理由，且尚未下单");
    added = [{ type: "abandon", reason: action.reason.trim().slice(0, 1000), at }];
  } else if (action.type === "plan_review") {
    if (scenario.id !== "plan" || !state.plan || !action.text?.trim() || (!state.orders.length && !eventsHas(state.events, "abandon"))) throw Error("先执行或放弃计划，再写对照复盘");
    added = [{ type: "plan_review", text: action.text.trim().slice(0, 2000), at }];
  } else if (action.type === "finish") {
    if (state.day < scenario.days) throw Error("请完成本关全部交易日");
    if (!goalComplete(state)) throw Error("本关动作目标尚未完成；可以继续操作或重开关卡");
    added = [{ type: "finish", at }];
  } else throw Error("未知练习操作");
  if (added[0]) { added[0].requestId = id; added[0].requestPayload = action; }
  const events = [...run.events, ...added];
  if (events.length > 300) throw Error("本局事件过多，请结束当前关卡");
  return { ...run, events, status: action.type === "finish" ? "complete" : "active", revision: run.revision + 1 };
}
export function startRun(scenario: SimScenario, seed: number, positionCap: number, plan = "", at = new Date().toISOString(), id = crypto.randomUUID()): SimRun {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff || !Number.isFinite(positionCap) || positionCap <= 0 || positionCap > 100 || plan.length > 2000) throw Error("开局参数无效");
  return { id, scenario_id: scenario.id, scenario_version: scenario.version, seed, status: "active", revision: 0, events: [{ type: "start", scenario, seed, positionCap, plan: plan.trim(), at }] };
}
export function goalEvidence(state: SimState): string[] {
  const id = state.scenario.id, events = state.events;
  const orders = state.orders, fills = events.filter((event): event is Extract<SimEvent, { type: "fill" }> => event.type === "fill");
  if (id === "first-buy") return [state.orders.some((order) => order.side === "buy" && order.mode === "limit" && order.filled >= 100) ? "已完成限价买入" : "待完成限价买入", eventsHas(events, "ledger_check") ? "已核对现金、持仓市值、总资产" : "待核对现金、持仓市值、总资产"];
  if (id === "unfilled") return [orders.some((o) => !events.some((event) => event.type === "fill" && event.orderId === o.id && event.day === o.day) && state.day > o.day) ? "经历未成交" : "待经历未成交", orders.some((o) => o.filled > 0 && o.filled < o.quantity) ? "经历部分成交" : "待经历部分成交", orders.some((o) => o.cancelled && o.filled < o.quantity) ? "已撤销剩余" : "待撤销剩余"];
  if (id === "t-plus-one") return [fills.some((e) => e.side === "buy") ? "已买入" : "待买入", fills.some((e) => e.side === "sell" && e.day > fills.find((b) => b.side === "buy")?.day!) ? "次日卖出" : "待次日卖出"];
  if (id === "basket") return [balancedBasket(fills) ? "已用相近金额比较股票与虚构 ETF" : "待用相近金额分别买入股票与虚构 ETF", state.day >= 10 ? "已观察 10 日" : "待观察 10 日"];
  if (id === "diversify") return [state.positionCap < 100 ? "已设单只仓位上限" : "待设置仓位上限", new Set(fills.filter((e) => e.side === "buy").map((e) => e.symbol)).size >= 2 ? "已持有两个行业" : "待持有两个行业", state.day >= (state.scenario.eventDay ?? 4) ? "已观察行业坏消息日" : "待观察行业坏消息日"];
  if (id === "auction") return [events.some((e) => e.type === "open") ? "已进行集合竞价" : "待集合竞价", orders.some((o) => o.filled < o.quantity) ? "已观察排队" : "待观察涨停排队"];
  if (id === "costs") return [fills.filter((e) => e.side === "buy").length >= 5 && fills.filter((e) => e.side === "sell").length >= 5 ? "已完成五笔往返" : "待完成五笔小额往返"];
  if (id === "plan") return [state.plan ? "已写计划" : "待写计划", orders.length || eventsHas(events, "abandon") ? "已执行或放弃" : "待执行或放弃", eventsHas(events, "plan_review") ? "已对照复盘" : "待对照复盘"];
  if (id === "drawdown") return [state.maxDrawdown > 0 ? "已观察回撤" : "待观察回撤", events.some((e) => e.type === "drawdown_note") ? "已计算回本涨幅" : "待计算回本涨幅"];
  return ["自由练习：记录判断与结果"];
}
function eventsHas(events: SimEvent[], type: SimEvent["type"]) { return events.some((event) => event.type === type); }
function balancedBasket(fills: Extract<SimEvent, { type: "fill" }>[]) {
  const stock = fills.filter((event) => event.side === "buy" && event.symbol === "T01").reduce((sum, event) => sum + event.price * event.quantity, 0);
  const etf = fills.filter((event) => event.side === "buy" && event.symbol === "E01").reduce((sum, event) => sum + event.price * event.quantity, 0);
  return stock > 0 && etf > 0 && Math.abs(stock - etf) / Math.max(stock, etf) <= .1;
}
export function goalComplete(state: SimState) {
  const id = state.scenario.id, events = state.events, fills = events.filter((event): event is Extract<SimEvent, { type: "fill" }> => event.type === "fill");
  if (id === "first-buy") return state.orders.some((order) => order.side === "buy" && order.mode === "limit" && order.filled >= 100) && eventsHas(events, "ledger_check");
  if (id === "unfilled") return goalEvidence(state).every((item) => !item.startsWith("待"));
  if (id === "t-plus-one") return fills.some((event) => event.side === "sell" && fills.some((buy) => buy.side === "buy" && buy.symbol === event.symbol && buy.day < event.day));
  if (id === "basket") return balancedBasket(fills) && state.day >= 10;
  if (id === "diversify") return state.positionCap < 100 && new Set(fills.filter((e) => e.side === "buy").map((e) => e.symbol)).size >= 2 && state.day >= (state.scenario.eventDay ?? 4);
  if (id === "auction") return eventsHas(events, "open") && state.orders.some((order) => order.day === state.scenario.eventDay && order.filled < order.quantity);
  if (id === "costs") return fills.filter((event) => event.side === "buy" && Math.abs(event.price * event.quantity - 1000) <= 150).length >= 5 && fills.filter((event) => event.side === "sell" && Math.abs(event.price * event.quantity - 1000) <= 150).length >= 5;
  if (id === "plan") return !!state.plan && (state.orders.length > 0 || eventsHas(events, "abandon")) && eventsHas(events, "plan_review");
  if (id === "drawdown") return state.maxDrawdown > 0 && eventsHas(events, "drawdown_note");
  return state.orders.length > 0;
}
export function scenarioComparison(state: SimState): { label: string; value: number; unit: string }[] {
  if (state.scenario.id === "basket") {
    const volatility = (symbol: string) => {
      const returns = Array.from({ length: Math.min(state.day, 10) - 1 }, (_, i) => quote(state.scenario, state.seed, symbol, i + 2).price / quote(state.scenario, state.seed, symbol, i + 1).price - 1);
      if (!returns.length) return 0;
      const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
      return money(Math.sqrt(returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length) * 100);
    };
    return [{ label: "单只股票每日涨跌波动", value: volatility("T01"), unit: "%" }, { label: "虚构 ETF 每日涨跌波动", value: volatility("E01"), unit: "%" }];
  }
  if (state.scenario.id === "diversify") {
    const change = (symbol: string) => quote(state.scenario, state.seed, symbol, Math.min(state.day, state.scenario.days)).price / quote(state.scenario, state.seed, symbol, 1).price - 1;
    return [{ label: "仅持有食品行业的假设变化", value: money(change("T01") * 100), unit: "%" }, { label: "食品与工业各半的假设变化", value: money((change("T01") + change("T02")) * 50), unit: "%" }];
  }
  return [];
}
