import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HandbookPage from './HandbookPage';
import { LEVELS, RATING_DAMAGE, ACHIEVEMENTS } from '@/lib/gameRules';

const renderPage = () => render(<MemoryRouter><HandbookPage /></MemoryRouter>);

describe('HandbookPage', () => {
  it('renders all seven section headings', () => {
    renderPage();
    const headings = [
      '关卡与星星', '心、连击与提示卡', '巡检与连签', '章末 Boss 与弱点副本', '经验与职级', '小芽', '成就',
    ];
    headings.forEach((title) => {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    });
  });

  it('shows every level name in the level table', () => {
    renderPage();
    LEVELS.forEach((level) => {
      expect(screen.getByText(level.name)).toBeInTheDocument();
    });
  });

  it('shows the boss self-rating damage values', () => {
    renderPage();
    Object.values(RATING_DAMAGE).forEach((damage) => {
      expect(screen.getAllByText(String(damage)).length).toBeGreaterThan(0);
    });
  });

  it('lists every achievement name', () => {
    renderPage();
    ACHIEVEMENTS.forEach((a) => {
      expect(screen.getByText(a.name)).toBeInTheDocument();
    });
  });
});
