import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

// Input with a label above it. The border turns teal while the field is focused.
function Field({ label, ...inputProps }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        placeholderTextColor="#9AA59B"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...inputProps}
      />
    </View>
  );
}

// Full screen Login / Sign up. Shown as long as nobody is logged in.
export default function AuthModal({ visible, onLoggedIn }) {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (signUp) => {
    setIsSignUp(signUp);
    setError(null);
  };

  const handleSubmit = async () => {
    const missing = isSignUp
      ? !username.trim() || !email.trim() || !password
      : !email.trim() || !password;

    if (missing) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        await register(username.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      setPassword("");
      onLoggedIn?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade">
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.logo}>ReSwipe</Text>

          <View style={styles.card}>
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, !isSignUp && styles.tabActive]}
                onPress={() => switchMode(false)}
              >
                <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>Login</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, isSignUp && styles.tabActive]}
                onPress={() => switchMode(true)}
              >
                <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>Sign Up</Text>
              </Pressable>
            </View>

            <Text style={styles.title}>{isSignUp ? "Create your account" : "Welcome back"}</Text>
            <Text style={styles.subtitle}>
              {isSignUp ? "Start selling and finding things near you." : "Log in to keep swiping."}
            </Text>

            {isSignUp && (
              <Field
                label="Username"
                placeholder="e.g. juna"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}

            <Field
              label={isSignUp ? "Email" : "Email or username"}
              placeholder={isSignUp ? "you@example.com" : "you@example.com or juna"}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={isSignUp ? "email-address" : "default"}
            />

            <Field
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.button, (pressed || submitting) && styles.buttonPressed]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>{isSignUp ? "Create account" : "Log in"}</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const GREEN = "#5B8B5E";
const TEAL = "#00C8B3";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GREEN,
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  logo: {
    fontSize: 44,
    fontWeight: "bold",
    color: TEAL,
    textAlign: "center",
    marginBottom: 28,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#EEF3EC",
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  tabActive: {
    backgroundColor: GREEN,
  },

  tabText: {
    fontSize: 15,
    fontWeight: "bold",
    color: GREEN,
  },

  tabTextActive: {
    color: "#FFFFFF",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2D20",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7A6C",
    marginTop: 4,
    marginBottom: 20,
  },

  field: {
    marginBottom: 14,
  },

  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: GREEN,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
    marginLeft: 4,
  },

  input: {
    backgroundColor: "#F6F8F4",
    borderWidth: 1.5,
    borderColor: "#E1E8DE",
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1F2D20",
  },

  inputFocused: {
    borderColor: TEAL,
    backgroundColor: "#FFFFFF",
  },

  errorBox: {
    backgroundColor: "#FDECEC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },

  errorText: {
    color: "#C0392B",
    fontSize: 14,
    textAlign: "center",
  },

  button: {
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
});
