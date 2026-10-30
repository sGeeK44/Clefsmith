import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

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
 */
export function ProgressBar({
  share,
  weight = 'regular',
}: {
  readonly share: number;
  readonly weight?: 'regular' | 'thin';
}) {
  styles.useVariants({ weight });

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
  fill: { backgroundColor: theme.colors.ink, height: '100%' },
}));
