/**
 * The four exercises of the desk, in the mockup's order and with its glyphs.
 *
 * The last two have nothing behind them yet. They are drawn all the same: a desk
 * that only showed what is ready would not say what the application is for.
 */
export const MODES = [
  { id: 'reading', label: 'Lecture de notes', glyph: '♩', open: true, timed: false },
  { id: 'rhythmic-reading', label: 'Lecture rythmée', glyph: '♫', open: true, timed: true },
  { id: 'rhythm', label: 'Rythme seul', glyph: '♪', open: false, timed: false },
  { id: 'dictation', label: 'Dictée musicale', glyph: '♬', open: false, timed: false },
] as const;

export type Mode = (typeof MODES)[number];

/** The reading the parcours was entered through, or plain reading when the route says nothing. */
export function modeOf(id: string | undefined): Mode {
  return MODES.find((mode) => mode.id === id) ?? (MODES[0] as Mode);
}
