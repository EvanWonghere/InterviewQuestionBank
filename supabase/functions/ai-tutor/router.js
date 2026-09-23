import { endpoint } from './core.js';
import { callRoutedModel } from './modelClient.js';
import { decidePedagogy, insertPedagogyNote, pedagogyNote } from './pedagogy.js';

export const CREDIT_POLICIES = ['aggressive', 'balanced', 'conservative'];
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-flash';
const DEFAULT_LUNA = 'gpt-6-luna';
const DEFAULT_SOL = 'gpt-6-sol';
const DEFAULT_DEEPSEEK_BASE = 'https://api.deepseek.com/v1';
const DEFAULT_OPENAI_BASE = 'https://api.openai.com/v1';

export function normalizePolicy(value) {
  return CREDIT_POLICIES.includes(value) ? value : 'aggressive';
}

/** A saved admin choice wins. Anything else uses the server secret, which is aggressive when unset. */
export function effectivePolicy(saved, fallback) {
  return CREDIT_POLICIES.includes(saved) ? saved : normalizePolicy(fallback);
}

export function providerCatalog(env) {
  const allowed = env('AI_ALLOWED_ORIGINS') || '';
  const deepseekBase = env('DEEPSEEK_BASE_URL') || DEFAULT_DEEPSEEK_BASE;
  const openaiBase = env('OPENAI_BASE_URL') || DEFAULT_OPENAI_BASE;
  const openaiKey = env('OPENAI_API_KEY') || '';
  const openaiUrl = endpoint(openaiBase, allowed);
  return {
    policy: normalizePolicy(env('AI_CREDIT_POLICY')),
    deepseek: {
      provider: 'deepseek',
      model: env('DEEPSEEK_MODEL') || DEFAULT_DEEPSEEK_MODEL,
      apiKey: env('AI_API_KEY') || '',
      url: endpoint(deepseekBase, allowed),
    },
    luna: {
      provider: 'openai',
      model: env('OPENAI_MODEL_DEFAULT') || DEFAULT_LUNA,
      apiKey: openaiKey,
      url: openaiUrl,
    },
    sol: {
      provider: 'openai',
      model: env('OPENAI_MODEL_REASONING') || DEFAULT_SOL,
      apiKey: openaiKey,
      url: openaiUrl,
    },
    jev: {
      apiKey: env('TYPESAFE_API_KEY') || '',
      base: env('TYPESAFE_API_BASE') || 'https://api.typesafe.ai',
    },
  };
}

export function publicRouting(env) {
  return {
    creditPolicy: normalizePolicy(env('AI_CREDIT_POLICY')),
    models: {
      fast: env('DEEPSEEK_MODEL') || DEFAULT_DEEPSEEK_MODEL,
      default: env('OPENAI_MODEL_DEFAULT') || DEFAULT_LUNA,
      reasoning: env('OPENAI_MODEL_REASONING') || DEFAULT_SOL,
    },
    keys: {
      deepseek: Boolean(env('AI_API_KEY')),
      openai: Boolean(env('OPENAI_API_KEY')),
      jev: Boolean(env('TYPESAFE_API_KEY')),
    },
  };
}

/**
 * Hard reasoning never stays on DeepSeek just to spend credits.
 * Batch and summary tasks stay on DeepSeek unless the turn is already judged hard.
 */
export function selectRoute({ policy = 'aggressive', task, difficulty = 'medium', needsStrongReasoning = false }) {
  const mode = normalizePolicy(policy);
  if (difficulty === 'hard' || needsStrongReasoning) return { tier: 'reasoning', slot: 'sol' };
  if (task === 'batch' || task === 'summary') return { tier: 'fast', slot: 'deepseek' };
  if (mode === 'conservative') return { tier: 'default', slot: 'luna' };
  if (mode === 'balanced') return difficulty === 'easy' ? { tier: 'fast', slot: 'deepseek' } : { tier: 'default', slot: 'luna' };
  return { tier: 'fast', slot: 'deepseek' };
}

export function resolveTarget(route, catalog) {
  if (route.slot === 'sol') return catalog.sol;
  if (route.slot === 'luna') return catalog.luna;
  if (route.slot === 'deepseek') return catalog.deepseek;
  throw new Error('unknown_route');
}

export function taskForAction(action) {
  switch (action) {
    case 'evaluate': return 'evaluation';
    case 'interview-report':
    case 'weakness-report': return 'summary';
    case 'draft-question':
    case 'draft-weakness-questions': return 'batch';
    default: {
      const unreachable = action;
      throw new Error(`unknown_task_${unreachable}`);
    }
  }
}

function assertKeys(catalog, target) {
  if (!catalog.deepseek.apiKey) throw new Error('missing_deepseek_key');
  if (target.provider === 'openai' && !target.apiKey) throw new Error('missing_openai_key');
}

export async function planInteractiveTurn({ env, policy = undefined, phase, message, subject, recent, fetchImpl = fetch }) {
  const catalog = providerCatalog(env);
  if (!catalog.deepseek.apiKey) throw new Error('missing_deepseek_key');
  const decision = await decidePedagogy({ jev: catalog.jev, phase, message, subject, recent, fetchImpl });
  const route = selectRoute({
    policy: effectivePolicy(policy, catalog.policy),
    task: 'interactive',
    difficulty: decision.difficulty,
    needsStrongReasoning: decision.needsStrongReasoning,
  });
  const target = resolveTarget(route, catalog);
  assertKeys(catalog, target);
  return { decision, route, target, fallback: target.provider === 'openai' ? catalog.deepseek : null };
}

export function planTaskTurn({ env, action, policy = undefined }) {
  const catalog = providerCatalog(env);
  const route = selectRoute({ policy: effectivePolicy(policy, catalog.policy), task: taskForAction(action), difficulty: 'medium', needsStrongReasoning: false });
  const target = resolveTarget(route, catalog);
  assertKeys(catalog, target);
  return { catalog, route, target, fallback: target.provider === 'openai' ? catalog.deepseek : null };
}

export async function completeTutorText({ env, policy = undefined, phase, message, subject, recent, messages, effort, fetchImpl = fetch }) {
  const plan = await planInteractiveTurn({ env, policy, phase, message, subject, recent, fetchImpl });
  const noted = insertPedagogyNote(messages, pedagogyNote(plan.decision.pedagogyAction, phase));
  const execution = { model: plan.target.model, provider: plan.target.provider, tier: plan.route.tier, fallbackUsed: false };
  const body = await callRoutedModel({
    target: plan.target,
    fallback: plan.fallback,
    messages: noted,
    effort,
    fetchImpl,
    onFallback() {
      execution.model = plan.fallback.model;
      execution.provider = plan.fallback.provider;
      execution.fallbackUsed = true;
    },
  });
  return { body, decision: plan.decision, execution };
}

export function routedCall({ target, fallback, effort }) {
  /** @type {{ model: string, provider: string, tier: string | null, fallbackUsed: boolean }} */
  const execution = { model: target.model, provider: target.provider, tier: null, fallbackUsed: false };
  const callModelForTask = (messages, options = {}) => callRoutedModel({
    target,
    fallback,
    messages,
    effort,
    json: true,
    budgetScale: options.budgetScale ?? 1,
    onFallback() {
      execution.model = fallback.model;
      execution.provider = fallback.provider;
      execution.fallbackUsed = true;
    },
  });
  return { execution, callModel: callModelForTask };
}
