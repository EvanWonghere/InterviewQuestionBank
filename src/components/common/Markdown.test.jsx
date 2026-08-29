import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Markdown from './Markdown';

describe('Markdown', () => {
  it('renders GFM and math content in the question preview', () => {
    const { container } = render(
      <Markdown content={'| 知识点 | 状态 |\n| --- | --- |\n| RLS | 掌握 |\n\n公式：$E = mc^2$'} />,
    );

    expect(screen.getByRole('table')).toHaveTextContent('RLS');
    expect(container.querySelector('.katex')).toHaveTextContent('E=mc2');
  });
});
