import { useEffect } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Text } from '@/components/ui/text';

/**
 * A message that says something and then takes itself away.
 *
 * It is not a dialog: nothing has to be dismissed and nothing is blocked while it
 * is up. A message that needs an answer is a screen, not this one.
 *
 * It sits at the bottom of the page it is placed on, over whatever is there,
 * which is why the page does not reflow when one appears.
 */

const SHOWN_FOR = 2500;

export function Flash({
  message,
  onGone,
}: {
  readonly message: string | undefined;
  readonly onGone: () => void;
}) {
  useEffect(() => {
    if (message === undefined) {
      return;
    }

    const timer = setTimeout(onGone, SHOWN_FOR);

    return () => clearTimeout(timer);
  }, [message, onGone]);

  if (message === undefined) {
    return null;
  }

  return (
    <View accessibilityLiveRegion="polite" style={styles.flash} testID="flash">
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  flash: {
    backgroundColor: theme.colors.ink,
    borderRadius: theme.radii.pill,
    bottom: theme.spacing.l,
    left: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.s,
    position: 'absolute',
    right: theme.spacing.m,
  },
  message: { color: theme.colors.bg, textAlign: 'center' },
}));
