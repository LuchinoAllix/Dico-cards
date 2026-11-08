import { StyleSheet, Text, View } from "react-native";

export default function Saved() {
  return (
    <View style={styles.container}>
      <Text>Saved TODO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
