import { Stack } from "expo-router";

// Stack inside the Messages tab: chat list -> single chat
export default function MessagesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
