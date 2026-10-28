import { StyleSheet, Text, View } from 'react-native';

import { useService } from '@/components/container-provider';
import { SYMBOLS } from '@/infrastructure/symbols';

export default function RootScreen() {
  const getAppVersion = useService(SYMBOLS.usecases.GetAppVersion);

  return (
    <View style={styles.screen}>
      <Text testID="app-version">Clefsmith {getAppVersion()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});
const unused: any = 1
