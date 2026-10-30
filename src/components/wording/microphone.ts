import type { MicrophoneRefusal } from '@/usecases/microphone-access';

/**
 * What the screen says when the microphone is not granted.
 *
 * It explains rather than apologises, and it offers one way forward. There is
 * no second offer: a touch fallback would contradict the mode, and an exercise
 * answered by hand is not the exercise.
 */
export const TITLE = 'Le micro est nécessaire';

export const WHY =
  "La lecture de notes se répond à voix haute : vous dites le nom de la note affichée, et l'application l'entend. Sans micro, il n'y a pas d'exercice.";

/**
 * Where to go next depends on whether the system will still put its question.
 * It only ever says one of the two: sending a learner to a settings page that
 * has no microphone row is sending them to look for nothing.
 */
export const WHERE: Record<MicrophoneRefusal, string> = {
  askable: "Autorisez le micro, et l'exercice démarre tout de suite.",
  blocked:
    "Autorisez le micro dans les réglages de l'application, puis revenez : l'exercice démarre tout seul.",
};

export const ALLOW: Record<MicrophoneRefusal, string> = {
  askable: 'Autoriser le micro',
  blocked: 'Ouvrir les réglages',
};

export const BACK = 'Retour';
