import { File, Paths } from 'expo-file-system';
import { useState } from 'react';
import * as vosk from 'react-native-vosk';
import { createBundledCorpusAudio } from '@/components/speech-bench/bundled-corpus-audio';
import { CORPUS_ASSETS, CORPUS_MANIFEST } from '@/components/speech-bench/corpus-assets';
import { expoBundle } from '@/components/speech-bench/expo-bundle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { systemClock } from '@/infrastructure/system-clock';
import { createVoskSpeechRecognizer } from '@/infrastructure/vosk-speech-recognizer';
import { createReplaySpeechCorpus } from '@/usecases/replay-speech-corpus';
import { serializeSpeechBenchReport, speechBenchReport } from '@/usecases/speech-bench-report';

/**
 * The folder the Vosk model is unpacked from, placed into the native build by
 * the `react-native-vosk` config plugin. It is not downloaded: a run has to
 * hold in airplane mode, which is one of the things being measured.
 */
const MODEL_PATH = 'vosk-model-small-fr-0.22';

/**
 * Runs the speech bench on this device and leaves its report behind.
 *
 * Not a product screen, and nothing links to it: CLE-12 to CLE-14 inherit
 * nothing from here. It exists because the figures CLE-17 decides on have to be
 * measured on the hardware the application runs on, and a host cannot stand in
 * for that.
 *
 * It is reachable only in a development build, or in a release build started
 * with `EXPO_PUBLIC_SPEECH_BENCH=1` — the airplane-mode run needs a release
 * build, because a development build serves its assets from the Metro server
 * over the network.
 */
export default function SpeechBenchScreen() {
  const [status, setStatus] = useState('Ready.');
  const [report, setReport] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  if (!__DEV__ && process.env.EXPO_PUBLIC_SPEECH_BENCH !== '1') {
    return (
      <Screen>
        <Text variant="title">Speech bench</Text>
        <Text tone="muted">
          Off in this build. Start a release build with EXPO_PUBLIC_SPEECH_BENCH=1.
        </Text>
      </Screen>
    );
  }

  const run = async () => {
    setRunning(true);
    setReport(null);
    setStatus(`Replaying ${CORPUS_MANIFEST.recordings.length} recordings…`);

    try {
      const audio = createBundledCorpusAudio({
        bundle: expoBundle,
        sampleRate: CORPUS_MANIFEST.sampleRate,
        assets: CORPUS_ASSETS,
      });
      const recognizer = createVoskSpeechRecognizer({
        vosk,
        clock: systemClock,
        modelPath: MODEL_PATH,
      });

      const result = await createReplaySpeechCorpus(systemClock, audio)(
        CORPUS_MANIFEST,
        recognizer,
      );

      /**
       * Named after the instant it was produced, never overwritten: two runs of
       * the same build are what tells a figure apart from a fluctuation, and a
       * report that replaces the previous one makes that comparison impossible.
       */
      const file = new File(Paths.document, `speech-bench-${new Date().toISOString()}.json`);

      file.create({ overwrite: false });
      file.write(serializeSpeechBenchReport(speechBenchReport(CORPUS_MANIFEST, result)));

      setReport(file.uri);
      setStatus('Done.');
    } catch (error) {
      setStatus(`Failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Screen>
      <Text variant="display">Speech bench</Text>
      <Text variant="caption" tone="muted">
        Vosk · {MODEL_PATH}
      </Text>

      <Card>
        <Text variant="title">Run</Text>
        <Text>{status}</Text>
        <Button
          label={running ? 'Running…' : 'Replay the corpus'}
          onPress={running ? undefined : run}
        />
      </Card>

      {report === null ? null : (
        <Card>
          <Text variant="title">Report</Text>
          <Text variant="caption" tone="muted">
            {report}
          </Text>
        </Card>
      )}
    </Screen>
  );
}
