import type { SimScenario } from "./financeSim.ts";

const T01 = { id: "T01", name: "青禾食品 T01", kind: "stock" as const, sector: "食品", base: 100 };
const T02 = { id: "T02", name: "云石器材 T02", kind: "stock" as const, sector: "工业", base: 100 };
const E01 = { id: "E01", name: "三业指数基金 E01", kind: "etf" as const, sector: "混合", base: 100 };
const small = { id: "T08", name: "星港零售 T08", kind: "stock" as const, sector: "零售", base: 10 };
const common = { version: 1, days: 10, priceLimit: 10, lot: 100, commissionRate: 0.0003, minimumCommission: 5, saleTaxRate: 0, transferRate: 0, spreadRate: 0, reviewStatus: "规则参数待本人复核；佣金仅为教学参数" };
// Owner-only catalog: copied into the private Edge Function, never imported by the Vite app.
export const financeScenarios: SimScenario[] = [
  { ...common, id: "first-buy", title: "第一笔买入", lessonIds: ["finance-01", "finance-02"], instruments: [T01] },
  { ...common, id: "unfilled", title: "没成交的委托", lessonIds: ["finance-03"], instruments: [T01], eventDay: 2, eventText: "虚构卖盘出现 50 股，观察部分成交。" },
  { ...common, id: "t-plus-one", title: "今天买的明天才能卖", lessonIds: ["finance-04"], instruments: [T01] },
  { ...common, id: "basket", title: "一篮子与单只", lessonIds: ["finance-05"], instruments: [T01, E01] },
  { ...common, id: "diversify", title: "集中与分散", lessonIds: ["finance-06"], instruments: [T01, T02], eventDay: 4, eventText: "虚构食品行业出现坏消息；比较集中与分散的账户。" },
  { ...common, id: "auction", title: "开盘价从哪来", lessonIds: ["finance-07"], instruments: [T01], auction: true, eventDay: 5, eventText: "虚构证券触及教学涨停价，卖盘为零。" },
  { ...common, id: "costs", title: "小额交易的成本", lessonIds: ["finance-08"], instruments: [small], saleTaxRate: 0.0005, transferRate: 0.00001, spreadRate: 0.0002, eventText: "费用均为教学假设，不代表现行市场收费。" },
  { ...common, id: "plan", title: "带计划交易", lessonIds: ["finance-09"], instruments: [T01] },
  { ...common, id: "drawdown", title: "回撤", lessonIds: ["finance-10"], instruments: [T01], eventDay: 4, eventText: "虚构证券连续下跌剧本开始。" },
  { ...common, id: "free", title: "自由练习", lessonIds: [], days: 20, instruments: [T01, T02, E01] },
];
export function scenarioById(id: string, version: number) { return financeScenarios.find((item) => item.id === id && item.version === version); }
