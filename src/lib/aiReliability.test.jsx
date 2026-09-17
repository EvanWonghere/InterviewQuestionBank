import { it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIDraft, clearAIDrafts } from './aiDrafts';
import { modelFailure } from '../../supabase/functions/ai-tutor/modelErrors.js';
import { modelOptions } from '../../supabase/functions/ai-tutor/modelOptions.js';

it('disables the implicit thinking budget only for the official DeepSeek API', () => {
 expect(modelOptions('https://api.deepseek.com/chat/completions')).toEqual({ thinking: { type: 'disabled' } });
 expect(modelOptions('https://api.openai.com/v1/chat/completions')).toEqual({});
 expect(modelOptions('https://api.deepseek.com.example.org/chat/completions')).toEqual({});
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
