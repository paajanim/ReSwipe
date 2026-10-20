import React, { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import Avatar from "../components/Avatar";
import UploadModal from "../components/UploadModal";
import { imageUrl } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../context/PostsContext";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, uploadAvatar, logout } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  // Post that is open in the edit modal. Kept after closing, so the modal does not change while it slides out.
  const [editingPost, setEditingPost] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  // New key on every open, so the form starts from the saved post.
  const [editKey, setEditKey] = useState(0);

  // Own posts from the API, new uploads from the Home screen are added directly.
  const { myPosts, updatePost, deletePost } = usePosts();

  const editPost = (post) => {
    setEditingPost(post);
    setEditKey((key) => key + 1);
    setShowEdit(true);
  };

  const confirmDelete = (post) => {
    Alert.alert("Delete post?", `"${post.title}" will no longer be shown. Your chats about it stay.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePost(post.id).catch((e) => Alert.alert("Delete failed", e.message)),
      },
    ]);
  };

  const openPostMenu = (post) => {
    Alert.alert(post.title, undefined, [
      { text: "Edit", onPress: () => editPost(post) },
      { text: "Delete (sold)", style: "destructive", onPress: () => confirmDelete(post) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

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

    if (result.canceled) {
      return;
    }

    setUploadingAvatar(true);

    try {
      await uploadAvatar(result.assets[0]);
    } catch (e) {
      Alert.alert("Upload failed", e.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // The login screen lives on the Home tab, so go there right away.
  const handleLogout = () => {
    router.navigate("/");
    logout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.header, { paddingTop: insets.top + 30 }]}>
        <View>
          {uploadingAvatar ? (
            <View style={styles.avatar}>
              <ActivityIndicator size="large" color={GREEN} />
            </View>
          ) : (
            <Avatar path={user?.avatar} size={150} />
          )}

          <TouchableOpacity style={styles.addButton} onPress={pickProfileImage} disabled={uploadingAvatar}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.username}>{user?.username}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        YOUR POSTS <Text style={styles.sectionCount}>{myPosts.length}</Text>
      </Text>

      {/* Horizontal slider, snaps to each card */}
      <FlatList
        horizontal
        data={myPosts}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slider}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.post} onPress={() => openPostMenu(item)} activeOpacity={0.8}>
            <Image source={{ uri: imageUrl(item.image) }} style={styles.postImage} />
            {/* Shows that the card can be tapped for edit / delete */}
            <View style={styles.menuBadge}>
              <SymbolView
                name={{ ios: "ellipsis", android: "more_horiz", web: "more_horiz" }}
                tintColor="#FFFFFF"
                size={16}
              />
            </View>
            <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.postPrice}>{item.price}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>You have no posts yet.</Text>}
      />

      {editingPost && (
        <UploadModal
          key={editKey}
          post={editingPost}
          visible={showEdit}
          onClose={() => setShowEdit(false)}
          onUpload={(fields) => updatePost(editingPost.id, fields)}
        />
      )}
    </ScrollView>
  );
}

const CARD_WIDTH = 150;
const CARD_GAP = 12;

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

  logoutButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: LIGHT_GREEN,
  },

  logoutText: {
    color: LIGHT_GREEN,
    fontWeight: "bold",
  },

  sectionTitle: {
    color: GREEN,
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
    marginHorizontal: 15,
  },

  sectionCount: {
    color: "#8AA88B",
  },

  slider: {
    gap: CARD_GAP,
    paddingHorizontal: 15,
  },

  post: {
    width: CARD_WIDTH,
  },

  postImage: {
    width: CARD_WIDTH,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  menuBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
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
  },
});
