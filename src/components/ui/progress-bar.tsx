import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/** A full bar: the share is read as a percentage of the track it is laid in. */
const WHOLE = 100;

/**
 * How far along something is, as a share between zero and one.
 *
 * It holds no number of its own: what the share means — notes read, files sent —
 * is the screen's business, and a bar that knew would be a bar per screen.
 */
export function ProgressBar({ share }: { readonly share: number }) {
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
    height: 6,
    overflow: 'hidden',
  },
  fill: { backgroundColor: theme.colors.ink, height: '100%' },
}));
