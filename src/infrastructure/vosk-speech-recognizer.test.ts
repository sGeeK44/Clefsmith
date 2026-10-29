import { describe, expect, it } from 'bun:test';
import { virtualClock } from '#test/speech-bench';
import type { Recognition } from '@/domain/speech-recognizer';
import {
  createVoskSpeechRecognizer,
  encodeBase64Pcm,
  type VoskModule,
} from '@/infrastructure/vosk-speech-recognizer';

/**
 * Stands in for the native module, and only answers the way it does: a result
 * arrives when the decoder settles on its own, and `finish` always answers —
 * with what is left, which after a settled utterance is an empty string.
 */
function fakeVosk() {
  const listeners: Record<string, (value: string) => void> = {};
  const started: { grammar: string[]; pushAudio: boolean }[] = [];
  const fed: string[] = [];
  let pending = '';

  const on = (event: string) => (callback: (value: string) => void) => {
    listeners[event] = callback;

    return { remove: () => delete listeners[event] };
  };

  const vosk: VoskModule = {
    loadModel: async () => undefined,
    start: async (options) => {
      started.push(options);
    },
    acceptWaveform: (pcmBase64) => fed.push(pcmBase64),
    finish: () => listeners.onFinalResult?.(pending),
    stop: () => undefined,
    unload: () => undefined,
    onResult: on('onResult'),
    onPartialResult: on('onPartialResult'),
    onFinalResult: on('onFinalResult'),
    onError: on('onError'),
  };

  return {
    vosk,
    started,
    fed,
    /** The decoder settling on its own, mid-utterance, as it does on silence. */
    settleOn: (text: string) => listeners.onResult?.(text),
    hearPartial: (text: string) => listeners.onPartialResult?.(text),
    leavePending: (text: string) => {
      pending = text;
    },
  };
}

function recognizerUnderTest() {
  const native = fakeVosk();
  const heard: Recognition[] = [];
  const recognizer = createVoskSpeechRecognizer({
    vosk: native.vosk,
    clock: virtualClock(),
    modelPath: 'model-fr',
  });

  return {
    ...native,
    heard,
    recognizer,
    listen: () => recognizer.start(['do', 'ré'], (r) => heard.push(r)),
  };
}

describe('encodeBase64Pcm', () => {
  it('writes the samples back as the 16-bit little-endian bytes the decoder reads', () => {
    const encoded = encodeBase64Pcm(Int16Array.from([0, 1, -1, 4_242]));

    expect(Array.from(Buffer.from(encoded, 'base64'))).toEqual([0, 0, 1, 0, 255, 255, 146, 16]);
  });

  it('pads a length that is not a multiple of three bytes', () => {
    expect(Buffer.from(encodeBase64Pcm(Int16Array.from([1])), 'base64')).toHaveLength(2);
  });
});

describe('createVoskSpeechRecognizer', () => {
  it('opens the session on the vocabulary plus a word for everything else', async () => {
    const { started, listen } = recognizerUnderTest();

    await listen();

    expect(started).toEqual([{ grammar: ['do', 'ré', '[unk]'], pushAudio: true }]);
  });

  it('reports what the decoder settled on as the final answer', async () => {
    const { heard, settleOn, listen } = recognizerUnderTest();

    await listen();
    settleOn('do');

    expect(heard).toEqual([{ kind: 'final', transcript: 'do', at: 0 }]);
  });

  it('reports a word from outside the vocabulary as no answer at all', async () => {
    const { heard, settleOn, listen } = recognizerUnderTest();

    await listen();
    settleOn('[unk]');

    expect(heard).toEqual([{ kind: 'final', transcript: null, at: 0 }]);
  });

  it('does not answer twice when the decoder has already settled', async () => {
    const { heard, settleOn, recognizer, listen } = recognizerUnderTest();

    await listen();
    settleOn('do');
    await recognizer.flush();

    expect(heard).toEqual([{ kind: 'final', transcript: 'do', at: 0 }]);
  });

  it('settles a silent utterance rather than leaving its caller waiting', async () => {
    const { heard, recognizer, listen } = recognizerUnderTest();

    await listen();
    await recognizer.flush();

    expect(heard).toEqual([{ kind: 'final', transcript: null, at: 0 }]);
  });

  it('answers a second utterance after the first one settled', async () => {
    const { heard, settleOn, recognizer, listen } = recognizerUnderTest();

    await listen();
    settleOn('do');
    await recognizer.flush();
    settleOn('ré');
    await recognizer.flush();

    expect(heard.map((it) => it.transcript)).toEqual(['do', 'ré']);
  });

  it('feeds the decoder the samples it was handed', async () => {
    const { fed, recognizer, listen } = recognizerUnderTest();

    await listen();
    recognizer.write(Int16Array.from([1, 2, 3]));

    expect(fed).toEqual([encodeBase64Pcm(Int16Array.from([1, 2, 3]))]);
  });

  it('passes partial results through as they come', async () => {
    const { heard, hearPartial, listen } = recognizerUnderTest();

    await listen();
    hearPartial('d');

    expect(heard).toEqual([{ kind: 'partial', transcript: 'd', at: 0 }]);
  });
});
