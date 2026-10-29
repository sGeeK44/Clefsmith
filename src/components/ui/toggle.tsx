import { Switch, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Text } from '@/components/ui/text';

/**
 * One thing that is either on or off, with the label that says which thing.
 *
 * The platform draws the switch — it is a control a learner already knows how to
 * read, and a hand-drawn one loses the gesture and the accessibility that come
 * with it. Only its colours are ours.
 */
export function Toggle({
  label,
  on,
  onToggle,
  testID,
}: {
  readonly label: string;
  readonly on: boolean;
  readonly onToggle: (on: boolean) => void;
  readonly testID?: string;
}) {
  const { theme } = useUnistyles();

  return (
    <View style={styles.toggle}>
      <Text>{label}</Text>
      <Switch
        onValueChange={onToggle}
        testID={testID}
        thumbColor={theme.colors.surf}
        trackColor={{ false: theme.colors.line, true: theme.colors.accent }}
        value={on}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  toggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.s,
    justifyContent: 'space-between',
  },
}));
