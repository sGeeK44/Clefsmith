import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { NOTES_PER_MEASURE } from '@/domain/training/session-settings';

const BEATS = Array.from({ length: NOTES_PER_MEASURE }, (_, beat) => beat);

/**
 * Where the measure is, as one marked dot out of four.
 *
 * A dot per beat rather than a number: the learner is reading a staff, and a
 * figure that changes four times a measure in the corner of their eye is read
 * instead of seen. It holds no count of its own — which beat is passing is the
 * session's business.
 */
export function Beat({ current }: { readonly current: number }) {
  return (
    <View style={styles.row} testID={`beat-${current}`}>
      {BEATS.map((beat) => (
        <View key={beat} style={[styles.dot, beat === current && styles.now]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.spacing.s, justifyContent: 'center' },
  dot: {
    backgroundColor: theme.colors.soft,
    borderRadius: theme.radii.s,
    height: 10,
    width: 10,
  },
  now: { backgroundColor: theme.colors.accent },
}));
