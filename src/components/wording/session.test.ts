import { describe, expect, it } from 'bun:test';
import { beatLine, lengthLine, measuresLine, tempoLine } from '@/components/wording/session';

describe('what the session panel says', () => {
  it('reads a tempo out in beats to the minute', () => {
    expect(tempoLine(60)).toBe('60 bpm');
  });

  it('reads a length out in measures', () => {
    expect(measuresLine(8)).toBe('8 mesures');
  });

  it('says what those measures come out to in notes', () => {
    expect(lengthLine(8)).toBe('32 notes');
  });

  it('follows the domain when the length changes', () => {
    expect(lengthLine(16)).toBe('64 notes');
  });
});

describe('what the session is beaten at', () => {
  it('gives the tempo when the metronome is on', () => {
    expect(beatLine(true, 90)).toBe('90 bpm');
  });

  it('says there is no tempo when it is off', () => {
    expect(beatLine(false, 90)).toBe('Sans tempo');
  });
});
