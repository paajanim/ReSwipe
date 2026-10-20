import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { imageUrl } from "../config/api";

// Round profile picture. Without a picture it shows the person icon from the profile.
// path: avatar path from the API ("/uploads/..."), or null
export default function Avatar({ path, size = 52, style }) {
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (path) {
    return <Image source={{ uri: imageUrl(path) }} style={[styles.avatar, circle, style]} />;
  }

  // The icon is designed for a 150px avatar and scaled to the wanted size.
  const scale = size / 150;
  const border = Math.max(1.5, 4 * scale);

  return (
    <View style={[styles.avatar, circle, style]}>
      <View
        style={{
          width: 44 * scale,
          height: 44 * scale,
          borderRadius: 22 * scale,
          borderWidth: border,
          borderColor: "#000000",
          marginBottom: 6 * scale,
        }}
      />
      <View
        style={{
          width: 80 * scale,
          height: 40 * scale,
          borderTopLeftRadius: 40 * scale,
          borderTopRightRadius: 40 * scale,
          borderBottomLeftRadius: 10 * scale,
          borderBottomRightRadius: 10 * scale,
          borderWidth: border,
          borderColor: "#000000",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
});
