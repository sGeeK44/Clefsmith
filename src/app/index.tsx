import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useService } from '@/components/container-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Staff } from '@/components/ui/staff';
import { Text } from '@/components/ui/text';
import type { Clef } from '@/domain/notation/clef';
import type { Note } from '@/domain/score/layout';
import { SYMBOLS } from '@/infrastructure/symbols';

/**
 * The design system, on a screen.
 *
 * It stands in for the real home screen until CLE-14 builds one, and it is how
 * the two themes are looked at: switch the system setting and every role on
 * this page moves at once. It keeps the version on screen because the e2e suite
 * looks for it.
 */
export default function RootScreen() {
  const getAppVersion = useService(SYMBOLS.usecases.GetAppVersion);

  return (
    <Screen>
      <Text variant="display">Clefsmith</Text>
      <Text testID="app-version" variant="caption" tone="muted">
        {getAppVersion()}
      </Text>

      <Card>
        <Text variant="title">Type scale</Text>
        <Text variant="body">Body — the size everything else is read against.</Text>
        <Text variant="caption" tone="muted">
          Caption — secondary, and never the only place something is said.
        </Text>
      </Card>

      <Card>
        <Text variant="title">Answers</Text>
        <Text tone="ok">Right</Text>
        <Text tone="late">Right, off the beat</Text>
        <Text tone="bad">Wrong</Text>
      </Card>

      <Card>
        <Text variant="title">Treble</Text>
        <Staff clef="treble" notes={EXTREMES.treble} />
      </Card>

      <Card>
        <Text variant="title">Bass</Text>
        <Staff clef="bass" notes={EXTREMES.bass} />
      </Card>

      <View style={styles.actions}>
        <Button label="Start" />
        <Button label="Later" emphasis="quiet" />
      </View>
    </Screen>
  );
}

/**
 * The widest the engine is asked to draw: four leger lines below the staff, four
 * above, and the current note in between. A clef that cannot show its own extremes
 * cannot show a level.
 */
const EXTREMES: Record<Clef, readonly Note[]> = {
  treble: notes(
    { degree: 'c', octave: 3 },
    { degree: 'c', octave: 4 },
    { degree: 'b', octave: 4 },
    { degree: 'g', octave: 5 },
    { degree: 'g', octave: 6 },
  ),
  bass: notes(
    { degree: 'e', octave: 1 },
    { degree: 'e', octave: 2 },
    { degree: 'd', octave: 3 },
    { degree: 'b', octave: 3 },
    { degree: 'b', octave: 4 },
  ),
};

/** The middle one is the current note, which is what the engine highlights. */
function notes(...pitches: readonly Note['pitch'][]): readonly Note[] {
  return pitches.map((pitch, index) => ({ pitch, current: index === 2 }));
}

const styles = StyleSheet.create((theme) => ({
  actions: { flexDirection: 'row', gap: theme.spacing.s },
}));
