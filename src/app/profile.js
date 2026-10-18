import React, { useState } from "react";
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { usePosts } from "../context/PostsContext";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const [username] = useState("Juna");
  const [profileImage, setProfileImage] = useState(null);

  // Own posts, added via the upload on the Home screen.
  const { myPosts } = usePosts();

  const pickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Permission to access your photos is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const header = (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 30 }]}>
        <View>
          <View style={styles.avatar}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.placeholder}>
                <View style={styles.placeholderHead} />
                <View style={styles.placeholderBody} />
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={pickProfileImage}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.username}>{username}</Text>
      </View>

      <Text style={styles.sectionTitle}>YOUR POSTS</Text>
    </>
  );

  return (
    <FlatList
      style={styles.container}
      data={myPosts}
      keyExtractor={(item) => item.id.toString()}
      numColumns={2}
      ListHeaderComponent={header}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View style={styles.post}>
          <Image source={{ uri: item.image }} style={styles.postImage} />
          <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.postPrice}>{item.price}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>You have no posts yet.</Text>}
    />
  );
}

const GREEN = "#5A8F5C";
const LIGHT_GREEN = "#E6F0B8";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_GREEN,
  },

  content: {
    paddingBottom: 30,
  },

  header: {
    backgroundColor: GREEN,
    alignItems: "center",
    paddingBottom: 25,
    paddingHorizontal: 20,
  },

  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    alignItems: "center",
  },

  placeholderHead: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: "#000000",
    marginBottom: 6,
  },

  placeholderBody: {
    width: 80,
    height: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 4,
    borderColor: "#000000",
  },

  addButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#4CA65A",
    justifyContent: "center",
    alignItems: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    lineHeight: 28,
  },

  username: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 12,
  },

  sectionTitle: {
    color: GREEN,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
    marginHorizontal: 15,
  },

  row: {
    gap: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
  },

  post: {
    flex: 1,
    maxWidth: "50%",
  },

  postImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 10,
  },

  postTitle: {
    color: "#000000",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 6,
  },

  postPrice: {
    color: GREEN,
    fontSize: 14,
  },

  emptyText: {
    color: GREEN,
    fontSize: 15,
    marginHorizontal: 15,
  },
});
