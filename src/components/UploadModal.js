import React, { useState } from "react";
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function UploadModal({ visible, onClose, onUpload }) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setImage(null);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Permission to access your photos is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handleUpload = () => {
    if (!title.trim() || !price.trim() || !image) {
      Alert.alert("Missing information", "Please add a title, a price and an image.");
      return;
    }

    onUpload({ title: title.trim(), price: `€${price.trim()}`, image });
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancel}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <Text style={styles.heading}>New Post</Text>

          <Text style={styles.label}>TITLE</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What are you selling?"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>PRICE</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="Price in €"
            placeholderTextColor="#888"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>IMAGE</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <>
                <Text style={styles.imagePickerPlus}>+</Text>
                <Text style={styles.imagePickerText}>Add image</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={handleUpload}>
              <Text style={[styles.buttonText, styles.uploadButtonText]}>Upload</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const GREEN = "#5B8B5E";
const LIGHT_GREEN = "#E6F0B8";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GREEN,
  },

  content: {
    padding: 20,
    paddingTop: 30,
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 25,
  },

  label: {
    color: LIGHT_GREEN,
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
    marginLeft: 10,
  },

  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 18,
    color: "#000",
  },

  imagePicker: {
    height: 220,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imagePickerPlus: {
    fontSize: 48,
    color: GREEN,
    lineHeight: 52,
  },

  imagePickerText: {
    fontSize: 16,
    color: GREEN,
    fontWeight: "bold",
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },

  button: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 10,
    width: "47%",
    alignItems: "center",
  },

  buttonText: {
    color: GREEN,
    fontWeight: "bold",
    fontSize: 16,
  },

  uploadButton: {
    backgroundColor: "#00C8B3",
  },

  uploadButtonText: {
    color: "#FFFFFF",
  },
});
