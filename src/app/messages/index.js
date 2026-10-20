import { router, useFocusEffect } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "../../components/Avatar";
import { apiFetch } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

export default function Messages() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [chats, setChats] = useState(null);
  const [error, setError] = useState(null);

  // Reload every time the tab is opened, so chats from new likes show up.
  useFocusEffect(
    useCallback(() => {
      if (!token) {
        return;
      }

      apiFetch("/chats", { token })
        .then((data) => {
          setChats(data);
          setError(null);
        })
        .catch((e) => setError(e.message));
    }, [token])
  );

  const loading = chats === null && !error;

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
        data={chats ?? []}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          chats && <Text style={styles.status}>No chats yet. Like a product to start one.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push(`/messages/${item.id}`)}
          >
            <Avatar path={item.avatar} size={52} style={styles.avatar} />
            <View style={styles.textContainer}>
              <Text style={styles.name}>
                {item.name}
                <Text style={styles.postTitle}> · {item.postTitle}</Text>
              </Text>
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
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5B8B5E",
  },
  postTitle: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#888888",
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
