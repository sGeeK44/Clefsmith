import { describe, expect, it } from 'bun:test';

import {
  createAskForMicrophone,
  createMayListen,
  createShowMicrophoneSettings,
  type MicrophonePermission,
} from '@/usecases/microphone-access';

function permission(granted: boolean) {
  const done: string[] = [];

  const port: MicrophonePermission = {
    request: async () => {
      done.push('request');
      return granted;
    },
    granted: async () => {
      done.push('granted');
      return granted;
    },
    openSettings: async () => {
      done.push('openSettings');
    },
  };

  return { port, done };
}

describe('asking for the microphone', () => {
  it('puts the question and hands back what the learner answered', async () => {
    const { port, done } = permission(true);

    expect(await createAskForMicrophone(port)()).toBe(true);
    expect(done).toEqual(['request']);
  });

  it('hands back a refusal rather than swallowing it', async () => {
    const { port } = permission(false);

    expect(await createAskForMicrophone(port)()).toBe(false);
  });
});

describe('whether a session can be started', () => {
  it('reads the standing verdict without putting the question again', async () => {
    const { port, done } = permission(true);

    expect(await createMayListen(port)()).toBe(true);
    expect(done).toEqual(['granted']);
  });

  it('says no when the microphone is not granted', async () => {
    const { port } = permission(false);

    expect(await createMayListen(port)()).toBe(false);
  });
});

describe('the way out of a refusal', () => {
  it('opens the settings, and asks nothing on the way', async () => {
    const { port, done } = permission(false);

    await createShowMicrophoneSettings(port)();

    expect(done).toEqual(['openSettings']);
  });
});
