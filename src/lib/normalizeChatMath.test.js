import { describe, expect, it } from 'vitest';
import { normalizeChatMath } from './normalizeChatMath';

describe('normalizeChatMath', () => {
  it('rewrites latex fences and backslash delimiters outside code', () => {
    const source = [
      '见 \\(E=mc^2\\)',
      '',
      '\\[',
      'a+b',
      '\\]',
      '',
      '```latex',
      '\\frac{1}{2}',
      '```',
      '',
      '```cpp',
      'int x = 1; // not \\[math\\]',
      '```',
    ].join('\n');
    const out = normalizeChatMath(source);
    expect(out).toContain('$E=mc^2$');
    expect(out).toContain('$$\n' + 'a+b' + '\n$$');
    expect(out).toContain('```math\n\\frac{1}{2}\n```');
    expect(out).toContain('```cpp\nint x = 1; // not \\[math\\]\n```');
  });

  it('still rewrites math before an unclosed fence', () => {
    expect(normalizeChatMath('before \\(x\\)\n```tex\n\\alpha')).toBe('before $x$\n```tex\n\\alpha');
  });
});
