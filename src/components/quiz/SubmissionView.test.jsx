import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SubmissionView from './SubmissionView';

afterEach(cleanup);
const options = [{ id: 'a', text: '选项A' }, { id: 'b', text: '选项B' }];

describe('SubmissionView', () => {
  it('keeps text answers verbatim, including code indentation', () => {
    const { container } = render(<SubmissionView question={{ type: 'algorithm' }} submission={{ answerMd: 'if (x) {\n    run();\n}' }} />);
    expect(container.querySelector('pre').textContent).toBe('if (x) {\n    run();\n}');
  });
  it('marks chosen options and fill-in answers', () => {
    render(<SubmissionView question={{ type: 'multiple_choice', payload: { options } }} submission={{ optionIds: ['b'] }} />);
    expect(screen.getByText('选项B').closest('li')).toHaveClass('is-chosen');
    expect(screen.getByText('选项A').closest('li')).not.toHaveClass('is-chosen');
    cleanup();
    render(<SubmissionView question={{ type: 'fill_blank', payload: { blanks: [{ id: 'x', label: '空1' }, { id: 'y', label: '空2' }] } }} submission={{ answers: { x: 'OnDisable' } }} />);
    expect(screen.getByText('OnDisable')).toBeVisible();
    expect(screen.getByText('（未填写）')).toBeVisible();
  });
  it('handles empty submissions', () => {
    render(<SubmissionView question={{ type: 'short_answer' }} submission={{}} />);
    expect(screen.getByText('（没有记录作答内容）')).toBeVisible();
  });
});
