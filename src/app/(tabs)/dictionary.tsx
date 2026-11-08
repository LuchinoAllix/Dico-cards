import { StyleSheet, Text, View } from "react-native";

export default function Dictionary() {
  return (
    <View style={styles.container}>
      <Text>Dictionary TODO</Text>
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
