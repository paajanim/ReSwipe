import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Same API address as in messages/index.js
const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
const API_URL = `http://${host}:3000`;

export default function Chat() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [chat, setChat] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/chats/${id}`)
      .then((res) => res.json())
      .then((data) => setChat(data))
      .catch(() => setError("Chat could not be loaded. Is the API running?"));
  }, [id]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <SymbolView
            name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
            tintColor="#FFFFFF"
            size={24}
          />
        </Pressable>
        <View style={styles.avatar} />
        <Text style={styles.headerTitle}>{chat?.name ?? ""}</Text>
      </View>

      {!chat && !error && <ActivityIndicator style={styles.status} color="#00C8B3" />}
      {error && <Text style={styles.status}>{error}</Text>}

      <FlatList
        // inverted: list starts at the bottom, so the newest message is directly above the input
        inverted
        data={chat ? [...chat.messages].reverse() : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isMine = item.from === "me";
          return (
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
              <Text style={isMine ? styles.textMine : styles.textOther}>{item.text}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Write a message..."
          value={text}
          onChangeText={setText}
        />
        {/* Sending comes later (POST to the API) */}
        <Pressable style={styles.sendButton}>
          <SymbolView
            name={{ ios: "paperplane.fill", android: "send", web: "send" }}
            tintColor="#FFFFFF"
            size={20}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom:80,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00C8B3",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#C8C8CC",
    marginLeft: 12,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  status: {
    marginTop: 24,
    textAlign: "center",
    color: "#333333",
  },
  list: {
    padding: 12,
  },
  bubble: {
    maxWidth: "75%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "#EFEFF1",
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: "#00C8B3",
  },
  textOther: {
    color: "#333333",
    fontSize: 16,
  },
  textMine: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00C8B3",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
