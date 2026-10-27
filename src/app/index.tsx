import { StyleSheet, Text, View } from 'react-native';

export default function RootScreen() {
  return (
    <View style={styles.screen}>
      <Text>Clefsmith</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});
