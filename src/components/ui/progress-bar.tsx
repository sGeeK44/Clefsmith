import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { Tone } from '@/components/ui/text';

/** A full bar: the share is read as a percentage of the track it is laid in. */
const WHOLE = 100;

/**
 * How far along something is, as a share between zero and one.
 *
 * It holds no number of its own: what the share means — notes read, files sent —
 * is the screen's business, and a bar that knew would be a bar per screen.
 *
 * `thin` is for a bar that sits under a line of a list, where the regular weight
 * reads as a second element rather than as a measure of the line above it.
 *
 * `tone` is the same vocabulary `Text` uses, so a bar and the figure beside it
 * can be given one colour and cannot drift apart — a red number on a blue bar
 * says two different things about the same note.
 */
export function ProgressBar({
  share,
  tone = 'ink',
  weight = 'regular',
}: {
  readonly share: number;
  readonly tone?: Tone;
  readonly weight?: 'regular' | 'thin';
}) {
  styles.useVariants({ tone, weight });

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${share * WHOLE}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  track: {
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radii.s,
    flex: 1,
    overflow: 'hidden',
    variants: { weight: { regular: { height: 6 }, thin: { height: 3 } } },
  },
  fill: {
    height: '100%',
    variants: {
      tone: {
        ink: { backgroundColor: theme.colors.ink },
        muted: { backgroundColor: theme.colors.muted },
        accent: { backgroundColor: theme.colors.accent },
        ok: { backgroundColor: theme.colors.ok },
        late: { backgroundColor: theme.colors.late },
        bad: { backgroundColor: theme.colors.bad },
      },
    },
  },
}));
