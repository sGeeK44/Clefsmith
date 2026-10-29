import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useService } from '@/components/container-provider';
import { Card } from '@/components/ui/card';
import { Choice, type Option } from '@/components/ui/choice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import type { Notation } from '@/domain/notation/naming';
import { SYMBOLS } from '@/infrastructure/symbols';

/** What the two notations are called to a learner, rather than to the code. */
const NOTATIONS: readonly Option<Notation>[] = [
  { value: 'syllabic', label: 'do ré mi' },
  { value: 'letters', label: 'C D E' },
];

const WELCOME = '/welcome';

/**
 * The settings, and the version.
 *
 * The chosen notation is read once on arrival and held here. Nothing else on the
 * device writes it, so re-reading after every write would only make the screen
 * flicker through a state it already knows.
 */
export default function SettingsScreen() {
  const getAppVersion = useService(SYMBOLS.usecases.GetAppVersion);
  const getSettings = useService(SYMBOLS.usecases.GetSettings);
  const chooseNotation = useService(SYMBOLS.usecases.ChooseNotation);
  const [notation, setNotation] = useState<Notation>();

  useEffect(() => {
    getSettings().then((settings) => setNotation(settings.notation));
  }, [getSettings]);

  const choose = useCallback(
    (chosen: Notation) => {
      setNotation(chosen);
      void chooseNotation(chosen);
    },
    [chooseNotation],
  );

  return (
    <Screen>
      <Text variant="display">Réglages</Text>

      <Card>
        <Choice label="Nom des notes" options={NOTATIONS} chosen={notation} onChoose={choose} />
      </Card>

      {/* Replaying it writes the mark again and never takes a study back. */}
      <Card>
        <Pressable onPress={() => router.push(WELCOME)} style={styles.row} testID="replay-welcome">
          <Text>Revoir l'introduction</Text>
          <View style={styles.spacer} />
          <Text tone="muted">›</Text>
        </Pressable>
      </Card>

      <Text testID="app-version" variant="caption" tone="muted">
        {getAppVersion()}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { alignItems: 'center', flexDirection: 'row', gap: theme.spacing.s },
  spacer: { flex: 1 },
}));
