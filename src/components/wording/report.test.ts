import { describe, expect, it } from 'bun:test';

import {
  missLine,
  missShare,
  nextLine,
  playedLine,
  verdictLine,
} from '@/components/wording/report';

describe('what the report screen says', () => {
  it('praises a clean reading, approves a passed one, and replays the rest', () => {
    expect(verdictLine(90)).toBe('Très belle lecture.');
    expect(verdictLine(89)).toBe('Bon travail.');
    expect(verdictLine(74)).toBe('On la reprend.');
  });

  it('puts the pass mark on the passing side', () => {
    expect(verdictLine(75)).toBe('Bon travail.');
  });

  it('names the study played, or says it was not one', () => {
    expect(playedLine('treble', 3, false)).toBe('Étude 3 · Andante');
    expect(playedLine('treble', 3, true)).toBe('Révision ciblée');
    expect(playedLine('bass', 3, false)).toBe('Étude 3 · Mezzo-piano');
  });

  it('writes one mistake in the singular', () => {
    expect(missLine(1)).toBe('1 erreur');
    expect(missLine(3)).toBe('3 erreurs');
  });

  it('fills a missed note\u2019s bar at three mistakes, and never past it', () => {
    expect(missShare(1)).toBeCloseTo(1 / 3);
    expect(missShare(3)).toBe(1);
    expect(missShare(9)).toBe(1);
  });

  it('names the study a session opened, and offers another session when it opened none', () => {
    expect(nextLine('treble', 4)).toBe('Étude 4 · Moderato');
    expect(nextLine('bass', 4)).toBe('Étude 4 · Mezzo-forte');
    expect(nextLine('treble', undefined)).toBe('Séance suivante');
  });
});
