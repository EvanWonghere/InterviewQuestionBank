import { useEffect, useRef } from 'react';
import { usePetStore } from '@/store/petStore';
import { burstFrom, effectsEnabled, floatText } from '@/components/game/effects';
import { formatSpend } from '@/lib/aiSpend';

/**
 * Pops an AI answer's cost ("-¥0.0123") with a few coins from the element in `ref` — the floating pet,
 * or the tutor panel's avatar while the panel is open (only one of them is on screen).
 * `onQuiet(text)` runs instead when effects are off (quiet mode, reduced motion).
 */
export function useSpendFloat(ref, { onQuiet } = {}) {
  const event = usePetStore((s) => s.spendEvent);
  const seen = useRef(event?.key ?? 0);
  const quietRef = useRef(onQuiet);
  useEffect(() => { quietRef.current = onQuiet; }, [onQuiet]);

  useEffect(() => {
    if (!event || event.key === seen.current) return;
    seen.current = event.key;
    const el = ref.current;
    if (!el || !el.isConnected) return;
    const text = formatSpend(event.usage);
    if (!text) return;
    if (effectsEnabled()) {
      floatText(el, text, 'coin');
      burstFrom(el, { kind: 'coin' });
    } else {
      quietRef.current?.(text);
    }
  }, [event, ref]);
}
