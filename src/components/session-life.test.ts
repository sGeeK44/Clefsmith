import { describe, expect, it } from 'bun:test';

import { sessionLife } from '@/components/session-life';

const READING = { rhythmic: true, dealt: true, paused: false, appState: 'active' };

describe('what a session should be doing', () => {
  it('beats and listens while the learner is reading it', () => {
    expect(sessionLife(READING)).toEqual({ beats: true, listens: true });
  });

  /**
   * The audible beat and the counted one run under one condition rather than
   * two: a metronome still clicking over a session nothing is counting is the
   * shape every one of these failures took.
   */
  it('stops beating and lets go of the microphone when the session is paused', () => {
    expect(sessionLife({ ...READING, paused: true })).toEqual({ beats: false, listens: false });
  });

  /**
   * Measured on an iPhone 16: the session was sent to the background twelve
   * seconds in and the speaker went on clicking to the end of the recording,
   * microphone still held. The same session on an Android stopped on the
   * instant, so nothing but this rule was keeping it quiet there.
   */
  it('stops beating and lets go of the microphone when the learner leaves', () => {
    expect(sessionLife({ ...READING, appState: 'background' })).toEqual({
      beats: false,
      listens: false,
    });
  });

  /** React Native's own type for the value it hands out on mount admits nothing at all. */
  it('stops when the application will not say where it is', () => {
    expect(sessionLife({ ...READING, appState: undefined })).toEqual({
      beats: false,
      listens: false,
    });
  });

  /** Half there is not there: the control centre pulled over the screen is a session left. */
  it('stops while the application is only half in front of the learner', () => {
    expect(sessionLife({ ...READING, appState: 'inactive' })).toEqual({
      beats: false,
      listens: false,
    });
  });

  it('listens without beating a session read at the learner’s own pace', () => {
    expect(sessionLife({ ...READING, rhythmic: false })).toEqual({ beats: false, listens: true });
  });

  /** A beat counted against a staff nobody has seen yet is counted against nothing. */
  it('waits for the notes before it beats, and listens meanwhile', () => {
    expect(sessionLife({ ...READING, dealt: false })).toEqual({ beats: false, listens: true });
  });
});
