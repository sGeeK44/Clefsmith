import type { ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/** A raised surface: the only component that knows what "raised" looks like. */
export function Card({ children }: { readonly children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surf,
    borderColor: theme.colors.line,
    borderRadius: theme.radii.m,
    borderWidth: 1,
    gap: theme.spacing.s,
    padding: theme.spacing.m,
  },
}));
