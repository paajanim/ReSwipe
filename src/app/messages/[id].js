import { router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import Avatar from "../../components/Avatar";
import { apiFetch } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

export default function Chat() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [chat, setChat] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    const message = text.trim();
    if (!message || sending) {
      return;
    }

    setSending(true);

    try {
      const created = await apiFetch(`/chats/${id}/messages`, { token, body: { text: message } });
      setChat((current) => ({ ...current, messages: [...current.messages, created] }));
      setText("");
    } catch (e) {
      Alert.alert("Message not sent", e.message);
    } finally {
      setSending(false);
    }
  };

  // Load the chat and check for new messages every 5 seconds while the chat is open.
  useEffect(() => {
    const load = () =>
      apiFetch(`/chats/${id}`, { token })
        .then((data) => {
          setChat(data);
          setError(null);
        })
        .catch((e) => setError(e.message));

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [id, token]);

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
        <Avatar path={chat?.avatar} size={36} style={styles.avatar} />
        <View>
          <Text style={styles.headerTitle}>{chat?.name ?? ""}</Text>
          {chat?.postTitle && <Text style={styles.headerSubtitle}>{chat.postTitle}</Text>}
        </View>
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
          const isMine = item.mine;
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
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!text.trim() || sending || !chat}
          hitSlop={8}
        >
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
    marginLeft: 12,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#E6FFFB",
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
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
