import { describe, expect, it } from 'bun:test';
import { createAskForMicrophone } from '@/usecases/ask-for-microphone';

describe('asking for the microphone', () => {
  it('puts the question to the learner', async () => {
    let asked = 0;

    await createAskForMicrophone({ request: async () => void asked++ })();

    expect(asked).toBe(1);
  });
});
