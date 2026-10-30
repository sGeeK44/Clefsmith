import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { AppState, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { EXERCISE } from '@/components/exercise-route';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { BACK, SETTINGS, TITLE, WHERE, WHY } from '@/components/wording/microphone';
import { SYMBOLS } from '@/infrastructure/symbols';

const PARCOURS = '/studies';

/**
 * Where a session stops when the microphone is not granted.
 *
 * It carries the session it was stopping, so granting the permission in the
 * system settings and coming back is the whole of what the learner has to do —
 * the exercise starts on the way in rather than asking them to set it up again.
 *
 * The verdict is re-read when the application comes back to the foreground,
 * because that is the only moment it can have changed: the settings are another
 * application, and nothing tells this one what happened there.
 */
export default function MicrophoneScreen() {
  const session = useLocalSearchParams<Record<string, string>>();
  const readAccess = useService(SYMBOLS.usecases.ReadMicrophoneAccess);
  const showSettings = useService(SYMBOLS.usecases.ShowMicrophoneSettings);

  const open = useCallback(async () => {
    if ((await readAccess()) === 'granted') {
      router.replace({ pathname: EXERCISE, params: session });
    }
  }, [readAccess, session]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void open();
      }
    });

    return () => subscription.remove();
  }, [open]);

  return (
    <Screen>
      <Text variant="display">{TITLE}</Text>

      <Card>
        <Text tone="muted">{WHY}</Text>
      </Card>

      <Text tone="muted">{WHERE}</Text>

      <View style={styles.spacer} />

      <Button label={SETTINGS} onPress={() => void showSettings()} testID="microphone-settings" />
      <Button
        emphasis="quiet"
        label={BACK}
        onPress={() => router.replace(PARCOURS)}
        testID="microphone-back"
      />
    </Screen>
  );
}

const styles = StyleSheet.create(() => ({
  spacer: { flex: 1 },
}));
