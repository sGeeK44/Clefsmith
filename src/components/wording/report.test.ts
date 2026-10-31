import { describe, expect, it } from 'bun:test';

import { missLine, nextLine, playedLine, verdictLine } from '@/components/wording/report';

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
    expect(playedLine('treble', 3, false, 'syllabic')).toBe('Étude 3 · La, Si');
    expect(playedLine('treble', 3, true, 'syllabic')).toBe('Révision ciblée');
    expect(playedLine('bass', 3, false, 'syllabic')).toBe('Étude 3 · Mi, Fa');
  });

  it('writes one mistake in the singular', () => {
    expect(missLine(1)).toBe('1 erreur');
    expect(missLine(3)).toBe('3 erreurs');
  });

  it('names the study a session opened, and offers another session when it opened none', () => {
    expect(nextLine(4)).toBe('Étude 4 · Moderato');
    expect(nextLine(undefined)).toBe('Séance suivante');
  });
});
