import type { Clock } from '@/core/clock';
import { degreeOf, type Notation, vocabularyOf } from '@/domain/notation/naming';
import { UNKNOWN, type VoskModule } from '@/infrastructure/vosk-speech-recognizer';
import type { AnswerSource, Heard } from '@/usecases/listen-for-answers';

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
export function createVoskAnswerSource(
  vosk: VoskModule,
  modelPath: string,
  clock: Clock,
): AnswerSource {
  return {
    async listen(notation: Notation, heard: Heard) {
      await vosk.loadModel(modelPath);

      /**
       * When the learner started saying the word the decoder is still chewing on.
       *
       * The first non-empty partial since the last answer, and only it: the
       * later ones refine the same word, and the decoder says nothing at all
       * until it has heard enough to guess. It is the closest thing to the start
       * of the utterance this module exposes — there are no timestamps in it —
       * and it is what keeps the decoder's own latency out of the verdict.
       */
      let startedAt: number | undefined;

      /**
       * Only final results are acted on. A partial is the decoder thinking out
       * loud: acting on one would answer for the learner halfway through a word,
       * and then answer again when they finished saying it.
       */
      const subscriptions = [
        vosk.onPartialResult((transcript) => {
          if (startedAt === undefined && transcript !== '') {
            startedAt = clock.now();
          }
        }),
        vosk.onResult((transcript) => {
          const degree = degreeOf(transcript, notation);
          const began = startedAt ?? clock.now();

          startedAt = undefined;

          if (degree !== undefined) {
            heard(degree, began);
          }
        }),
      ];

      await vosk.start({ grammar: [...vocabularyOf(notation), UNKNOWN], pushAudio: false });

      return async () => {
        for (const subscription of subscriptions) {
          subscription.remove();
        }

        vosk.stop();
        vosk.unload();
      };
    },
  };
}
