import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";

import AntDesign from "@expo/vector-icons/AntDesign";

const EditProfile = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    try {
      const userId = auth.currentUser.uid;
      const userRef = doc(db, "users", userId);

      let photoUrl = profilePhoto;

      if (profilePhoto && !profilePhoto.startsWith("http")) {
        setUploading(true);
        photoUrl = await uploadToCloudinary(profilePhoto);
        setUploading(false);
      }

      const updateData = {
        username,
        ...(photoUrl && { profilePhoto: photoUrl }),
      };

      await setDoc(userRef, updateData, { merge: true });
      Alert.alert("Başarılı", "Profil güncellendi!");
      navigation.goBack();
    } catch (error) {
      console.error("Profil güncellenirken hata oluştu:", error);
      Alert.alert("Hata", "Profil güncellenemedi. Tekrar deneyin.");
    } finally {
      setUploading(false);
    }
  };

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "İzin Verilmedi",
        "Galeriden fotoğraf seçmek için izin gereklidir."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaType: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const pickFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("İzin Verilmedi", "Kamera kullanmak için izin gereklidir.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaType: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const uploadToCloudinary = async (uri) => {
    const formData = new FormData();
    formData.append("file", {
      uri: uri,
      type: "image/jpeg",
      name: "upload.jpg",
    });
    formData.append("upload_preset", "YOUR_PRESET");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/YOUR/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error("Failed to upload image");
    }
  };

  const handleImagePick = () => {
    Alert.alert(
      "Fotoğraf Seçimi",
      "Kamerayı mı yoksa galeriyi mi kullanmak istersiniz?",
      [
        { text: "Kamera", onPress: pickFromCamera },
        { text: "Galeri", onPress: pickFromGallery },
        { text: "İptal", style: "cancel" },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Navigation Buttons */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="black" style={{marginTop:25}} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("DeviceInfo")}>
          <AntDesign name="infocirlceo" size={24} color="black" style={{marginTop:15}}  />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={styles.profileContainer}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.placeholderPhoto}>
            <AntDesign name="user" size={50} color="#ccc" />
          </View>
        )}
        <TouchableOpacity style={styles.photoButton} onPress={handleImagePick}>
          <Text style={styles.photoButtonText}>Fotoğrafı Değiştir</Text>
        </TouchableOpacity>
      </View>

      {/* Input Fields */}
      <Text style={styles.label}>Kullanıcı Adı</Text>
      <TextInput
        style={styles.input}
        placeholder="Kullanıcı Adı"
        value={username}
        onChangeText={setUsername}
      />

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, uploading && styles.disabledButton]}
        onPress={handleSave}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Kaydet</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  placeholderPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  photoButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  photoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 20,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    alignItems: "center",
    borderRadius: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});

export default EditProfile;
