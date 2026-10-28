import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

/**
 * The page every screen sits on: the background, the notch, the page gutter.
 *
 * The insets are read here rather than in each screen so that a screen which
 * forgets them does not exist.
 */
export function Screen({ children }: { readonly children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    backgroundColor: theme.colors.bg,
    flex: 1,
    gap: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
  },
}));
