import { describe, expect, it } from 'bun:test';

import type { Notation } from '@/domain/notation/naming';
import type { Degree } from '@/domain/notation/pitch';
import { createVoskAnswerSource } from '@/infrastructure/vosk-answer-source';
import type { VoskModule } from '@/infrastructure/vosk-speech-recognizer';

/**
 * Stands in for the native module. It records what it was asked to do and hands
 * back a way to make it say something, which is the only thing a microphone
 * does that a test can stage.
 */
function fakeVosk() {
  const listeners: Record<string, (value: string) => void> = {};
  const started: { grammar: string[]; pushAudio: boolean }[] = [];
  const loaded: string[] = [];
  const closed: string[] = [];

  const on = (event: string) => (callback: (value: string) => void) => {
    listeners[event] = callback;

    return {
      remove: () => {
        closed.push(event);
        delete listeners[event];
      },
    };
  };

  const vosk: VoskModule = {
    loadModel: async (path) => {
      loaded.push(path);
    },
    start: async (options) => {
      started.push(options);
    },
    acceptWaveform: () => undefined,
    finish: () => undefined,
    stop: () => closed.push('stop'),
    unload: () => closed.push('unload'),
    onResult: on('onResult'),
    onPartialResult: on('onPartialResult'),
    onFinalResult: on('onFinalResult'),
    onError: on('onError'),
  };

  return {
    vosk,
    started,
    loaded,
    closed,
    /** The decoder settling on a word, which is what a final result is. */
    settleOn: (text: string) => listeners.onResult?.(text),
    hearPartial: (text: string) => listeners.onPartialResult?.(text),
  };
}

/** A clock the test moves itself, so an instant can be asserted exactly. */
function clockAt() {
  let current = 0;

  return {
    now: () => current,
    sleepUntil: async () => undefined,
    set: (instant: number) => {
      current = instant;
    },
  };
}

function sourceUnderTest() {
  const native = fakeVosk();
  const clock = clockAt();
  const heard: Degree[] = [];
  const startedAt: number[] = [];

  return {
    ...native,
    clock,
    heard,
    startedAt,
    listen: (notation: Notation = 'syllabic') =>
      createVoskAnswerSource(native.vosk, 'model-fr', clock).listen(notation, (degree, began) => {
        heard.push(degree);
        startedAt.push(began);
      }),
  };
}

describe('the answers of a session, heard', () => {
  it('opens the microphone on the model it was given', async () => {
    const { loaded, started, listen } = sourceUnderTest();

    await listen();

    expect(loaded).toEqual(['model-fr']);
    expect(started).toEqual([
      { grammar: ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si', '[unk]'], pushAudio: false },
    ]);
  });

  it('listens for the names of the notation it was handed', async () => {
    const { started, listen } = sourceUnderTest();

    await listen('letters');

    expect(started[0]?.grammar).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B', '[unk]']);
  });

  it('reports the degree behind the word the learner said', async () => {
    const { heard, settleOn, listen } = sourceUnderTest();

    await listen();
    settleOn('sol');

    expect(heard).toEqual(['g']);
  });

  it('reads the word in the notation the session opened on', async () => {
    const { heard, settleOn, listen } = sourceUnderTest();

    await listen('letters');
    settleOn('G');

    expect(heard).toEqual(['g']);
  });

  it('reports nothing when the decoder settles on a word that is not a note', async () => {
    const { heard, settleOn, listen } = sourceUnderTest();

    await listen();
    settleOn('[unk]');

    expect(heard).toStrictEqual([]);
  });

  it('answers for the learner only once they have finished saying the word', async () => {
    const { heard, hearPartial, listen } = sourceUnderTest();

    await listen();
    hearPartial('do');

    expect(heard).toStrictEqual([]);
  });

  it('lets go of the microphone when the listening stops', async () => {
    const { closed, listen } = sourceUnderTest();

    const silence = await listen();
    await silence();

    expect(closed).toEqual(['onPartialResult', 'onResult', 'stop', 'unload']);
  });

  it('hears nothing more once it has been stopped', async () => {
    const { heard, settleOn, listen } = sourceUnderTest();

    const silence = await listen();
    await silence();
    settleOn('sol');

    expect(heard).toStrictEqual([]);
  });

  it('times an answer from when the learner started speaking, not from when it settled', async () => {
    const { clock, hearPartial, settleOn, startedAt, listen } = sourceUnderTest();
    await listen();

    clock.set(1200);
    hearPartial('d');
    clock.set(1900);
    settleOn('do');

    expect(startedAt).toEqual([1200]);
  });

  it('takes the first partial of an utterance and not the ones that refine it', async () => {
    const { clock, hearPartial, settleOn, startedAt, listen } = sourceUnderTest();
    await listen();

    clock.set(1200);
    hearPartial('d');
    clock.set(1500);
    hearPartial('do');
    clock.set(1900);
    settleOn('do');

    expect(startedAt).toEqual([1200]);
  });

  it('passes over an empty partial: the decoder has heard nothing, not started a word', async () => {
    const { clock, hearPartial, settleOn, startedAt, listen } = sourceUnderTest();
    await listen();

    clock.set(900);
    hearPartial('');
    clock.set(1200);
    hearPartial('d');
    clock.set(1900);
    settleOn('do');

    expect(startedAt).toEqual([1200]);
  });

  it('starts each utterance over, so the second is not timed from the first', async () => {
    const { clock, hearPartial, settleOn, startedAt, listen } = sourceUnderTest();
    await listen();

    clock.set(1200);
    hearPartial('d');
    clock.set(1900);
    settleOn('do');
    clock.set(3100);
    hearPartial('m');
    clock.set(3600);
    settleOn('mi');

    expect(startedAt).toEqual([1200, 3100]);
  });

  it('falls back on the settling instant when no partial was heard at all', async () => {
    const { clock, settleOn, startedAt, listen } = sourceUnderTest();
    await listen();

    clock.set(1900);
    settleOn('do');

    expect(startedAt).toEqual([1900]);
  });
});
