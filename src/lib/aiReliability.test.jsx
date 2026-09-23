import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIDraft, clearAIDrafts } from './aiDrafts';
import { modelFailure } from '../../supabase/functions/ai-tutor/modelErrors.js';
import { modelOptions, outputBudget, tokenLimit } from '../../supabase/functions/ai-tutor/modelOptions.js';
import { callModel } from '../../supabase/functions/ai-tutor/modelClient.js';

const deepseek = 'https://api.deepseek.com/chat/completions';
it('defaults the official DeepSeek API to high thinking and sends provider fields only there', () => {
 expect(modelOptions(deepseek)).toEqual({ thinking: { type: 'enabled' }, reasoning_effort: 'high' });
 expect(modelOptions(deepseek, { effort: 'max', json: true })).toEqual({ thinking: { type: 'enabled' }, reasoning_effort: 'max', response_format: { type: 'json_object' } });
 expect(modelOptions(deepseek, { effort: 'none' })).toEqual({ thinking: { type: 'disabled' } });
 expect(modelOptions(deepseek, { effort: 'bogus' })).toMatchObject({ reasoning_effort: 'high' });
 expect(modelOptions('https://api.openai.com/v1/chat/completions', { json: true })).toEqual({ reasoning_effort: 'high', response_format: { type: 'json_object' } });
 expect(modelOptions('https://api.openai.com/v1/chat/completions', { effort: 'none' })).toEqual({ reasoning_effort: 'none' });
 expect(modelOptions('https://api.openai.com/v1/chat/completions')).not.toHaveProperty('thinking');
 expect(modelOptions('https://api.deepseek.com.example.org/chat/completions', { json: true })).toEqual({});
});
it('gives thinking requests room for reasoning tokens', () => {
 expect(outputBudget(deepseek, 'high')).toBe(8192);
 expect(outputBudget(deepseek, 'none')).toBe(4096);
 expect(outputBudget('https://api.openai.com/v1/chat/completions', 'high')).toBe(8192);
 expect(outputBudget('https://api.openai.com/v1/chat/completions', 'none')).toBe(4096);
 expect(tokenLimit('https://api.openai.com/v1/chat/completions', 'high')).toEqual({ max_completion_tokens: 8192 });
 expect(tokenLimit(deepseek, 'high')).toEqual({ max_tokens: 8192 });
});

it('restores a draft after closing and reopening without leaking to another owner',()=>{
 clearAIDrafts();
 const first=renderHook(()=>useAIDraft('u:q:chat'));
 act(()=>first.result.current[1]('unfinished followup'));first.unmount();
 const second=renderHook(()=>useAIDraft('u:q:chat'));
 expect(second.result.current[0]).toBe('unfinished followup');
 const other=renderHook(()=>useAIDraft('v:q:chat'));
 expect(other.result.current[0]).toBe('');
 act(()=>second.result.current[1](''));second.unmount();
 expect(renderHook(()=>useAIDraft('u:q:chat')).result.current[0]).toBe('');
});
it('distinguishes timeouts, balance, throttling and format without echoing secrets',()=>{
 expect(modelFailure(new DOMException('secret url','TimeoutError')).code).toBe('model_timeout');
 expect(modelFailure(new Error('upstream_http_402')).error).toContain('余额');
 expect(modelFailure(new Error('upstream_http_429')).error).toContain('限流');
 expect(modelFailure(new Error('upstream_length')).error).toContain('长度上限');
 expect(JSON.stringify(modelFailure(new Error('https://secret?api_key=private')))).not.toContain('private');
});

describe('callModel', () => {
 const reply = (status, body) => ({ status, ok: status < 300, json: async () => body });
 const ok = (content, finish_reason = 'stop') => reply(200, { choices: [{ message: { content }, finish_reason }] });
 const call = (fetchImpl, extra = {}) => callModel({ url: deepseek, apiKey: 'k', model: 'deepseek-flash', messages: [], effort: 'high', json: true, fetchImpl, ...extra });

 it('sends thinking, JSON Output and the budget in one request', async () => {
  const fetchImpl = vi.fn(async () => ok('{"score":1}'));
  await expect(call(fetchImpl)).resolves.toBe('{"score":1}');
  const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
  expect(body).toMatchObject({ max_tokens: 8192, stream: false, thinking: { type: 'enabled' }, reasoning_effort: 'high', response_format: { type: 'json_object' } });
 });
 it('retries once without JSON Output only when the request is rejected', async () => {
  const fetchImpl = vi.fn().mockResolvedValueOnce(reply(400, {})).mockResolvedValueOnce(ok('{}'));
  await expect(call(fetchImpl)).resolves.toBe('{}');
  expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).not.toHaveProperty('response_format');
  const failing = vi.fn(async () => reply(500, {}));
  await expect(call(failing)).rejects.toThrow('upstream_http_500');
  expect(failing).toHaveBeenCalledTimes(1);
  const plain = vi.fn(async () => reply(400, {}));
  await expect(call(plain, { json: false })).rejects.toThrow('upstream_http_400');
  expect(plain).toHaveBeenCalledTimes(1);
 });
 it('maps truncation, overload and empty JSON content', async () => {
  await expect(call(async () => ok('{"sc', 'length'))).rejects.toThrow('upstream_length');
  await expect(call(async () => ok('', 'insufficient_system_resource'))).rejects.toThrow('upstream_busy');
  await expect(call(async () => ok('  '))).rejects.toThrow('upstream_format');
  expect(modelFailure(new Error('upstream_busy')).code).toBe('model_busy');
 });
});
