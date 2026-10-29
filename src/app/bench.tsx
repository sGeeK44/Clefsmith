import Constants from 'expo-constants';
import { Directory, File, Paths } from 'expo-file-system';
import { useState } from 'react';
import { Platform } from 'react-native';
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
 * Leaves a second copy of a report where `adb pull` can reach it, and says
 * where it is.
 *
 * iOS publishes its document directory through the Files application
 * (`UIFileSharingEnabled`), so a report written there is already reachable. On
 * Android that directory is private to the application, and the airplane-mode
 * criterion forces a release build, which is not debuggable — so `adb run-as`
 * cannot reach it either. The external files directory is the one place both
 * the application and `adb pull` can read.
 *
 * A copy rather than the original, because outside its own directories
 * `expo-file-system` reads permissions off the target itself: a file that does
 * not exist yet is not readable, so creating one there is refused, while
 * copying into a directory that does exist is not.
 */
async function publishForPull(report: File, name: string): Promise<string> {
  if (Platform.OS !== 'android') {
    return report.uri;
  }

  const packageName = Constants.expoConfig?.android?.package;

  if (packageName === undefined) {
    throw new Error('No Android package name in the embedded config.');
  }

  const directory = new Directory(`file:///sdcard/Android/data/${packageName}/files`);

  directory.create({ intermediates: true, idempotent: true });
  await report.copy(directory);

  return new File(directory, name).uri;
}

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
      const name = `speech-bench-${new Date().toISOString()}.json`;
      const file = new File(Paths.document, name);

      file.create({ overwrite: false });
      file.write(serializeSpeechBenchReport(speechBenchReport(CORPUS_MANIFEST, result)));

      setReport(await publishForPull(file, name));
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
