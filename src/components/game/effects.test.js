import { afterEach, describe, expect, it } from 'vitest';
import { floatText, setEffectsQuiet } from './effects';

afterEach(() => { document.body.innerHTML = ''; setEffectsQuiet(false); });

describe('floatText', () => {
  it('draws inside an open dialog so the tutor panel does not cover it', () => {
    document.body.innerHTML = '<dialog open><span id="avatar"></span></dialog><span id="pet"></span>';
    floatText(document.getElementById('avatar'), '-¥0.0012', 'coin');
    expect(document.querySelector('dialog .game-float-text.is-coin')).toHaveTextContent('-¥0.0012');
    floatText(document.getElementById('pet'), '-¥0.0020', 'coin');
    expect(document.querySelector('body > .game-float-text')).toHaveTextContent('-¥0.0020');
  });

  it('does nothing in quiet mode', () => {
    document.body.innerHTML = '<span id="pet"></span>';
    setEffectsQuiet(true);
    floatText(document.getElementById('pet'), '-¥1', 'coin');
    expect(document.querySelector('.game-float-text')).toBeNull();
  });
});
