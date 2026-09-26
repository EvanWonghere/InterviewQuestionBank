// Built-in model prices, per million tokens, from the providers' pricing pages (checked 2026-09-26):
// https://api-docs.deepseek.com/zh-cn/quick_start/pricing and https://developers.openai.com/api/docs/pricing
// (standard tier, short context). The quiz shares this module for its usage panel.
// Update the table when a provider changes prices; API 设置 can override a model meanwhile.

export const PRICES_CHECKED_AT = '2026-09-26';
export const DEFAULT_USD_TO_CNY = 7.1;

export const BUILT_IN_PRICES = {
  // DeepSeek bills half price outside its peak hours (deepSeekPeak).
  'deepseek-flash': { currency: 'CNY', input: 2, cached: 0.04, output: 8, offPeakFactor: 0.5 },
  'deepseek-v4-pro': { currency: 'CNY', input: 9, cached: 0.3, output: 27, offPeakFactor: 0.5 },
  'gpt-6-luna': { currency: 'USD', input: 0.1, cached: 0.01, output: 0.5 },
  'gpt-6-sol': { currency: 'USD', input: 2, cached: 0.2, output: 10 },
};

/**
 * DeepSeek's peak hours: Beijing time, Monday to Friday, 09:00–12:00 and 14:00–18:00.
 * Chinese public holidays are off-peak too, but they are not modelled here, so a holiday weekday
 * is priced at the peak rate (an overestimate).
 */
export function deepSeekPeak(date) {
  const beijing = new Date(new Date(date).getTime() + 8 * 3_600_000);
  const day = beijing.getUTCDay();
  if (day === 0 || day === 6) return false;
  const minutes = beijing.getUTCHours() * 60 + beijing.getUTCMinutes();
  return (minutes >= 540 && minutes < 720) || (minutes >= 840 && minutes < 1080);
}

/**
 * Price in yuan per million tokens for one call of `model` at `date`, or null when unknown.
 * `pricing` is ai_settings.pricing: { rate?: USD→CNY, models?: { [model]: { input, cached, output } } }.
 * An override is in yuan and replaces the built-in peak price; DeepSeek's off-peak discount still applies.
 */
export function priceAt(model, date, pricing) {
  const builtIn = BUILT_IN_PRICES[model];
  const override = pricing?.models?.[model];
  if (!builtIn && !override) return null;
  const rate = Number(pricing?.rate) > 0 ? Number(pricing.rate) : DEFAULT_USD_TO_CNY;
  const toCny = override || builtIn.currency === 'CNY' ? 1 : rate;
  const base = override ?? builtIn;
  const factor = builtIn?.offPeakFactor && !deepSeekPeak(date) ? builtIn.offPeakFactor : 1;
  return { input: base.input * toCny * factor, cached: base.cached * toCny * factor, output: base.output * toCny * factor };
}
