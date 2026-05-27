import { useEffect, useRef, useState } from 'react';

const VOWEL_MAP = [
  [/a|ah|ar|aw|al|au|o(?=[^u])/i, 'A'],
  [/e|ea|ee|ei|ey|ai/i, 'E'],
  [/i|ee|y(?=[aeiou])/i, 'I'],
  [/o|oa|oo|ow|ou|oi/i, 'O'],
  [/u|ue|oo|ew|ou/i, 'U'],
];

function charToViseme(ch, next = '') {
  const pair = (ch + next).toLowerCase();
  if (/[mbp]/.test(ch)) return 'M';
  if (/[fv]/.test(ch)) return 'F';
  if (/[lr]/.test(ch)) return 'L';
  if (/[w]/.test(ch)) return 'O';
  if (/[.,!?;:\s]/.test(ch)) return 'rest';
  for (const [re, viseme] of VOWEL_MAP) {
    if (re.test(pair) || re.test(ch)) return viseme;
  }
  return 'E';
}

export function textToVisemeTimeline(text, msPerStep = 95) {
  const cleaned = (text || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return [{ shape: 'rest', duration: 400 }];

  const steps = [];
  for (let i = 0; i < cleaned.length; i += 1) {
    const ch = cleaned[i];
    if (/[.,!?;:]/.test(ch)) {
      steps.push({ shape: 'rest', duration: msPerStep * 1.4 });
      continue;
    }
    if (/\s/.test(ch)) {
      steps.push({ shape: 'rest', duration: msPerStep * 0.7 });
      continue;
    }
    steps.push({ shape: charToViseme(ch, cleaned[i + 1] || ''), duration: msPerStep });
  }
  steps.push({ shape: 'rest', duration: 280 });
  return steps;
}

export function useMouthTimeline(isSpeaking, text) {
  const [mouthShape, setMouthShape] = useState('rest');
  const timerRef = useRef(null);
  const indexRef = useRef(0);
  const timelineRef = useRef([]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isSpeaking || !text) {
      setMouthShape('rest');
      return undefined;
    }

    timelineRef.current = textToVisemeTimeline(text);
    indexRef.current = 0;

    const tick = () => {
      const step = timelineRef.current[indexRef.current];
      if (!step) {
        setMouthShape('rest');
        return;
      }
      setMouthShape(step.shape);
      indexRef.current += 1;
      timerRef.current = setTimeout(tick, step.duration);
    };

    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isSpeaking, text]);

  return mouthShape;
}
