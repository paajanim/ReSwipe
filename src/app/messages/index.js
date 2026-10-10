import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import Constants from "expo-constants";
import { router } from "expo-router";

// In development the phone reaches the API on the same computer that runs Expo.
// hostUri looks like "192.168.1.20:8081" – we take the IP and use port 3000 of the API.
const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
const API_URL = `http://${host}:3000`;

export default function Messages() {
  const insets = useSafeAreaInsets();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/chats`)
      .then((res) => res.json())
      .then((data) => setChats(data))
      .catch(() => setError("Chats could not be loaded. Is the API running?"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Pressable hitSlop={10}>
          <SymbolView
            name={{ ios: "magnifyingglass", android: "search", web: "search" }}
            tintColor="#FFFFFF"
            size={26}
          />
        </Pressable>
      </View>

      {loading && <ActivityIndicator style={styles.status} color="#00C8B3" />}
      {error && <Text style={styles.status}>{error}</Text>}

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push(`/messages/${item.id}`)}
          >
            <View style={styles.avatar} />
            <View style={styles.textContainer}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#00C8B3",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowPressed: {
    backgroundColor: "#F2F2F2",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#C8C8CC",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5B8B5E",
  },
  lastMessage: {
    fontSize: 14,
    color: "#333333",
    marginTop: 2,
  },
  status: {
    marginTop: 24,
    textAlign: "center",
    color: "#333333",
  },
  separator: {
    height: 1,
    backgroundColor: "#4A4A4A",
  },
});
