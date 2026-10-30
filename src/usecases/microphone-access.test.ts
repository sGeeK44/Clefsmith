import { describe, expect, it } from 'bun:test';

import {
  accessOf,
  createAskForMicrophone,
  createReadMicrophoneAccess,
  createShowMicrophoneSettings,
  type MicrophoneAccess,
  type MicrophonePermission,
} from '@/usecases/microphone-access';

function permission(access: MicrophoneAccess) {
  const done: string[] = [];

  const port: MicrophonePermission = {
    request: async () => {
      done.push('request');
      return access;
    },
    read: async () => {
      done.push('read');
      return access;
    },
    openSettings: async () => {
      done.push('openSettings');
    },
  };

  return { port, done };
}

describe('asking for the microphone', () => {
  it('puts the question and hands back what the learner answered', async () => {
    const { port, done } = permission('granted');

    expect(await createAskForMicrophone(port)()).toBe('granted');
    expect(done).toEqual(['request']);
  });

  it('hands back a refusal rather than swallowing it', async () => {
    const { port } = permission('blocked');

    expect(await createAskForMicrophone(port)()).toBe('blocked');
  });
});

describe('whether a session can be started', () => {
  it('reads the standing verdict without putting the question again', async () => {
    const { port, done } = permission('granted');

    expect(await createReadMicrophoneAccess(port)()).toBe('granted');
    expect(done).toEqual(['read']);
  });

  it('tells a refusal that can be asked again from one that cannot', async () => {
    expect(await createReadMicrophoneAccess(permission('askable').port)()).toBe('askable');
    expect(await createReadMicrophoneAccess(permission('blocked').port)()).toBe('blocked');
  });
});

describe('the way out of a refusal', () => {
  it('opens the settings, and asks nothing on the way', async () => {
    const { port, done } = permission('blocked');

    await createShowMicrophoneSettings(port)();

    expect(done).toEqual(['openSettings']);
  });
});

describe('reading a platform answer', () => {
  it('is granted when the platform granted it', () => {
    expect(accessOf({ granted: true, canAskAgain: false })).toBe('granted');
  });

  it('is askable while the system would still put its question', () => {
    expect(accessOf({ granted: false, canAskAgain: true })).toBe('askable');
  });

  it('is blocked once the system has stopped asking', () => {
    expect(accessOf({ granted: false, canAskAgain: false })).toBe('blocked');
  });
});
