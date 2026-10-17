import { View, Text, StyleSheet } from 'react-native'
export default function ProfileTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🙏 Profile coming soon</Text>
    </View>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9F5' },
  text: { fontSize: 16, color: '#888' },
})
