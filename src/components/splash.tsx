import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from '@/components/ui/text';
import { CLEF, MARK, NAME, TAGLINE } from '@/components/wording/splash';

/**
 * What the learner sees while the application decides where to open.
 *
 * It is drawn in React rather than configured as the native splash because the
 * native one is a single image on a colour: it cannot carry a type scale, and a
 * picture of the words would not follow the system's light. The two are made to
 * look alike so that the handover between them is not a flash.
 *
 * It takes the whole press area: a learner who has read it has no reason to
 * wait for the rest of it.
 */
export function Splash({ onSkip }: { readonly onSkip: () => void }) {
  return (
    <Pressable onPress={onSkip} style={styles.splash} testID="splash">
      <View style={styles.middle}>
        <View style={styles.badge}>
          <Text style={styles.clef}>{CLEF}</Text>
        </View>
        <Text variant="display">{NAME}</Text>
        <Text variant="body" tone="muted" style={styles.tagline}>
          {TAGLINE}
        </Text>
      </View>
      <Text variant="overline" tone="muted">
        {MARK}
      </Text>
    </Pressable>
  );
}

/** The mockup's own numbers: the badge, its corner, and the glyph inside it. */
const BADGE = 88;
const CORNER = 26;
const CLEF_SIZE = 46;

const styles = StyleSheet.create((theme) => ({
  badge: {
    alignItems: 'center',
    backgroundColor: theme.colors.ink,
    borderRadius: CORNER,
    height: BADGE,
    justifyContent: 'center',
    width: BADGE,
  },
  clef: { color: theme.colors.bg, fontSize: CLEF_SIZE, lineHeight: CLEF_SIZE * 1.2 },
  middle: { alignItems: 'center', flex: 1, gap: theme.spacing.m, justifyContent: 'center' },
  splash: {
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    bottom: 0,
    left: 0,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tagline: { textAlign: 'center' },
}));
