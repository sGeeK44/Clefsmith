import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BAND } from '@/domain/training/beat';

/** The height of the track, and the two sides of the cursor riding on it. */
const TRACK = 10;
const CURSOR_WIDTH = 4;
const CURSOR_HEIGHT = 20;

const FROM = `${BAND.from * 100}%` as const;
const WIDTH = `${(BAND.to - BAND.from) * 100}%` as const;

/**
 * Where one answer fell against its beat, as a cursor on a track.
 *
 * The lit middle is the tolerance itself rather than a decoration: a learner who
 * reads the cursor inside it has read the rule the session scores them by. It
 * holds no rule of its own — where the cursor goes is the domain's business —
 * and it takes the width it is given.
 */
export function TimingMeter({ at }: { readonly at: number }) {
  return (
    <View style={styles.track} testID="timing-meter">
      <View style={styles.band} />
      <View style={[styles.cursor, { left: `${at * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  band: {
    backgroundColor: theme.colors.line,
    bottom: 0,
    left: FROM,
    position: 'absolute',
    top: 0,
    width: WIDTH,
  },
  cursor: {
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radii.s,
    height: CURSOR_HEIGHT,
    /** Half its width back, so the cursor is read by its middle and not its edge. */
    marginLeft: -CURSOR_WIDTH / 2,
    position: 'absolute',
    top: (TRACK - CURSOR_HEIGHT) / 2,
    width: CURSOR_WIDTH,
  },
  track: {
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radii.s,
    height: TRACK,
    justifyContent: 'center',
    width: '100%',
  },
}));
