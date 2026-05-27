const MOUTHS = {
  rest: 'M72 118 Q80 124 88 118',
  A: 'M68 116 Q80 128 92 116',
  E: 'M70 118 Q80 122 90 118',
  I: 'M74 118 L86 118',
  O: 'M70 118 Q80 126 90 118 Q80 114 70 118',
  U: 'M72 118 Q80 124 88 118 Q80 116 72 118',
  M: 'M72 118 Q80 114 88 118',
  F: 'M70 116 L90 116 M74 120 L86 120',
  L: 'M74 118 Q80 122 86 118',
};

export default function AvatarEffigy({ mouthShape = 'rest', isListening, isSpeaking }) {
  const mouth = MOUTHS[mouthShape] || MOUTHS.rest;
  const stateClass = isSpeaking ? 'effigy--speak' : isListening ? 'effigy--listen' : '';

  return (
    <div className={`effigy ${stateClass}`} aria-hidden>
      <svg viewBox="0 0 160 180" className="effigy-svg">
        <defs>
          <linearGradient id="effigyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a962" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8a7350" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <ellipse cx="80" cy="92" rx="52" ry="58" fill="url(#effigyGlow)" />
        <ellipse cx="80" cy="88" rx="38" ry="44" fill="#151515" stroke="#c9a962" strokeWidth="1.2" opacity="0.9" />
        <path d="M42 88 Q80 52 118 88" fill="none" stroke="#c9a962" strokeWidth="1" opacity="0.5" />
        <circle cx="66" cy="82" r="3" fill="#e8e4dc" opacity="0.85" />
        <circle cx="94" cy="82" r="3" fill="#e8e4dc" opacity="0.85" />
        <path d={mouth} fill="none" stroke="#c9a962" strokeWidth="2" strokeLinecap="round" />
        <path d="M58 108 Q80 118 102 108" fill="none" stroke="#c9a962" strokeWidth="0.8" opacity="0.35" />
        <rect x="52" y="130" width="56" height="36" rx="8" fill="#111" stroke="#333" strokeWidth="0.8" />
        <line x1="80" y1="130" x2="80" y2="166" stroke="#333" strokeWidth="0.6" />
      </svg>
      <span className="effigy-caption">Kandarp</span>
    </div>
  );
}
