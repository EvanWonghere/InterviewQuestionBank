// USD→CNY for pricing OpenAI calls, fetched from keyless public sources and kept in memory.
// Frankfurter publishes the European Central Bank's daily reference rate; open.er-api.com is the
// fallback. A failed fetch keeps the last good rate, or prices.js's default before any fetch works.
import { DEFAULT_USD_TO_CNY } from './prices.js';

const SOURCES = [
  { name: '欧洲央行（Frankfurter）', url: 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=CNY', read: (d) => ({ rate: d?.rates?.CNY, date: d?.date }) },
  { name: 'ExchangeRate-API', url: 'https://open.er-api.com/v6/latest/USD', read: (d) => ({ rate: d?.rates?.CNY, date: d?.time_last_update_utc ? new Date(d.time_last_update_utc).toISOString().slice(0, 10) : null }) },
];
export const FX_TTL_MS = 12 * 3_600_000;
const TIMEOUT_MS = 1500;

let cache = null;

/** For tests: forget the cached rate. */
export function resetFxCache() { cache = null; }

/** { rate, date, source } — live when a source answered in the last 12 hours, else the last good or default rate. */
export async function usdToCny({ fetchImpl = fetch, now = Date.now() } = {}) {
  if (cache && now - cache.fetchedAt < FX_TTL_MS) return cache.value;
  for (const source of SOURCES) {
    try {
      const response = await fetchImpl(source.url, { redirect: 'error', signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) continue;
      const { rate, date } = source.read(await response.json());
      // A plausible USD→CNY rate only; anything else is a broken response.
      if (!Number.isFinite(rate) || rate < 3 || rate > 20) continue;
      cache = { fetchedAt: now, value: { rate, date: date ?? null, source: source.name } };
      return cache.value;
    } catch {
      // Try the next source.
    }
  }
  return cache?.value ?? { rate: DEFAULT_USD_TO_CNY, date: null, source: '默认值' };
}
