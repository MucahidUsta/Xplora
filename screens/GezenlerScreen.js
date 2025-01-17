import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
} from "react-native";
import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FontAwesome6 } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";

const GezenlerScreen = ({ route }) => {
  const { userId } = route.params;
  const [userData, setUserData] = useState({
    username: "Kullanıcı Adı",
    profilePhoto: "",
  });
  const [photos, setPhotos] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userPhotos = userSnap
            .data()
            .photos?.map((photo, index) => ({
              ...photo,
              id: photo.id || `photo-${index}`, // Benzersiz `id` oluştur
            }));
          setPhotos(userPhotos);
          setUserData(userSnap.data());
        } else {
          Alert.alert("Hata", "Kullanıcı bulunamadı.");
        }
      } catch (error) {
        console.error("Kullanıcı bilgileri yüklenirken hata:", error);
        Alert.alert("Hata", "Kullanıcı bilgileri yüklenemedi.");
      }
    };

    fetchUserProfile();
  }, [userId]);

  const openInGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Hata", "Google Maps açılamadı.");
    });
  };

  const renderPhotoItem = ({ item }) => (
    <View style={styles.photoContainer}>
      <Image source={{ uri: item.url }} style={styles.photo} />
      <Text style={styles.photoDescription}>
        {item.description || "Açıklama yok"}
      </Text>
      {item.location ? (
        <Text style={styles.photoLocation}>
          Konuma Git: {item.location.latitude.toFixed(2)},{" "}
          {item.location.longitude.toFixed(2)}
        </Text>
      ) : (
        <Text style={styles.photoLocation}>Konum bilgisi yok</Text>
      )}
      <TouchableOpacity
        style={styles.mapIcon}
        onPress={() =>
          openInGoogleMaps(item.location.latitude, item.location.longitude)
        }
      >
        <MaterialCommunityIcons name="location-enter" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Yorumlar", { userId, photoId: item.id })
        }
      >
        <View style={{ marginTop: 15 }}>
          <FontAwesome6 name="comment-alt" size={25} color="white" />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Geri Butonu */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        <Image
          source={{
            uri: userData?.profilePhoto || "https://via.placeholder.com/150",
          }}
          style={styles.profilePhoto}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.username}>
            {typeof userData?.username === "string"
              ? userData.username
              : "Kullanıcı Adı"}
          </Text>
        </View>
      </View>
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.photoList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: "10%",
    backgroundColor: "#0C0F14",
  },
  backButton: {
    position: "absolute",
    marginBottom: "25%",
   

    borderRadius: 30,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop: 20,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  photoList: {
    padding: 10,
  },
  photoContainer: {
    marginBottom: 20,
    backgroundColor: "#1e1e1e",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  photoDescription: {
    fontSize: 14,
    color: "white",
    marginBottom: 5,
  },
  photoLocation: {
    fontSize: 12,
    color: "white",
    bottom: 20,
    marginLeft: "50%",
  },
  mapIcon: {
    bottom: 40,
    marginLeft: "90%",
  },
});

export default GezenlerScreen;
