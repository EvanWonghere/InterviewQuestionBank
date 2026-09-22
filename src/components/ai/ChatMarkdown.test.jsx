import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { ChatMarkdown } from './ChatMarkdown';

const mermaid = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}));

vi.mock('@/lib/loadMermaid', () => ({
  loadMermaid: async () => mermaid,
}));

afterEach(() => {
  cleanup();
  mermaid.initialize.mockReset();
  mermaid.render.mockReset();
});

describe('ChatMarkdown', () => {
  it('does not execute HTML or load remote/asset images', () => {
    const { container } = render(<ChatMarkdown content={'<script>alert(1)</script>\n\n![image](https://evil.test/track.png)\n\n![private](asset://123)\n\n[bad](javascript:alert(1))\n\n**safe** $E=mc^2$'} />);
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toContain('href="javascript:');
    expect(screen.getByText('safe')).toBeVisible();
    expect(container.querySelector('.katex')).not.toBeNull();
  });

  it('renders dollar, display, math, latex, and backslash formulas', () => {
    const { container } = render(<ChatMarkdown content={[
      '$a+b$',
      '',
      '$$\\frac{1}{2}$$',
      '',
      '```math',
      'c=d',
      '```',
      '',
      '```latex',
      'e=f',
      '```',
      '',
      '\\[g=h\\]',
    ].join('\n')} />);
    expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(4);
  });

  it('keeps surrounding text when a formula is invalid', () => {
    const { container } = render(<ChatMarkdown content={'前后文 $\\notacommand{}$ 仍在'} />);
    expect(container).toHaveTextContent('前后文');
    expect(container).toHaveTextContent('仍在');
  });

  it('highlights a C# fence', () => {
    const { container } = render(<ChatMarkdown content={'```csharp\nclass Box { int x = 1; }\n```'} />);
    expect(container.querySelector('code.hljs, code.language-csharp')).not.toBeNull();
    expect(container.querySelector('.hljs-keyword, .hljs-type, .hljs-number')).not.toBeNull();
  });

  it('keeps mermaid source while streaming and falls back after a failed draw', async () => {
    mermaid.render.mockRejectedValue(new Error('bad diagram'));
    const source = '```mermaid\ngraph TD; A-->B;\n```';
    const first = render(<ChatMarkdown content={source} streaming />);
    expect(first.container).toHaveTextContent('graph TD; A-->B;');
    expect(mermaid.render).not.toHaveBeenCalled();
    first.unmount();
    const { container } = render(<ChatMarkdown content={source} />);
    await waitFor(() => {
      expect(container).toHaveTextContent('无法绘制这张图');
    });
    expect(container).toHaveTextContent('graph TD; A-->B;');
  });
});
