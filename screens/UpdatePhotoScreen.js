import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import AntDesign from '@expo/vector-icons/AntDesign';
const UpdatePhotoScreen = ({ navigation, route }) => {
  const [profilePhoto, setProfilePhoto] = useState(route?.params?.photo?.url || null);
  const [description, setDescription] = useState(route?.params?.photo?.description || "");
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!profilePhoto) {
      Alert.alert("Hata", "Lütfen bir fotoğraf seçin.");
      return;
    }

    setUploading(true);

    try {
      const userId = auth.currentUser.uid;
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const photos = userSnap.data().photos || [];
        const updatedPhotos = photos.map((photo) =>
          photo.url === route.params.photo.url
            ? { ...photo, url: profilePhoto, description }
            : photo
        );

        await updateDoc(userRef, { photos: updatedPhotos });

        Alert.alert("Başarılı", "Fotoğraf ve açıklama güncellendi!");
        navigation.goBack(); // ProfileScreen'e dön
      }
    } catch (error) {
      console.error("Fotoğraf güncellenirken hata oluştu:", error);
      Alert.alert("Hata", "Fotoğraf güncellenemedi. Tekrar deneyin.");
    } finally {
      setUploading(false);
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

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("İzin Verilmedi", "Galeriden fotoğraf seçmek için izin gereklidir.");
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

  return (
    <View style={styles.container}>
        <TouchableOpacity onPress={() =>navigation.goBack()} >
       <AntDesign name="arrowleft" size={24} color="black"  />
       </TouchableOpacity>
      <Text style={styles.label}>Açıklama</Text>
      <TextInput
        style={styles.input}
        placeholder="Açıklama yazın..."
        value={description}
        onChangeText={setDescription}
      />
      <Text style={styles.label}>Fotoğraf</Text>
      {profilePhoto ? (
        <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
      ) : (
        <Text>Fotoğraf seçilmedi.</Text>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleImagePick}>
          <Text style={styles.buttonText}>Fotoğrafı Değiştir</Text>
        </TouchableOpacity>
      </View>
      <Button title={uploading ? "Yükleniyor..." : "Kaydet"} onPress={handleSave} disabled={uploading} />
      {uploading && <ActivityIndicator size="large" color="#0000ff" />}
      
   
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop:"10%" },
  label: { fontSize: 16, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginBottom: 20 },
  profilePhoto: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  button: { backgroundColor: "#2196F3", padding: 10, borderRadius: 5 },
  buttonText: { color: "#fff", fontSize: 14 },
});

export default UpdatePhotoScreen;
