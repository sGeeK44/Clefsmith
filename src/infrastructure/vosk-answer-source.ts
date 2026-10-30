import { degreeOf, type Notation, vocabularyOf } from '@/domain/notation/naming';
import type { Degree } from '@/domain/notation/pitch';
import { UNKNOWN, type VoskModule } from '@/infrastructure/vosk-speech-recognizer';
import type { AnswerSource } from '@/usecases/listen-for-answers';

/**
 * The answers of a session, heard.
 *
 * A second adapter over the same native module, and that is deliberate. The one
 * CLE-17 left behind **measures**: the bench pushes it recorded PCM so that a run
 * is reproducible. This one **listens**: the native side opens the microphone
 * itself. Folding the two together would make the bench carry a mode it must
 * never take, and the measurement would stop being a measurement.
 *
 * The vocabulary is fixed when the session opens — the decoder compiles a grammar
 * at that point — so a session hears one notation from start to finish. Changing
 * notation is a new exercise, which is a new session.
 */
export function createVoskAnswerSource(vosk: VoskModule, modelPath: string): AnswerSource {
  return {
    async listen(notation: Notation, heard: (degree: Degree) => void) {
      await vosk.loadModel(modelPath);

      /**
       * Only final results are acted on. A partial is the decoder thinking out
       * loud: acting on one would answer for the learner halfway through a word,
       * and then answer again when they finished saying it.
       */
      const subscription = vosk.onResult((transcript) => {
        const degree = degreeOf(transcript, notation);

        if (degree !== undefined) {
          heard(degree);
        }
      });

      await vosk.start({ grammar: [...vocabularyOf(notation), UNKNOWN], pushAudio: false });

      return async () => {
        subscription.remove();
        vosk.stop();
        vosk.unload();
      };
    },
  };
}
