import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
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

const RESET_TITLE = 'Réinitialiser la progression ?';
const RESET_BODY =
  'Les études ouvertes, la maîtrise de chaque note et le compte de séances sont effacés. Vos réglages sont conservés.';

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
  const resetProgress = useService(SYMBOLS.usecases.ResetProgress);
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

  /**
   * The only irreversible thing the application does, so the platform is asked to
   * put the question. A learner knows this dialog, its destructive button is
   * already red, and it brings its own accessibility — the same reason `Toggle`
   * lets the platform draw the switch.
   */
  const confirmReset = useCallback(() => {
    Alert.alert(RESET_TITLE, RESET_BODY, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Réinitialiser', style: 'destructive', onPress: () => void resetProgress() },
    ]);
  }, [resetProgress]);

  return (
    <Screen>
      <Text variant="display">Réglages</Text>

      <Card>
        <Choice label="Nom des notes" options={NOTATIONS} chosen={notation} onChoose={choose} />
      </Card>

      {/* One card, two rows: both are something done to the record rather than a
          setting held in it, and two cards would make them two subjects.
          Replaying the introduction writes the mark again and takes no study back. */}
      <Card>
        <Pressable onPress={() => router.push(WELCOME)} style={styles.row} testID="replay-welcome">
          <Text>Revoir l'introduction</Text>
          <View style={styles.spacer} />
          <Text tone="muted">›</Text>
        </Pressable>

        <View style={styles.rule} />

        <Pressable onPress={confirmReset} style={styles.row} testID="reset-progress">
          <Text tone="bad">Réinitialiser la progression</Text>
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
  /** The hairline between two rows of one card, drawn edge to edge of its padding. */
  rule: {
    backgroundColor: theme.colors.line,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -theme.spacing.m,
  },
  spacer: { flex: 1 },
}));
